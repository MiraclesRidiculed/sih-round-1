import { resolveActiveStatutoryRestriction } from "./statutoryRestrictionService.js";

const ROLE_METRICS = Object.freeze({
  admin: [
    "totalParcels",
    "activeRestrictions",
    "pendingRegistrations",
    "rccmsCases",
    "subdivisions",
    "detectedSpatialChanges",
    "parcelsWithEncumbrance"
  ],
  revenue_officer: ["totalParcels", "activeRestrictions", "detectedSpatialChanges"],
  surveyor: ["totalParcels", "subdivisions", "detectedSpatialChanges"],
  sro: ["totalParcels", "activeRestrictions", "pendingRegistrations"],
  court: ["totalParcels", "activeRestrictions", "rccmsCases"],
  bank: ["totalParcels", "activeRestrictions", "parcelsWithEncumbrance"]
});

const ROLE_DISTRIBUTIONS = Object.freeze({
  admin: ["landUse", "propertyTaxStatus", "rccmsStatus", "state", "district"],
  revenue_officer: ["landUse", "state", "district"],
  surveyor: ["state", "district"],
  sro: ["state", "district"],
  court: ["rccmsStatus", "state", "district"],
  bank: ["state", "district"]
});

const increment = (counts, value) => {
  const label = typeof value === "string" && value.trim() ? value.trim() : "Not recorded";
  counts.set(label, (counts.get(label) || 0) + 1);
};

const toDistribution = (counts) => [...counts.entries()]
  .map(([label, count]) => ({ label, count }))
  .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label));

const getTaxStatus = (parcel) => {
  const tax = parcel.additionalLayers?.propertyTax;
  if (!tax || typeof tax !== "object") return null;
  const status = tax.paymentStatus ?? tax.assessmentStatus ?? tax.status;
  return typeof status === "string" && status.trim() ? status.trim() : null;
};

export const buildGovernanceDashboard = ({ role, parcels = [], rccmsCases = [] }) => {
  const caseMap = new Map();
  for (const caseRecord of rccmsCases) {
    const cases = caseMap.get(caseRecord.parcelId) || [];
    cases.push(caseRecord);
    caseMap.set(caseRecord.parcelId, cases);
  }

  const metrics = {
    totalParcels: parcels.length,
    activeRestrictions: parcels.filter((parcel) =>
      Boolean(resolveActiveStatutoryRestriction(parcel, caseMap.get(parcel.parcelId) || []))
    ).length,
    pendingRegistrations: parcels.reduce((count, parcel) =>
      count + (parcel.departmentalWorkflows || []).filter((workflow) =>
        workflow?.workflowType === "LAND_TRANSACTION" &&
        workflow.status === "Registration Pending"
      ).length, 0
    ),
    rccmsCases: rccmsCases.length,
    subdivisions: parcels.reduce((count, parcel) =>
      count + (Array.isArray(parcel.subdivisionData?.subdivisions)
        ? parcel.subdivisionData.subdivisions.length
        : 0), 0
    ),
    detectedSpatialChanges: parcels.filter((parcel) =>
      parcel.aiGeospatial?.satelliteChangeDetection?.anomalyDetected === true
    ).length,
    parcelsWithEncumbrance: parcels.filter((parcel) =>
      parcel.essentialLayers?.encumbrance?.hasMortgage === true
    ).length
  };

  const landUse = new Map();
  const propertyTaxStatus = new Map();
  const state = new Map();
  const district = new Map();
  const rccmsStatus = new Map();
  for (const parcel of parcels) {
    increment(landUse, parcel.landUse);
    increment(state, parcel.state);
    increment(district, parcel.district);
    const taxStatus = getTaxStatus(parcel);
    if (taxStatus) increment(propertyTaxStatus, taxStatus);
  }
  for (const caseRecord of rccmsCases) increment(rccmsStatus, caseRecord.currentStatus);

  const distributions = {
    landUse: toDistribution(landUse),
    propertyTaxStatus: toDistribution(propertyTaxStatus),
    rccmsStatus: toDistribution(rccmsStatus),
    state: toDistribution(state),
    district: toDistribution(district)
  };
  const allowedMetrics = ROLE_METRICS[role];
  const allowedDistributions = ROLE_DISTRIBUTIONS[role];
  if (!allowedMetrics || !allowedDistributions) {
    throw new TypeError(`No governance dashboard policy is configured for role "${role}".`);
  }

  return {
    role,
    source: "local-application-records",
    authoritative: false,
    metrics: Object.fromEntries(allowedMetrics.map((key) => [key, metrics[key]])),
    distributions: Object.fromEntries(allowedDistributions.map((key) => [key, distributions[key]]))
  };
};
