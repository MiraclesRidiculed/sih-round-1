import assert from "node:assert/strict";
import test from "node:test";
import { DocumentRecord } from "../models/DocumentRecord.js";
import { OwnershipEvent } from "../models/OwnershipEvent.js";
import { Parcel } from "../models/Parcel.js";
import { RccmsCase } from "../models/RccmsCase.js";
import { FieldSurveySubmission } from "../models/FieldSurveySubmission.js";
import {
  getInteroperabilityParcel,
  getInteroperabilityParcelModule
} from "./landInteroperabilityController.js";

const parcel = {
  _id: "parcel-1",
  parcelId: "TN-KPM-0001",
  ulpin: "33030400100482",
  surveyNumber: "248/3",
  district: "Kanchipuram",
  taluk: "Sriperumbudur",
  hobli: "Sunguvarchatram",
  village: "Mambakkam",
  areaInAcres: 1.25,
  landClassification: "Dry Agricultural",
  landUse: "Agricultural",
  state: "Tamil Nadu",
  stateProfile: { systemName: "Local demo adapter" },
  currentOwners: [{ name: "Private Owner", identifierMasked: "XXXX" }],
  geoJson: {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [[[79, 12], [80, 12], [80, 13], [79, 12]]] },
    properties: { privateOwnerName: "Private Owner" }
  },
  essentialLayers: {
    ror: { rorNumber: "PATTA-1", holderName: "Private Owner", issueDate: "2024-01-01" },
    registration: { status: "Registered", deedNumber: "DEED-1", considerationValue: 999999 },
    rrrSummary: { rights: ["Agricultural use"] }
  },
  additionalLayers: { propertyTax: { propertyTaxId: "TAX-PRIVATE", paymentStatus: "Paid" } },
  sourceAvailability: {},
  departmentalWorkflows: [],
  disputeRecord: {},
  verificationHint: { status: "verified" },
  updatedAt: new Date("2026-09-01T00:00:00.000Z")
};

const mockQuery = (items) => ({
  sort() { return this; },
  select() { return this; },
  lean: async () => items
});

const response = () => ({
  statusCode: 200,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  }
});

const invoke = async (handler, req, res) => {
  let error;
  await handler(req, res, (nextError) => { error = nextError; });
  if (error) throw error;
};

const mockLookup = (t, value) => {
  let result = value;
  t.mock.method(Parcel, "findOne", () => ({ lean: async () => result }));
  t.mock.method(RccmsCase, "find", () => mockQuery([]));
  t.mock.method(DocumentRecord, "find", () => mockQuery([]));
  t.mock.method(OwnershipEvent, "find", () => mockQuery([]));
  t.mock.method(FieldSurveySubmission, "find", () => mockQuery([]));
  return (next) => { result = next; };
};

test("ULPIN parcel endpoint returns the citizen projection, metadata, and no private owner data", async (t) => {
  mockLookup(t, parcel);
  const res = response();
  await invoke(getInteroperabilityParcel, {
    params: { ulpin: parcel.ulpin },
    user: { id: "citizen-1", role: "citizen" }
  }, res);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.correlation.value, parcel.ulpin);
  assert.equal(res.body.data.modules.ror.data.record.rorNumber, "PATTA-1");
  assert.equal("holderName" in res.body.data.modules.ror.data.record, false);
  assert.equal(res.body.data.modules.registration.data.record.deedNumber, undefined);
  assert.equal(res.body.data.modules.propertyTax.status, "restricted");
  assert.equal(res.body.meta.source.authoritative, false);
  assert.match(res.body.meta.source.disclaimer, /no external government systems are queried/);
  assert.equal(JSON.stringify(res.body).includes("TAX-PRIVATE"), false);
  assert.equal(JSON.stringify(res.body).includes("privateOwnerName"), false);
});

test("module endpoint enforces role permissions and returns the selected module", async (t) => {
  const setParcel = mockLookup(t, parcel);
  const denied = response();
  await invoke(getInteroperabilityParcelModule, {
    params: { ulpin: parcel.ulpin, module: "property-tax" },
    user: { id: "citizen-1", role: "citizen" }
  }, denied);
  assert.equal(denied.statusCode, 403);
  assert.equal(denied.body.error.code, "MODULE_ACCESS_RESTRICTED");

  const permitted = response();
  await invoke(getInteroperabilityParcelModule, {
    params: { ulpin: parcel.ulpin, module: "property-tax" },
    user: { id: "admin-1", role: "admin" }
  }, permitted);
  assert.equal(permitted.statusCode, 200);
  assert.equal(permitted.body.data.module.data.propertyTaxId, "TAX-PRIVATE");
  assert.equal(permitted.body.meta.module, "property-tax");

  const changeParcel = {
    ...parcel,
    aiGeospatial: {
      satelliteChangeDetection: {
        anomalyDetected: true,
        anomalyType: "Sample change",
        lastSatellitePassDate: "2026-08-18"
      }
    }
  };
  setParcel(changeParcel);
  const changeResult = response();
  await invoke(getInteroperabilityParcelModule, {
    params: { ulpin: parcel.ulpin, module: "change-detection" },
    user: { id: "citizen-1", role: "citizen" }
  }, changeResult);
  assert.equal(changeResult.statusCode, 200);
  assert.equal(changeResult.body.data.module.data.analysisMode, "simulated");
  assert.equal(changeResult.body.data.module.data.affectedParcel.ulpin, parcel.ulpin);
  assert.equal(changeResult.body.meta.source.mode, "simulated");

  const decisionParcel = {
    ...parcel,
    currentOwners: [{ name: "Owner A" }, { name: "Owner A" }],
    disputeRecord: {},
    departmentalWorkflows: [],
    aiGeospatial: {}
  };
  setParcel(decisionParcel);
  const citizenDecisionResult = response();
  await invoke(getInteroperabilityParcelModule, {
    params: { ulpin: parcel.ulpin, module: "decision-support" },
    user: { id: "citizen-1", role: "citizen" }
  }, citizenDecisionResult);
  assert.equal(citizenDecisionResult.statusCode, 403);

  const decisionResult = response();
  await invoke(getInteroperabilityParcelModule, {
    params: { ulpin: parcel.ulpin, module: "decision-support" },
    user: { id: "officer-1", role: "revenue_officer" }
  }, decisionResult);
  assert.equal(decisionResult.statusCode, 200);
  assert.equal(decisionResult.body.data.module.data.findings[0].code, "POSSIBLE_DUPLICATE_HOLDER_ENTRY");
  assert.equal(decisionResult.body.meta.source.mode, "rules-based");
});

test("validates ULPINs and uses the standard not-found envelope", async (t) => {
  mockLookup(t, null);
  const invalid = response();
  await invoke(getInteroperabilityParcel, {
    params: { ulpin: "bad/value" },
    user: { id: "citizen-1", role: "citizen" }
  }, invalid);
  assert.equal(invalid.statusCode, 400);
  assert.equal(invalid.body.error.code, "INVALID_ULPIN");

  const missing = response();
  await invoke(getInteroperabilityParcel, {
    params: { ulpin: "00000000000000" },
    user: { id: "citizen-1", role: "citizen" }
  }, missing);
  assert.equal(missing.statusCode, 404);
  assert.equal(missing.body.error.code, "PARCEL_NOT_FOUND");
});
