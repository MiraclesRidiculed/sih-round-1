import assert from "node:assert/strict";
import test from "node:test";
import { buildGovernanceDashboard } from "./governanceDashboardService.js";

const parcels = [
  {
    parcelId: "PARCEL-1",
    ulpin: "33030400100482",
    state: "Tamil Nadu",
    district: "Kanchipuram",
    landUse: "Agricultural",
    additionalLayers: { propertyTax: { paymentStatus: "Paid" } },
    essentialLayers: { encumbrance: { hasMortgage: true } },
    disputeRecord: {},
    departmentalWorkflows: [
      { workflowType: "LAND_TRANSACTION", status: "Registration Pending" },
      { workflowType: "GENERAL", status: "Registration Pending" }
    ],
    subdivisionData: { subdivisions: [{ childIdentifier: "CHILD-1" }, { childIdentifier: "CHILD-2" }] },
    aiGeospatial: { satelliteChangeDetection: { anomalyDetected: true } }
  },
  {
    parcelId: "PARCEL-2",
    state: "Karnataka",
    district: "Mysuru",
    landUse: "Residential",
    additionalLayers: { propertyTax: { paymentStatus: "Overdue" } },
    essentialLayers: { encumbrance: { hasMortgage: false } },
    disputeRecord: { transactionLock: true },
    departmentalWorkflows: [{ workflowType: "LAND_TRANSACTION", status: "Registered" }],
    subdivisionData: { subdivisions: [] },
    aiGeospatial: { satelliteChangeDetection: { anomalyDetected: false } }
  }
];

const cases = [
  { parcelId: "PARCEL-1", caseIdentifier: "CASE-1", currentStatus: "INTERIM_INJUNCTION" },
  { parcelId: "PARCEL-2", caseIdentifier: "CASE-2", currentStatus: "CASE_FILED" }
];

test("computes dashboard metrics from persisted parcel and RCCMS records", () => {
  const dashboard = buildGovernanceDashboard({ role: "admin", parcels, rccmsCases: cases });

  assert.deepEqual(dashboard.metrics, {
    totalParcels: 2,
    activeRestrictions: 2,
    pendingRegistrations: 1,
    rccmsCases: 2,
    subdivisions: 2,
    detectedSpatialChanges: 1,
    parcelsWithEncumbrance: 1
  });
  assert.deepEqual(dashboard.distributions.landUse, [
    { label: "Agricultural", count: 1 },
    { label: "Residential", count: 1 }
  ]);
  assert.deepEqual(dashboard.distributions.propertyTaxStatus, [
    { label: "Overdue", count: 1 },
    { label: "Paid", count: 1 }
  ]);
  assert.deepEqual(dashboard.distributions.rccmsStatus, [
    { label: "CASE_FILED", count: 1 },
    { label: "INTERIM_INJUNCTION", count: 1 }
  ]);
  assert.deepEqual(dashboard.distributions.state, [
    { label: "Karnataka", count: 1 },
    { label: "Tamil Nadu", count: 1 }
  ]);
  assert.equal(dashboard.authoritative, false);
});

test("exposes only dashboard metrics permitted for the active role", () => {
  const revenue = buildGovernanceDashboard({ role: "revenue_officer", parcels, rccmsCases: cases });
  const surveyor = buildGovernanceDashboard({ role: "surveyor", parcels, rccmsCases: cases });
  const sro = buildGovernanceDashboard({ role: "sro", parcels, rccmsCases: cases });
  const court = buildGovernanceDashboard({ role: "court", parcels, rccmsCases: cases });
  const bank = buildGovernanceDashboard({ role: "bank", parcels, rccmsCases: cases });

  assert.deepEqual(Object.keys(revenue.metrics), ["totalParcels", "activeRestrictions", "detectedSpatialChanges"]);
  assert.equal("propertyTaxStatus" in revenue.distributions, false);
  assert.deepEqual(Object.keys(surveyor.metrics), ["totalParcels", "subdivisions", "detectedSpatialChanges"]);
  assert.deepEqual(Object.keys(sro.metrics), ["totalParcels", "activeRestrictions", "pendingRegistrations"]);
  assert.equal("rccmsCases" in sro.metrics, false);
  assert.deepEqual(Object.keys(court.metrics), ["totalParcels", "activeRestrictions", "rccmsCases"]);
  assert.equal("propertyTaxStatus" in bank.distributions, false);
  assert.equal("landUse" in bank.distributions, false);
  assert.throws(
    () => buildGovernanceDashboard({ role: "citizen", parcels, rccmsCases: cases }),
    /No governance dashboard policy/
  );
});

test("returns zero and empty distributions for an empty record set without fallback statistics", () => {
  const dashboard = buildGovernanceDashboard({ role: "admin" });
  assert.deepEqual(dashboard.metrics, {
    totalParcels: 0,
    activeRestrictions: 0,
    pendingRegistrations: 0,
    rccmsCases: 0,
    subdivisions: 0,
    detectedSpatialChanges: 0,
    parcelsWithEncumbrance: 0
  });
  assert.deepEqual(dashboard.distributions.propertyTaxStatus, []);
});
