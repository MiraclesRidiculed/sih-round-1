import assert from "node:assert/strict";
import test from "node:test";
import {
  createParcelTransaction,
  getEffectiveParcelTransaction,
  isParcelTransaction,
  PARCEL_TRANSACTION_STATUSES,
  transitionParcelTransaction
} from "./parcelTransactionService.js";

const parcel = {
  parcelId: "KAR-BGM-0003",
  ulpin: "29140200300119",
  disputeRecord: { transactionLock: false }
};

const citizen = { id: "citizen-1", role: "citizen" };
const sro = { id: "sro-1", role: "sro" };
const fixedDate = new Date("2026-09-27T00:00:00.000Z");

test("creates local application records linked to parcel and ULPIN", () => {
  const transaction = createParcelTransaction({
    parcel,
    actor: citizen,
    transactionType: "Sale deed application",
    now: fixedDate,
    id: "12345678-90ab-cdef"
  });

  assert.equal(transaction.workflowType, "LAND_TRANSACTION");
  assert.equal(transaction.status, "Application Submitted");
  assert.equal(transaction.applicantId, citizen.id);
  assert.equal(transaction.applicationReference, "LS-APP-2026-12345678");
  assert.equal(isParcelTransaction(transaction), true);
  assert.deepEqual(PARCEL_TRANSACTION_STATUSES, [
    "Application Submitted",
    "Under Verification",
    "Registration Pending",
    "Registered",
    "Rejected",
    "Restricted"
  ]);
});

test("supports only valid local transaction status transitions and records history", () => {
  let transaction = createParcelTransaction({ parcel, actor: citizen, transactionType: "Sale deed", now: fixedDate, id: "abcdefgh-1234" });
  transaction = transitionParcelTransaction({ transaction, nextStatus: "Under Verification", actor: sro, now: fixedDate });
  transaction = transitionParcelTransaction({ transaction, nextStatus: "Registration Pending", actor: sro, now: fixedDate });
  transaction = transitionParcelTransaction({ transaction, nextStatus: "Registered", actor: sro, now: fixedDate, note: "Recorded in local prototype" });

  assert.equal(transaction.status, "Registered");
  assert.equal(transaction.history.length, 4);
  assert.throws(
    () => transitionParcelTransaction({ transaction, nextStatus: "Rejected", actor: sro, now: fixedDate }),
    /cannot transition/
  );
  assert.throws(
    () => transitionParcelTransaction({ transaction, nextStatus: "Restricted", actor: sro, now: fixedDate }),
    /not a valid workflow transition/
  );
});

test("shows active RCCMS restrictions as Restricted without overwriting the recorded workflow state", () => {
  const transaction = createParcelTransaction({
    parcel,
    actor: citizen,
    transactionType: "Sale deed",
    now: fixedDate,
    id: "abcdefgh-1234"
  });
  const effective = getEffectiveParcelTransaction(transaction, {
    active: true,
    reason: "An active RCCMS stay restriction is recorded."
  });

  assert.equal(effective.status, "Restricted");
  assert.equal(effective.underlyingStatus, "Application Submitted");
  assert.equal(transaction.status, "Application Submitted");
  assert.equal(getEffectiveParcelTransaction(transaction, null).status, "Application Submitted");
  assert.equal(getEffectiveParcelTransaction({ ...transaction, status: "Registered" }, { active: true }).status, "Registered");
});

test("rejects malformed application inputs", () => {
  assert.throws(
    () => createParcelTransaction({ parcel, actor: citizen, transactionType: "  " }),
    /transaction type is required/
  );
  assert.throws(
    () => createParcelTransaction({ parcel, actor: null, transactionType: "Sale deed" }),
    /authenticated actor/
  );
});
