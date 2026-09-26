import assert from "node:assert/strict";
import polygonClipping from "polygon-clipping";
import { splitParcelPolygon } from "./cadastralSubdivisionService.js";

const parent = {
  type: "Feature",
  geometry: {
    type: "Polygon",
    coordinates: [[
      [79.9182, 12.9341],
      [79.9224, 12.9341],
      [79.9224, 12.9312],
      [79.9182, 12.9312],
      [79.9182, 12.9341]
    ]]
  },
  properties: { label: "test parent" }
};

const split = splitParcelPolygon(parent, 0.6, "33030400100482");
assert.equal(split.children.length, 2);
assert.equal(split.children[0].geoJson.type, "Feature");
assert.equal(split.children[0].geoJson.geometry.type, "Polygon");
assert.equal(split.splitAxis, "longitude");
assert.equal(split.children[0].parentIdentifier, "33030400100482");
assert.equal(split.children[1].parentIdentifier, "33030400100482");
assert.equal(split.children[0].identifierType, "PROJECT_DETERMINISTIC_CHILD_IDENTIFIER");
assert.match(split.identifierAlgorithm, /not an official ULPIN/i);

const totalChildArea = split.children.reduce((total, child) => total + child.areaSquareMeters, 0);
assert.ok(Math.abs(totalChildArea - split.parentAreaSquareMeters) / split.parentAreaSquareMeters < 1e-6);
assert.ok(Math.abs(split.children[0].sharePercent - 60) < 0.001);
assert.ok(Math.abs(split.children[1].sharePercent - 40) < 0.001);
assert.ok(split.children.every((child) => child.areaInAcres > 0));

for (const child of split.children) {
  const contained = polygonClipping.intersection([parent.geometry.coordinates], [child.geoJson.geometry.coordinates]);
  assert.equal(contained.length, 1);
  assert.deepEqual(contained[0], child.geoJson.geometry.coordinates);
}

const repeatSplit = splitParcelPolygon(parent, 0.6, "33030400100482");
assert.deepEqual(
  repeatSplit.children.map(({ childIdentifier }) => childIdentifier),
  split.children.map(({ childIdentifier }) => childIdentifier)
);

const concavePolygon = {
  type: "Polygon",
  coordinates: [[
    [0, 0],
    [0.02, 0],
    [0.02, 0.01],
    [0.01, 0.01],
    [0.01, 0.02],
    [0, 0.02],
    [0, 0]
  ]]
};
const concaveSplit = splitParcelPolygon(concavePolygon, 0.6, "CONCAVE-PARENT");
assert.equal(concaveSplit.children.length, 2);
assert.ok(
  Math.abs(
    concaveSplit.children.reduce((total, child) => total + child.areaSquareMeters, 0) -
      concaveSplit.parentAreaSquareMeters
  ) / concaveSplit.parentAreaSquareMeters < 1e-6
);

const invalidBowTie = {
  type: "Polygon",
  coordinates: [[
    [0, 0],
    [1, 1],
    [0, 1],
    [1, 0],
    [0, 0]
  ]]
};
assert.throws(
  () => splitParcelPolygon(invalidBowTie, 0.5, "PARENT-1"),
  (error) => error.code === "INVALID_PARCEL_GEOMETRY"
);

assert.throws(
  () => splitParcelPolygon(parent, 1, "PARENT-1"),
  (error) => error.code === "INVALID_PARCEL_GEOMETRY"
);

console.log("Cadastral subdivision test passed: geometric split, geodesic area, containment, validation, and deterministic IDs.");
