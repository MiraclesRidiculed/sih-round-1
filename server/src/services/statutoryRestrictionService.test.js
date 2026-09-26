import assert from "node:assert/strict";
import { resolveActiveStatutoryRestriction } from "./statutoryRestrictionService.js";

const parcel = (parcelId, disputeRecord = {}) => ({ parcelId, disputeRecord });

assert.equal(resolveActiveStatutoryRestriction(parcel("PARCEL-OPEN")), null);

const activeRestriction = resolveActiveStatutoryRestriction(parcel("PARCEL-STAY"), [
  {
    parcelId: "PARCEL-STAY",
    caseIdentifier: "RCCMS-101",
    currentStatus: "INTERIM_INJUNCTION"
  }
]);
assert.equal(activeRestriction?.active, true);
assert.equal(activeRestriction?.caseIdentifier, "RCCMS-101");
assert.match(activeRestriction?.reason || "", /active RCCMS stay restriction/i);

assert.equal(
  resolveActiveStatutoryRestriction(parcel("PARCEL-HEARING"), [{
    parcelId: "PARCEL-HEARING",
    caseIdentifier: "RCCMS-HEARING",
    currentStatus: "HEARING_DECREE"
  }])?.active,
  true
);

assert.equal(
  resolveActiveStatutoryRestriction(parcel("PARCEL-OPEN"), [
    {
      parcelId: "PARCEL-OTHER",
      caseIdentifier: "RCCMS-OTHER",
      currentStatus: "INTERIM_INJUNCTION"
    }
  ]),
  null
);

assert.equal(
  resolveActiveStatutoryRestriction(parcel("PARCEL-VACATED", {
    hasActiveInjunction: true,
    transactionLock: true
  }), [{
    parcelId: "PARCEL-VACATED",
    caseIdentifier: "RCCMS-102",
    currentStatus: "STAY_VACATED"
  }]),
  null
);

const legacyRestriction = resolveActiveStatutoryRestriction(
  parcel("PARCEL-LEGACY", { transactionLock: true, caseNumber: "LEGACY-1" })
);
assert.equal(legacyRestriction?.active, true);
assert.equal(legacyRestriction?.caseIdentifier, "LEGACY-1");

console.log("Statutory restriction test passed: unrestricted, active stay, unrelated parcel, vacated stay, and legacy lock.");
