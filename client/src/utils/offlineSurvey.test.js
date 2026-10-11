import "fake-indexeddb/auto";
import assert from "node:assert/strict";
import test from "node:test";
import {
  cacheSurveyParcel,
  getCachedSurveyParcel,
  getCachedSurveys,
  lockOfflineVault,
  saveSurveyOffline,
  syncPendingSurveys,
  unlockOfflineVault
} from "./offlineSurvey.js";

const ownerId = "test-surveyor-1";
const vaultPassword = "OfflineSurveyTestPassword#2026";

const parcel = {
  parcelId: "FIELD-001",
  ulpin: "12345678901234",
  surveyNumber: "22/4",
  district: "Demo District",
  taluk: "Demo Taluk",
  village: "Demo Village",
  geoJson: {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [[
        [77.1, 12.9],
        [77.2, 12.9],
        [77.2, 13.0],
        [77.1, 13.0],
        [77.1, 12.9]
      ]]
    },
    properties: {}
  }
};

test("persists offline field observations and cadastral coordinates", async () => {
  await unlockOfflineVault(ownerId, vaultPassword);
  await cacheSurveyParcel(parcel, ownerId);
  const storedParcel = await getCachedSurveyParcel(parcel.parcelId, ownerId);
  assert.deepEqual(storedParcel.geoJson, parcel.geoJson);

  const survey = await saveSurveyOffline({
    parcelId: parcel.parcelId,
    ownerId,
    surveyDate: "2026-09-26T10:00:00.000Z",
    observations: "Boundary stone found at north-east corner.",
    observedCoordinate: { latitude: 12.95, longitude: 77.15 },
    parentGeoJson: storedParcel.geoJson,
    parcelReferences: { surveyNumber: storedParcel.surveyNumber }
  });

  const records = await getCachedSurveys(ownerId);
  await assert.rejects(() => getCachedSurveys("another-surveyor"), /Unlock the offline survey vault/);
  assert.equal(records.length, 1);
  assert.equal(records[0].offlineId, survey.offlineId);
  assert.equal(records[0].status, "pending");
  assert.deepEqual(records[0].parentGeoJson, parcel.geoJson);
  assert.equal(records[0].observedCoordinate.latitude, 12.95);

  const database = await new Promise((resolve, reject) => {
    const request = indexedDB.open("landstack-field-surveys");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  const rawRecords = await new Promise((resolve, reject) => {
    const request = database.transaction("surveys", "readonly").objectStore("surveys").getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  assert.equal(rawRecords[0].encrypted, true);
  assert.equal("observations" in rawRecords[0], false);
  const rawParcel = await new Promise((resolve, reject) => {
    const request = database.transaction("survey-parcels-encrypted", "readonly")
      .objectStore("survey-parcels-encrypted")
      .get(`${ownerId}:${parcel.parcelId}`);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  assert.equal(rawParcel.encrypted, true);
  assert.equal("geoJson" in rawParcel, false);
  await new Promise((resolve, reject) => {
    const transaction = database.transaction("survey-parcels", "readwrite");
    transaction.objectStore("survey-parcels").put({
      parcelId: "LEGACY-001",
      surveyNumber: "4/1",
      geoJson: parcel.geoJson
    });
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
  lockOfflineVault(ownerId);
  await unlockOfflineVault(ownerId, vaultPassword);
  const migratedParcel = await getCachedSurveyParcel("LEGACY-001", ownerId);
  assert.deepEqual(migratedParcel.geoJson, parcel.geoJson);
});

test("retains failed submissions and synchronizes them on retry", async () => {
  await unlockOfflineVault(ownerId, vaultPassword);
  const initial = (await getCachedSurveys(ownerId))[0];
  let online = false;
  let submitted = 0;
  const submit = async (survey) => {
    if (!online) throw new Error("Network unavailable");
    assert.equal(survey.offlineId, initial.offlineId);
    submitted += 1;
    return { accepted: true };
  };

  const offlineAttempt = await syncPendingSurveys(submit, ownerId);
  assert.deepEqual(offlineAttempt, { synchronized: 0, failed: 1, skipped: false });
  let [saved] = await getCachedSurveys(ownerId);
  assert.equal(saved.status, "failed");
  assert.equal(saved.syncAttempts, 1);
  assert.equal(saved.lastSyncError, "Network unavailable");

  online = true;
  const reconnectAttempt = await syncPendingSurveys(submit, ownerId);
  assert.deepEqual(reconnectAttempt, { synchronized: 1, failed: 0, skipped: false });
  [saved] = await getCachedSurveys(ownerId);
  assert.equal(saved.status, "synchronized");
  assert.equal(saved.syncAttempts, 2);
  assert.ok(saved.synchronizedAt);
  assert.equal(saved.lastSyncError, "");
  assert.equal(submitted, 1);
});

test("rejects surveys without required local parcel geometry or observations", async () => {
  await unlockOfflineVault(ownerId, vaultPassword);
  await assert.rejects(
    () => saveSurveyOffline({ parcelId: "MISSING", observations: "No geometry" }),
    /parcel and its cached cadastral geometry are required/
  );
  await assert.rejects(
    () => saveSurveyOffline({
      parcelId: parcel.parcelId,
      ownerId,
      observations: "",
      parentGeoJson: parcel.geoJson
    }),
    /Enter field observations/
  );
});

test("requires the correct account password to unlock encrypted records", async () => {
  lockOfflineVault(ownerId);
  await assert.rejects(
    () => unlockOfflineVault(ownerId, "incorrect password"),
    /offline vault password is incorrect/
  );
  await unlockOfflineVault(ownerId, vaultPassword);
  assert.equal((await getCachedSurveys(ownerId))[0].ownerId, ownerId);
});
