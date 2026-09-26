import assert from "node:assert/strict";
import test from "node:test";
import { findExactParcelSearchMatch, normalizeParcelSearchTerm } from "./parcelSearch.js";

const parcels = [
  { parcelId: "KAR-001", ulpin: "29140200300119", surveyNumber: "14/2" },
  { parcelId: "KAR-002", ulpin: "33030400100482", surveyNumber: "14/3" }
];

test("finds an exact ULPIN match before other identifiers", () => {
  assert.equal(findExactParcelSearchMatch(parcels, " 29140200300119 ")?.parcelId, "KAR-001");
  assert.equal(findExactParcelSearchMatch(parcels, "33030400100482")?.parcelId, "KAR-002");
  assert.equal(findExactParcelSearchMatch([
    { parcelId: "29140200300119", ulpin: "OTHER-ULPIN" },
    { parcelId: "OTHER-PARCEL", ulpin: "29140200300119" }
  ], "29140200300119")?.parcelId, "OTHER-PARCEL");
});

test("supports exact survey number and parcel identifier lookup", () => {
  assert.equal(findExactParcelSearchMatch(parcels, "14/3")?.parcelId, "KAR-002");
  assert.equal(findExactParcelSearchMatch(parcels, "kar-001")?.parcelId, "KAR-001");
});

test("returns no fabricated result for empty or unknown searches", () => {
  assert.equal(normalizeParcelSearchTerm("  "), "");
  assert.equal(findExactParcelSearchMatch(parcels, ""), null);
  assert.equal(findExactParcelSearchMatch(parcels, "00000000000000"), null);
  assert.equal(findExactParcelSearchMatch(parcels, "partial"), null);
});

test("resolves successive searches independently and clear input normalizes to empty", () => {
  assert.equal(findExactParcelSearchMatch(parcels, "KAR-001")?.parcelId, "KAR-001");
  assert.equal(findExactParcelSearchMatch(parcels, "14/3")?.parcelId, "KAR-002");
  assert.equal(normalizeParcelSearchTerm(""), "");
  assert.equal(findExactParcelSearchMatch(parcels, ""), null);
});
