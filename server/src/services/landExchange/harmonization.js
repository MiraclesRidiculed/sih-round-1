const text = (value) => String(value || "").trim();
const lower = (value) => text(value).toLowerCase();

const LAND_TYPE_RULES = [
  { pattern: /\b(nanja|wet|tari|irrigated)\b/, category: "AGRICULTURAL_WET_OR_IRRIGATED" },
  { pattern: /\b(punja|dry|khushki)\b/, category: "AGRICULTURAL_DRY_OR_UNIRRIGATED" },
  { pattern: /\b(industrial|manufacturing)\b/, category: "INDUSTRIAL" },
  { pattern: /\b(commercial|retail|office)\b/, category: "COMMERCIAL" },
  { pattern: /\b(residential|housing)\b/, category: "RESIDENTIAL" },
  { pattern: /\b(agricultural|agriculture|farm|plantation)\b/, category: "AGRICULTURAL" }
];

export const normalizeLandType = (landClassification, landUse) => {
  const sourceValues = {
    classification: text(landClassification),
    use: text(landUse)
  };
  const combined = lower(`${sourceValues.classification} ${sourceValues.use}`);
  const match = LAND_TYPE_RULES.find((rule) => rule.pattern.test(combined));

  return {
    category: match?.category || "UNSPECIFIED",
    sourceValues,
    mappingBasis: match ? "deterministic-keyword-rule" : "no-matching-rule",
    legalEquivalence: false
  };
};

export const normalizeTenure = (parcel) => {
  const sourceValues = [
    parcel.stateProfile?.tenure,
    parcel.authoritativeRecords?.tenure,
    parcel.essentialLayers?.registration?.documentType,
    parcel.landClassification
  ].filter(Boolean).map(text);
  const combined = lower(sourceValues.join(" "));

  let category = "UNSPECIFIED";
  if (/\bfreehold\b/.test(combined)) category = "FREEHOLD";
  else if (/\bleasehold\b/.test(combined)) category = "LEASEHOLD";
  else if (/\btenancy|tenant\b/.test(combined)) category = "TENANCY";

  return {
    category,
    sourceValues,
    mappingBasis: category === "UNSPECIFIED" ? "no-matching-rule" : "deterministic-keyword-rule",
    legalEquivalence: false
  };
};

export const normalizeRestrictions = (parcel) => {
  const asValues = (value) => Array.isArray(value) ? value : value ? [value] : [];
  const sourceValues = [
    ...asValues(parcel.authoritativeRecords?.restrictions),
    ...asValues(parcel.essentialLayers?.rrrSummary?.restrictions),
    parcel.disputeRecord?.transactionLock ? "Transaction restriction recorded in source parcel" : ""
  ].filter(Boolean).map(text);

  return {
    values: sourceValues,
    hasActiveRestriction: sourceValues.length > 0,
    sourcePreserved: true
  };
};

export const buildSourceReference = (parcel, source) => ({
  state: parcel.state || source?.stateName || "",
  stateCode: source?.stateCode || "",
  sourceSystem: source?.sourceSystems || [],
  sourceRecordIdentifier: parcel.parcelId || parcel.propertyId || parcel.ulpin || "",
  sourceRecordIdentifiers: {
    parcelId: parcel.parcelId || "",
    ulpin: parcel.ulpin || "",
    propertyId: parcel.propertyId || "",
    surveyNumber: parcel.surveyNumber || ""
  },
  integrationMode: source?.integrationMode || "local-seed",
  lastSynchronizedAt: Object.values(parcel.sourceAvailability || {})
    .map((value) => value?.lastSyncedAt)
    .filter(Boolean)
    .sort()
    .at(-1) || null,
  authoritative: source?.authoritative === true,
  disclaimer: source?.disclaimer || "Source values are preserved from local demonstration data."
});
