import { RccmsCase } from "../models/RccmsCase.js";

const ACTIVE_STAY_STATES = new Set(["INTERIM_INJUNCTION", "HEARING_DECREE"]);

export const resolveActiveStatutoryRestriction = (parcel, cases = []) => {
  const parcelCases = cases
    .filter((rccmsCase) => rccmsCase.parcelId === parcel.parcelId)
    .sort((left, right) => new Date(right.updatedAt || 0) - new Date(left.updatedAt || 0));
  const activeCase = parcelCases.find((rccmsCase) => ACTIVE_STAY_STATES.has(rccmsCase.currentStatus));

  if (activeCase) {
    return {
      active: true,
      caseIdentifier: activeCase.caseIdentifier,
      reason: `An active RCCMS stay restriction is recorded for case ${activeCase.caseIdentifier}.`
    };
  }

  if (parcelCases[0]?.currentStatus === "STAY_VACATED") return null;

  if (parcel.disputeRecord?.hasActiveInjunction || parcel.disputeRecord?.transactionLock) {
    const caseIdentifier = parcel.disputeRecord.caseNumber || "";
    return {
      active: true,
      caseIdentifier,
      reason: caseIdentifier
        ? `The parcel carries an active court stay restriction for case ${caseIdentifier}.`
        : "The parcel carries an active court stay restriction."
    };
  }

  return null;
};

export const getActiveStatutoryRestriction = async (parcel) => {
  const cases = await RccmsCase.find({ parcelId: parcel.parcelId })
    .select("caseIdentifier parcelId currentStatus updatedAt")
    .sort({ updatedAt: -1 })
    .lean();
  return resolveActiveStatutoryRestriction(parcel, cases);
};
