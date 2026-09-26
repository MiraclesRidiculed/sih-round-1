import { RccmsCase, RCCMS_CASE_STATES } from "../models/RccmsCase.js";

export const VALID_CASE_TRANSITIONS = Object.freeze({
  CASE_FILED: ["NOTICE_ISSUED"],
  NOTICE_ISSUED: ["INTERIM_INJUNCTION"],
  INTERIM_INJUNCTION: ["HEARING_DECREE"],
  HEARING_DECREE: ["STAY_VACATED"],
  STAY_VACATED: []
});

const officerName = (req) => req.user?.name || req.user?.email || req.user?.id || "";

export const assertCaseState = (state) => {
  if (!RCCMS_CASE_STATES.includes(state)) {
    throw new Error(`Invalid RCCMS case state: ${state}`);
  }
};

export const transitionRccmsCase = async (rccmsCase, toState, { req, note = "", order } = {}) => {
  assertCaseState(toState);
  const allowed = VALID_CASE_TRANSITIONS[rccmsCase.currentStatus] || [];
  if (!allowed.includes(toState)) {
    const error = new Error(`Invalid RCCMS transition from ${rccmsCase.currentStatus} to ${toState}`);
    error.statusCode = 409;
    error.code = "INVALID_CASE_TRANSITION";
    throw error;
  }

  const changedAt = new Date();
  const officer = officerName(req);
  rccmsCase.currentStatus = toState;
  rccmsCase.responsibleOfficer = officer || rccmsCase.responsibleOfficer;
  rccmsCase.auditTrail.push({
    fromState: rccmsCase.auditTrail.at(-1)?.toState || "UNINITIALIZED",
    toState,
    changedAt,
    responsibleOfficer: officer,
    note
  });
  if (order) rccmsCase.orders.push({ ...order, issuedAt: order.issuedAt || changedAt, responsibleOfficer: officer });
  await rccmsCase.save();
  return rccmsCase;
};

export const fileRccmsCase = async ({ parcel, body, req }) => {
  const caseIdentifier = body.caseIdentifier || body.caseNumber || `RCCMS-${Date.now().toString().slice(-8)}`;
  const existing = await RccmsCase.findOne({ caseIdentifier });
  if (existing) {
    const error = new Error("An RCCMS case with this identifier already exists.");
    error.statusCode = 409;
    error.code = "CASE_ALREADY_EXISTS";
    throw error;
  }

  const officer = officerName(req);
  const rccmsCase = await RccmsCase.create({
    caseIdentifier,
    parcel: parcel._id,
    parcelId: parcel.parcelId,
    ulpin: parcel.ulpin || "",
    filing: {
      filedAt: new Date(),
      courtName: body.courtName || "",
      caseType: body.caseType || "",
      filingReference: body.filingReference || ""
    },
    parties: body.parties || [],
    currentStatus: "CASE_FILED",
    responsibleOfficer: officer,
    auditTrail: [{
      fromState: "NONE",
      toState: "CASE_FILED",
      changedAt: new Date(),
      responsibleOfficer: officer,
      note: body.filingNote || "Case filed"
    }]
  });
  return rccmsCase;
};
