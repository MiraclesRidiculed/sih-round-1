import { randomUUID } from "node:crypto";

export const PARCEL_TRANSACTION_STATUSES = Object.freeze([
  "Application Submitted",
  "Under Verification",
  "Registration Pending",
  "Registered",
  "Rejected",
  "Restricted"
]);

const TERMINAL_STATUSES = new Set(["Registered", "Rejected"]);
const TRANSACTION_WORKFLOW_TYPE = "LAND_TRANSACTION";

const allowedNextStatuses = Object.freeze({
  "Application Submitted": ["Under Verification", "Rejected"],
  "Under Verification": ["Registration Pending", "Rejected"],
  "Registration Pending": ["Registered", "Rejected"],
  Registered: [],
  Rejected: []
});

export const isParcelTransaction = (record) => record?.workflowType === TRANSACTION_WORKFLOW_TYPE;

export const createParcelTransaction = ({ parcel, actor, transactionType, now = new Date(), id = randomUUID() }) => {
  if (!parcel || !parcel.parcelId) throw new TypeError("A parcel is required to create a transaction application.");
  if (!actor?.id || !actor?.role) throw new TypeError("An authenticated actor is required to create a transaction application.");
  if (typeof transactionType !== "string" || !transactionType.trim()) {
    throw new TypeError("A transaction type is required.");
  }

  const timestamp = new Date(now).toISOString();
  return {
    id,
    workflowType: TRANSACTION_WORKFLOW_TYPE,
    department: "Land Stack local transaction tracker",
    title: transactionType.trim(),
    transactionType: transactionType.trim(),
    applicationReference: `LS-APP-${new Date(now).getFullYear()}-${id.slice(0, 8).toUpperCase()}`,
    applicantId: String(actor.id),
    submittedByRole: actor.role,
    status: "Application Submitted",
    initiatedAt: timestamp,
    updatedAt: timestamp,
    history: [{
      status: "Application Submitted",
      changedAt: timestamp,
      changedByRole: actor.role,
      note: "Application received by the local Land Stack prototype."
    }],
    localPrototype: true
  };
};

export const getEffectiveParcelTransaction = (transaction, restriction) => {
  if (!restriction || TERMINAL_STATUSES.has(transaction.status)) return { ...transaction };
  return {
    ...transaction,
    underlyingStatus: transaction.status,
    status: "Restricted",
    restrictionNotice: restriction.reason
  };
};

export const transitionParcelTransaction = ({ transaction, nextStatus, actor, now = new Date(), note = "" }) => {
  if (!transaction || !isParcelTransaction(transaction)) {
    throw new TypeError("A local parcel transaction application is required.");
  }
  if (!actor?.id || !actor?.role) throw new TypeError("An authenticated actor is required to update a transaction.");
  if (!PARCEL_TRANSACTION_STATUSES.includes(nextStatus) || nextStatus === "Restricted") {
    throw new RangeError("The requested transaction status is not a valid workflow transition.");
  }
  if (!allowedNextStatuses[transaction.status]?.includes(nextStatus)) {
    throw new RangeError(`A transaction cannot transition from "${transaction.status}" to "${nextStatus}".`);
  }

  const timestamp = new Date(now).toISOString();
  return {
    ...transaction,
    status: nextStatus,
    updatedAt: timestamp,
    history: [
      ...(transaction.history || []),
      {
        status: nextStatus,
        changedAt: timestamp,
        changedByRole: actor.role,
        note: typeof note === "string" ? note.trim().slice(0, 500) : ""
      }
    ]
  };
};
