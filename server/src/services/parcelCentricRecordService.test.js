import assert from "node:assert/strict";
import test from "node:test";
import { assembleParcelCentricRecord } from "./parcelCentricRecordService.js";
import { createParcelTransaction } from "./parcelTransactionService.js";

const parcel = {
  _id: "parcel-object-id",
  parcelId: "TN-KPM-0001",
  ulpin: "33030400100482",
  surveyNumber: "248/3",
  district: "Kanchipuram",
  taluk: "Sriperumbudur",
  hobli: "Sunguvarchatram",
  village: "Mambakkam",
  areaInAcres: 1.25,
  landClassification: "Dry Agricultural",
  landUse: "Industrial use recorded",
  state: "Tamil Nadu",
  stateProfile: { systemName: "Tamil Nilam / TNREGINET" },
  baseLayer: { cadastralSheetNo: "CS-TN-048" },
  geoJson: { type: "Feature", geometry: { type: "Polygon", coordinates: [[[79.91, 12.93], [79.92, 12.93], [79.92, 12.94], [79.91, 12.93]]] } },
  currentOwners: [{ name: "Holder One", sharePercent: 100 }],
  essentialLayers: {
    ror: { rorNumber: "PATTA-5510" },
    registration: { deedNumber: "DOC-3109" },
    masterPlanZoning: { authority: "Planning Authority", zoneCategory: "Industrial" },
    buildingPermissions: { status: "Sanctioned" },
    encumbrance: { hasMortgage: true, lenderName: "Local Bank" },
    rrrSummary: { restrictions: ["Recorded buffer restriction"] }
  },
  additionalLayers: {
    propertyTax: { propertyTaxId: "TAX-1", paymentStatus: "Paid" },
    utilities: { waterConnectionId: "WATER-1" },
    valuation: { guidanceValueTotal: "Local value" },
    restrictionZones: { isEcoSensitive: false }
  },
  authoritativeRecords: { rtcNumber: "PATTA-5510", registrationReference: "DOC-3109" },
  sourceAvailability: {
    rtc: { department: "Tamil Nilam", integrationMode: "demo", authoritative: false, lastSyncedAt: "2026-08-20T08:00:00.000Z" },
    registration: { department: "TNREGINET demo adapter", integrationMode: "demo", authoritative: false }
  },
  verificationHint: { status: "verified" },
  disputeRecord: { transactionLock: false },
  updatedAt: new Date("2026-08-20T08:00:00.000Z")
};

test("correlates existing modules and provenance under the parcel ULPIN", () => {
  const record = assembleParcelCentricRecord({
    parcel,
    documents: [
      { _id: "doc-ror", documentType: "PATTA_CHITTA", title: "Patta", fileName: "patta.pdf", verificationStatus: "matched", createdAt: new Date("2024-03-15") },
      { _id: "doc-deed", documentType: "SALE_DEED", title: "Registered deed", fileName: "deed.pdf", verificationStatus: "not-anchored" }
    ],
    ownershipHistory: [{ _id: "history-1", eventType: "MUTATION_SANCTIONED", summary: "Mutation recorded" }],
    surveySubmissions: [{ offlineId: "survey-1", surveyDate: new Date("2026-08-19"), surveyorName: "Surveyor" }]
  });

  assert.equal(record.correlation.key, "ulpin");
  assert.equal(record.correlation.value, parcel.ulpin);
  assert.equal(record.modules.cadastral.data.ulpin, parcel.ulpin);
  assert.equal(record.modules.ror.data.record.rorNumber, "PATTA-5510");
  assert.equal(record.modules.ror.data.sourceRecords[0].id, "doc-ror");
  assert.equal(record.modules.ror.data.ownershipHistory[0].eventType, "MUTATION_SANCTIONED");
  assert.equal(record.modules.registration.data.record.deedNumber, "DOC-3109");
  assert.equal(record.modules.registration.data.sourceRecords[0].id, "doc-deed");
  assert.equal(record.modules.propertyTax.data.propertyTaxId, "TAX-1");
  assert.equal(record.modules.utilities.data.utilities.waterConnectionId, "WATER-1");
  assert.equal(record.modules.propertyTax.source.mode, "local-demo");
  assert.equal(record.modules.propertyTax.source.authoritative, false);
  assert.equal(record.modules.utilities.source.mode, "local-demo");
  assert.equal(record.modules.utilities.source.authoritative, false);
  assert.deepEqual(record.modules.utilities.data.infrastructure, {});
  assert.equal(record.modules.changeDetection.data.affectedParcel.ulpin, parcel.ulpin);
  assert.equal(record.modules.changeDetection.data.analysisMode, "simulated");
  assert.equal(record.modules.changeDetection.data.sourceImagery, null);
  assert.equal(record.modules.changeDetection.data.source.authoritative, false);
  assert.equal(record.modules.ror.source.systemName, "Tamil Nilam");
  assert.equal(record.modules.ror.source.mode, "local-demo");
  assert.equal(record.synchronization.realTime, false);
  assert.equal(record.synchronization.authoritative, false);
});

test("reports unavailable and pending datasets explicitly", () => {
  const result = assembleParcelCentricRecord({
    parcel: {
      parcelId: "KAR-ONLY",
      ulpin: "29140200300119",
      stateProfile: { systemName: "Bhoomi demo" },
      essentialLayers: { ror: { mutationStatus: "Under Scrutiny" } },
      additionalLayers: {},
      disputeRecord: {}
    }
  });

  assert.equal(result.modules.ror.status, "pending");
  assert.equal(result.modules.registration.status, "unavailable");
  assert.equal(result.modules.propertyTax.status, "unavailable");
  assert.equal(result.modules.utilities.status, "unavailable");
  assert.equal(result.modules.changeDetection.data.status, "unavailable");
});

test("normalizes sample change detection data without inventing imagery metadata", () => {
  const result = assembleParcelCentricRecord({
    parcel: {
      ...parcel,
      aiGeospatial: {
        satelliteChangeDetection: {
          anomalyDetected: true,
          anomalyType: "Potential boundary change",
          lastSatellitePassDate: "2026-08-18",
          confidenceScorePercent: 94,
          detectedFootprintChangeSqM: 38.5,
          sourceImagery: {
            provider: "Seed imagery label",
            acquiredAt: "2026-08-18",
            unsupportedInternalField: "must not be exposed"
          }
        }
      }
    }
  });
  const change = result.modules.changeDetection.data;

  assert.equal(change.status, "change-detected");
  assert.equal(change.analysisMode, "simulated");
  assert.equal(change.detectedChange, "Potential boundary change");
  assert.equal(change.detectionDate, "2026-08-18");
  assert.equal(change.confidencePercent, 94);
  assert.deepEqual(change.affectedParcel, {
    parcelId: parcel.parcelId,
    ulpin: parcel.ulpin,
    surveyNumber: parcel.surveyNumber
  });
  assert.equal(change.changeAreaSqM, 38.5);
  assert.deepEqual(change.sourceImagery, {
    provider: "Seed imagery label",
    acquiredAt: "2026-08-18"
  });
  assert.equal(change.source.mode, "simulated");
  assert.equal(change.source.authoritative, false);
  assert.equal("unsupportedInternalField" in change.sourceImagery, false);
});

test("marks an active RCCMS stay as restricted and retains its source case", () => {
  const transaction = createParcelTransaction({
    parcel,
    actor: { id: "citizen-1", role: "citizen" },
    transactionType: "Sale deed application",
    id: "stay-test-transaction"
  });
  const rccmsCase = {
    parcelId: parcel.parcelId,
    caseIdentifier: "CASE-52",
    currentStatus: "INTERIM_INJUNCTION",
    filing: { filingReference: "FILE-52" },
    orders: [{ type: "INTERIM_INJUNCTION", reference: "ORDER-52" }],
    responsibleOfficer: "Court Officer"
  };
  const result = assembleParcelCentricRecord({
    parcel: { ...parcel, departmentalWorkflows: [transaction] },
    rccmsCases: [rccmsCase]
  });

  assert.equal(result.modules.restrictions.status, "restricted");
  assert.equal(result.modules.restrictions.data.activeTransferRestriction.caseIdentifier, "CASE-52");
  assert.equal(result.modules.restrictions.data.cases[0].orders[0].reference, "ORDER-52");
  assert.equal(result.modules.transactions.data.applications[0].status, "Restricted");
  assert.equal(result.modules.transactions.data.applications[0].underlyingStatus, "Application Submitted");
});

test("assembles local transaction applications under the parcel ULPIN without claiming an external registration", () => {
  const transaction = createParcelTransaction({
    parcel,
    actor: { id: "citizen-1", role: "citizen" },
    transactionType: "Sale deed application",
    now: new Date("2026-09-27T00:00:00.000Z"),
    id: "12345678-90ab-cdef"
  });
  const result = assembleParcelCentricRecord({
    parcel: { ...parcel, departmentalWorkflows: [transaction] }
  });

  assert.equal(result.correlation.value, parcel.ulpin);
  assert.equal(result.modules.transactions.status, "available");
  assert.equal(result.modules.transactions.data.applications[0].applicationReference, "LS-APP-2026-12345678");
  assert.equal(result.modules.transactions.data.applications[0].status, "Application Submitted");
  assert.equal(result.modules.transactions.source.authoritative, false);
  assert.equal(result.synchronization.realTime, false);
});

test("requires a parcel and does not invent a ULPIN when missing", () => {
  assert.throws(() => assembleParcelCentricRecord({}), /A parcel is required/);
  const result = assembleParcelCentricRecord({ parcel: { parcelId: "NO-ULPIN" } });
  assert.equal(result.correlation.key, "ulpin");
  assert.equal(result.correlation.value, null);
  assert.equal(result.modules.cadastral.data.ulpin, null);
});
