const DATABASE_NAME = "landstack-field-surveys";
const DATABASE_VERSION = 3;
const SURVEYS_STORE = "surveys";
const PARCELS_STORE = "survey-parcels-encrypted";
const LEGACY_PARCELS_STORE = "survey-parcels";
const VAULTS_STORE = "vaults";
const VAULT_CHECK = "landstack-offline-vault-v1";
const VAULT_KDF_ITERATIONS = 600000;
const LEGACY_KDF_ITERATIONS = 310000;
const encoder = new TextEncoder();
const decoder = new TextDecoder();

let databasePromise;
let syncInProgress = false;
const unlockedVaults = new Map();

const getCrypto = () => {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Secure offline survey encryption is not available in this browser.");
  }
  return globalThis.crypto;
};

const openDatabase = () => {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("This browser does not support persistent offline survey storage."));
  }

  if (!databasePromise) {
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
      request.onupgradeneeded = () => {
        const database = request.result;
        const surveys = database.objectStoreNames.contains(SURVEYS_STORE)
          ? request.transaction.objectStore(SURVEYS_STORE)
          : database.createObjectStore(SURVEYS_STORE, { keyPath: "offlineId" });
        if (!surveys.indexNames.contains("status")) surveys.createIndex("status", "status");
        if (!surveys.indexNames.contains("parcelId")) surveys.createIndex("parcelId", "parcelId");
        if (!database.objectStoreNames.contains(PARCELS_STORE)) {
          database.createObjectStore(PARCELS_STORE, { keyPath: "recordKey" });
        }
        if (!database.objectStoreNames.contains(LEGACY_PARCELS_STORE)) {
          database.createObjectStore(LEGACY_PARCELS_STORE, { keyPath: "parcelId" });
        }
        if (!database.objectStoreNames.contains(VAULTS_STORE)) {
          database.createObjectStore(VAULTS_STORE, { keyPath: "ownerId" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        databasePromise = null;
        reject(request.error || new Error("Unable to open offline survey storage."));
      };
      request.onblocked = () => {
        databasePromise = null;
        reject(new Error("Offline survey storage upgrade is blocked by another open tab."));
      };
    });
  }
  return databasePromise;
};

const runTransaction = async (storeName, mode, operation) => {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, mode);
    const store = transaction.objectStore(storeName);
    let result;
    try {
      result = operation(store);
    } catch (error) {
      reject(error);
      return;
    }
    transaction.oncomplete = () => resolve(result?.result);
    transaction.onerror = () => reject(transaction.error || new Error("Offline survey storage transaction failed."));
    transaction.onabort = () => reject(transaction.error || new Error("Offline survey storage transaction was aborted."));
  });
};

const deriveVaultKey = async (password, salt, iterations = VAULT_KDF_ITERATIONS) => {
  const crypto = getCrypto();
  const material = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
};

const encryptPayload = async (key, payload, additionalData) => {
  const crypto = getCrypto();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const algorithm = { name: "AES-GCM", iv };
  if (additionalData) algorithm.additionalData = encoder.encode(additionalData);
  const ciphertext = await crypto.subtle.encrypt(
    algorithm,
    key,
    encoder.encode(JSON.stringify(payload))
  );
  return { iv, ciphertext };
};

const decryptPayload = async (key, iv, ciphertext, additionalData) => {
  const algorithm = { name: "AES-GCM", iv };
  if (additionalData) algorithm.additionalData = encoder.encode(additionalData);
  const plaintext = await getCrypto().subtle.decrypt(algorithm, key, ciphertext);
  return JSON.parse(decoder.decode(plaintext));
};

const encryptRecord = async (record, ownerId, identityKey) => {
  const payload = { ...record };
  delete payload[identityKey];
  delete payload.ownerId;
  const additionalData = `${ownerId}:${identityKey}:${record[identityKey]}:${record.recordKey || ""}`;
  const encrypted = await encryptPayload(unlockedVaults.get(ownerId), payload, additionalData);
  return {
    [identityKey]: record[identityKey],
    ...(record.recordKey ? { recordKey: record.recordKey } : {}),
    ownerId,
    identityKey,
    encrypted: true,
    ...encrypted
  };
};

const decryptRecord = async (record, identityKey) => {
  if (!record.encrypted) return record;
  const key = unlockedVaults.get(record.ownerId);
  if (!key) throw new Error("Unlock the offline survey vault before accessing saved records.");
  const additionalData = `${record.ownerId}:${identityKey}:${record[identityKey]}:${record.recordKey || ""}`;
  if (record.identityKey !== identityKey) {
    throw new Error("The offline record identity is invalid or has been modified.");
  }
  return {
    ...(await decryptPayload(key, record.iv, record.ciphertext, additionalData)),
    [identityKey]: record[identityKey],
    ...(record.recordKey ? { recordKey: record.recordKey } : {}),
    ownerId: record.ownerId
  };
};

const migrateLegacyRecords = async (ownerId) => {
  for (const [storeName, identityKey] of [[SURVEYS_STORE, "offlineId"], [PARCELS_STORE, "parcelId"]]) {
    const records = await runTransaction(storeName, "readonly", (store) => store.getAll());
    for (const record of records) {
      if (record.encrypted || (record.ownerId && record.ownerId !== ownerId)) continue;
      if (storeName === SURVEYS_STORE && record.ownerId !== ownerId) continue;
      const legacyParcel = storeName === PARCELS_STORE;
      const migratedRecord = legacyParcel
        ? { ...record, recordKey: `${ownerId}:${record.parcelId}` }
        : record;
      const encrypted = await encryptRecord(migratedRecord, ownerId, identityKey);
      await runTransaction(storeName, "readwrite", (store) => store.put(encrypted));
    }
  }

  const database = await openDatabase();
  if (database.objectStoreNames.contains(LEGACY_PARCELS_STORE)) {
    const legacyParcels = await runTransaction(LEGACY_PARCELS_STORE, "readonly", (store) => store.getAll());
    for (const parcel of legacyParcels) {
      const migrated = {
        ...parcel,
        recordKey: `${ownerId}:${parcel.parcelId}`
      };
      const encrypted = await encryptRecord(migrated, ownerId, "parcelId");
      await runTransaction(PARCELS_STORE, "readwrite", (store) => store.put(encrypted));
      await runTransaction(LEGACY_PARCELS_STORE, "readwrite", (store) => store.delete(parcel.parcelId));
    }
  }
};

export const unlockOfflineVault = async (ownerId, password) => {
  if (!ownerId || typeof password !== "string" || !password || password.length > 1024) {
    throw new Error("Enter your account password to unlock offline survey records.");
  }
  const crypto = getCrypto();
  let vault = await runTransaction(VAULTS_STORE, "readonly", (store) => store.get(ownerId));
  const salt = vault?.salt || crypto.getRandomValues(new Uint8Array(16));
  const iterations = vault
    ? (vault.kdfIterations || LEGACY_KDF_ITERATIONS)
    : VAULT_KDF_ITERATIONS;
  const key = await deriveVaultKey(password, salt, iterations);

  if (vault) {
    try {
      const check = await decryptPayload(key, vault.checkIv, vault.checkCiphertext);
      if (check !== VAULT_CHECK) throw new Error("Vault password is incorrect.");
    } catch {
      throw new Error("The offline vault password is incorrect.");
    }
  } else {
    const check = await encryptPayload(key, VAULT_CHECK);
    vault = {
      ownerId,
      salt,
      kdfIterations: VAULT_KDF_ITERATIONS,
      checkIv: check.iv,
      checkCiphertext: check.ciphertext
    };
    try {
      await runTransaction(VAULTS_STORE, "readwrite", (store) => store.add(vault));
    } catch (error) {
      const existingVault = await runTransaction(VAULTS_STORE, "readonly", (store) => store.get(ownerId));
      if (!existingVault) throw error;
      const existingKey = await deriveVaultKey(
        password,
        existingVault.salt,
        existingVault.kdfIterations || LEGACY_KDF_ITERATIONS
      );
      try {
        const existingCheck = await decryptPayload(existingKey, existingVault.checkIv, existingVault.checkCiphertext);
        if (existingCheck !== VAULT_CHECK) throw new Error("Vault password is incorrect.");
      } catch {
        throw new Error("The offline vault password is incorrect.");
      }
      vault = existingVault;
    }
  }

  const activeKey = vault.salt === salt
    ? key
    : await deriveVaultKey(password, vault.salt, vault.kdfIterations || LEGACY_KDF_ITERATIONS);
  unlockedVaults.set(String(ownerId), activeKey);
  await migrateLegacyRecords(String(ownerId));
};

export const lockOfflineVault = (ownerId) => {
  if (ownerId) unlockedVaults.delete(String(ownerId));
};

export const cacheSurveyParcel = async (parcel, ownerId) => {
  if (!parcel?.parcelId || parcel.geoJson?.geometry?.type !== "Polygon") {
    throw new Error("A parcel identifier and cadastral Polygon geometry are required for offline field work.");
  }
  if (!ownerId || !unlockedVaults.has(String(ownerId))) {
    throw new Error("Unlock the offline survey vault before caching parcel coordinates.");
  }

  const cached = {
    parcelId: parcel.parcelId,
    recordKey: `${String(ownerId)}:${parcel.parcelId}`,
    ownerId: String(ownerId),
    ulpin: parcel.ulpin || "",
    surveyNumber: parcel.surveyNumber || "",
    district: parcel.district || "",
    taluk: parcel.taluk || "",
    village: parcel.village || "",
    geoJson: {
      type: "Feature",
      geometry: parcel.geoJson.geometry,
      properties: {}
    },
    cachedAt: new Date().toISOString()
  };
  const encrypted = await encryptRecord(cached, String(ownerId), "parcelId");
  await runTransaction(PARCELS_STORE, "readwrite", (store) => store.put(encrypted));
  return cached;
};

export const getCachedSurveyParcels = async (ownerId) => {
  if (!ownerId || !unlockedVaults.has(String(ownerId))) {
    throw new Error("Unlock the offline survey vault before reading cached parcel coordinates.");
  }
  const records = await runTransaction(PARCELS_STORE, "readonly", (store) => store.getAll());
  return Promise.all(records.filter((record) => record.ownerId === String(ownerId)).map((record) => decryptRecord(record, "parcelId")));
};

export const getCachedSurveyParcel = async (parcelId, ownerId) => {
  if (!ownerId || !unlockedVaults.has(String(ownerId))) {
    throw new Error("Unlock the offline survey vault before reading cached parcel coordinates.");
  }
  const records = await runTransaction(PARCELS_STORE, "readonly", (store) => store.getAll());
  const record = records.find((entry) =>
    entry.parcelId === parcelId && entry.ownerId === String(ownerId)
  );
  return record ? decryptRecord(record, "parcelId") : null;
};

export const saveSurveyOffline = async (surveyRecord) => {
  if (!surveyRecord?.parcelId || !surveyRecord?.parentGeoJson?.geometry?.coordinates) {
    throw new Error("Survey parcel and its cached cadastral geometry are required.");
  }
  if (!surveyRecord?.ownerId) {
    throw new Error("An authenticated account is required to associate this survey with its local owner.");
  }
  if (!unlockedVaults.has(String(surveyRecord.ownerId))) {
    throw new Error("Unlock the offline survey vault before saving field observations.");
  }
  if (!surveyRecord?.observations?.trim()) {
    throw new Error("Enter field observations before saving the survey.");
  }

  const offlineId = globalThis.crypto?.randomUUID?.() ||
    `OFFLINE-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const record = {
    ...surveyRecord,
    offlineId,
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    syncAttempts: 0,
    lastSyncError: ""
  };
  const encrypted = await encryptRecord(record, String(surveyRecord.ownerId), "offlineId");
  await runTransaction(SURVEYS_STORE, "readwrite", (store) => store.add(encrypted));
  return record;
};

export const getCachedSurveys = async (ownerId) => {
  if (!ownerId) throw new Error("An account identifier is required to read offline survey records.");
  if (!unlockedVaults.has(String(ownerId))) {
    throw new Error("Unlock the offline survey vault before reading saved records.");
  }
  const records = await runTransaction(SURVEYS_STORE, "readonly", (store) => store.getAll());
  return Promise.all(
    records.filter((record) => record.ownerId === String(ownerId)).map((record) => decryptRecord(record, "offlineId"))
  );
};

export const updateSurveyStatus = async (offlineId, status, details = {}) => {
  const storedRecord = await runTransaction(SURVEYS_STORE, "readonly", (store) => store.get(offlineId));
  if (!storedRecord) throw new Error(`Offline survey ${offlineId} no longer exists.`);
  const record = await decryptRecord(storedRecord, "offlineId");
  const updated = {
    ...record,
    ...details,
    status,
    updatedAt: new Date().toISOString()
  };
  const encrypted = await encryptRecord(updated, String(record.ownerId), "offlineId");
  await runTransaction(SURVEYS_STORE, "readwrite", (store) => store.put(encrypted));
};

export const syncPendingSurveys = async (submitSurvey, ownerId) => {
  if (syncInProgress) return { synchronized: 0, failed: 0, skipped: true };
  if (typeof submitSurvey !== "function") throw new Error("A survey submission function is required to synchronize records.");
  if (!ownerId) throw new Error("An account identifier is required to synchronize offline survey records.");

  syncInProgress = true;
  let synchronized = 0;
  let failed = 0;
  try {
    const surveys = await getCachedSurveys(ownerId);
    for (const survey of surveys.filter(({ status }) => status === "pending" || status === "failed")) {
      try {
        await submitSurvey(survey);
        await updateSurveyStatus(survey.offlineId, "synchronized", {
          synchronizedAt: new Date().toISOString(),
          syncAttempts: survey.syncAttempts + 1,
          lastSyncError: ""
        });
        synchronized += 1;
      } catch (error) {
        await updateSurveyStatus(survey.offlineId, "failed", {
          syncAttempts: survey.syncAttempts + 1,
          lastSyncError: error?.response?.data?.message || error?.message || "Synchronization failed."
        });
        failed += 1;
      }
    }
    return { synchronized, failed, skipped: false };
  } finally {
    syncInProgress = false;
  }
};

export const exportSurveyWorkPackage = (surveyRecord) => {
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(
      {
        format: "LandStack-Offline-Field-Survey",
        version: "2026.1",
        exportTimestamp: new Date().toISOString(),
        surveyData: surveyRecord
      },
      null,
      2
    )
  )}`;
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", jsonString);
  downloadAnchor.setAttribute("download", `field_survey_${surveyRecord.offlineId || "export"}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};
