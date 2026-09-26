import assert from "node:assert/strict";
import { VALID_CASE_TRANSITIONS, transitionRccmsCase } from "./rccmsCaseService.js";

const makeCase = () => ({
  currentStatus: "CASE_FILED",
  responsibleOfficer: "",
  auditTrail: [],
  orders: [],
  async save() {
    return this;
  }
});

const req = { user: { id: "court-officer-1", name: "RCCMS Test Officer" } };
const rccmsCase = makeCase();

for (const state of ["NOTICE_ISSUED", "INTERIM_INJUNCTION", "HEARING_DECREE", "STAY_VACATED"]) {
  await transitionRccmsCase(rccmsCase, state, { req, note: `Transitioned to ${state}` });
}

assert.equal(rccmsCase.currentStatus, "STAY_VACATED");
assert.equal(rccmsCase.auditTrail.length, 4);
assert.equal(rccmsCase.auditTrail[0].fromState, "UNINITIALIZED");
assert.equal(rccmsCase.auditTrail.at(-1).toState, "STAY_VACATED");
assert.equal(rccmsCase.responsibleOfficer, "RCCMS Test Officer");
assert.deepEqual(VALID_CASE_TRANSITIONS.STAY_VACATED, []);

await assert.rejects(
  () => transitionRccmsCase(makeCase(), "STAY_VACATED", { req }),
  (error) => error.code === "INVALID_CASE_TRANSITION" && error.statusCode === 409
);

console.log("RCCMS lifecycle test passed: valid transitions, audit trail, and invalid transition rejection.");
