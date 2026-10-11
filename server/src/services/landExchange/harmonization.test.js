import assert from "node:assert/strict";
import { normalizeLandRecord } from "./canonicalLandRecord.js";

const makeResult = (parcel, stateCode, stateName) => {
  const source = {
    stateCode,
    stateName,
    sourceSystems: ["Local seeded records"],
    integrationMode: "local-seed",
    authoritative: false,
    disclaimer: "Test fixture only"
  };
  const result = { source, record: parcel, adapter: { stateCode } };
  return [result, result, result, result, result, result];
};

const tamilRecord = {
  parcelId: "TN-TEST-1",
  ulpin: "33000000000001",
  state: "Tamil Nadu",
  propertyId: "PATTA-1",
  surveyNumber: "248/3",
  landClassification: "Nanja",
  landUse: "Irrigated paddy cultivation",
  currentOwners: [{ name: "Owner A", sharePercent: 100 }],
  geoJson: { geometry: { type: "Polygon", coordinates: [] } },
  disputeRecord: { transactionLock: true },
  essentialLayers: { rrrSummary: { restrictions: ["Watercourse buffer"] } }
};
const karnatakaRecord = {
  parcelId: "KA-TEST-1",
  state: "Karnataka",
  propertyId: "RTC-1",
  surveyNumber: "45/2",
  landClassification: "Punja / Khushki",
  landUse: "Dry farming",
  stateProfile: { tenure: "Freehold" },
  currentOwners: [],
  geoJson: { geometry: { type: "Polygon", coordinates: [] } }
};
const chandigarhRecord = {
  parcelId: "CHD-TEST-1",
  state: "Chandigarh (UT)",
  propertyId: "EST-1",
  surveyNumber: "12",
  landClassification: "Freehold Commercial",
  landUse: "Commercial offices",
  currentOwners: [],
  geoJson: { geometry: { type: "Polygon", coordinates: [] } }
};

const [tnParcel, tnOwners, tnEncumbrance, tnMutation, tnRegistration, tnSpatial] =
  makeResult(tamilRecord, "TN", "Tamil Nadu");
const tamilCanonical = normalizeLandRecord(tnParcel, tnOwners, tnEncumbrance, tnMutation, tnRegistration, tnSpatial);
assert.equal(tamilCanonical.land.type.category, "AGRICULTURAL_WET_OR_IRRIGATED");
assert.equal(tamilCanonical.land.type.sourceValues.classification, "Nanja");
assert.equal(tamilCanonical.restrictions.hasActiveRestriction, true);
assert.equal(tamilCanonical.sourceStateRecord.classification, "SOURCE STATE RECORD");

const [kaParcel, kaOwners, kaEncumbrance, kaMutation, kaRegistration, kaSpatial] =
  makeResult(karnatakaRecord, "KA", "Karnataka");
const karnatakaCanonical = normalizeLandRecord(kaParcel, kaOwners, kaEncumbrance, kaMutation, kaRegistration, kaSpatial);
assert.equal(karnatakaCanonical.land.type.category, "AGRICULTURAL_DRY_OR_UNIRRIGATED");
assert.equal(karnatakaCanonical.land.tenure.category, "FREEHOLD");
assert.equal(karnatakaCanonical.land.sourceClassification, "Punja / Khushki");

const [chdParcel, chdOwners, chdEncumbrance, chdMutation, chdRegistration, chdSpatial] =
  makeResult(chandigarhRecord, "CHD", "Chandigarh (UT)");
const chandigarhCanonical = normalizeLandRecord(chdParcel, chdOwners, chdEncumbrance, chdMutation, chdRegistration, chdSpatial);
assert.equal(chandigarhCanonical.land.type.category, "COMMERCIAL");
assert.equal(chandigarhCanonical.land.tenure.category, "FREEHOLD");
assert.equal(chandigarhCanonical.sourceStateRecord.sourceReference.sourceRecordIdentifier, "CHD-TEST-1");

console.log("Canonical harmonization fixtures passed for Tamil Nadu, Karnataka, and Chandigarh records.");
