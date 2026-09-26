import {
  buildSourceReference,
  normalizeLandType,
  normalizeRestrictions,
  normalizeTenure
} from "./harmonization.js";

const sourceRecord = (adapter, result) => ({
  classification: "SOURCE STATE RECORD",
  state: result.source.stateName,
  stateCode: result.source.stateCode,
  systems: result.source.sourceSystems,
  sourceReference: buildSourceReference(result.record, result.source),
  integrationMode: result.source.integrationMode,
  authoritative: result.source.authoritative,
  disclaimer: result.source.disclaimer,
  record: result.record
});

export const normalizeLandRecord = (parcelResult, ownershipResult, encumbranceResult, mutationResult, registrationResult, spatialResult) => {
  if (!parcelResult) return null;
  const parcel = parcelResult.record;

  return {
    classification: "NATIONAL CANONICAL REPRESENTATION",
    schemaVersion: "1.0",
    nationalIdentifiers: {
      parcelId: parcel.parcelId,
      ulpin: parcel.ulpin || null,
      surveyNumber: parcel.surveyNumber,
      hissaNumber: parcel.hissaNumber || "",
      propertyId: parcel.propertyId || ""
    },
    location: {
      state: parcel.state,
      district: parcel.district,
      taluk: parcel.taluk,
      hobli: parcel.hobli,
      village: parcel.village
    },
    land: {
      areaInAcres: parcel.areaInAcres,
      type: normalizeLandType(parcel.landClassification, parcel.landUse),
      tenure: normalizeTenure(parcel),
      sourceClassification: parcel.landClassification || "",
      sourceUse: parcel.landUse || ""
    },
    ownership: ownershipResult?.record?.currentOwners || [],
    encumbrance: encumbranceResult?.record || {},
    mutation: mutationResult?.record || {},
    registration: registrationResult?.record || {},
    restrictions: normalizeRestrictions(parcel),
    spatialFeature: spatialResult?.record || null,
    sourceStateRecord: sourceRecord(parcelResult.adapter, parcelResult),
    sourceSnapshots: {
      ownership: ownershipResult ? sourceRecord(ownershipResult.adapter, ownershipResult) : null,
      encumbrance: encumbranceResult ? sourceRecord(encumbranceResult.adapter, encumbranceResult) : null,
      mutation: mutationResult ? sourceRecord(mutationResult.adapter, mutationResult) : null,
      registration: registrationResult ? sourceRecord(registrationResult.adapter, registrationResult) : null,
      spatial: spatialResult ? sourceRecord(spatialResult.adapter, spatialResult) : null
    }
  };
};
