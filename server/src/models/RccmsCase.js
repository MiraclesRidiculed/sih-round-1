import mongoose from "mongoose";

const { Schema } = mongoose;

export const RCCMS_CASE_STATES = Object.freeze([
  "CASE_FILED",
  "NOTICE_ISSUED",
  "INTERIM_INJUNCTION",
  "HEARING_DECREE",
  "STAY_VACATED"
]);

const partySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: String, default: "" },
    identifierMasked: { type: String, default: "" }
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    type: { type: String, required: true },
    reference: { type: String, required: true },
    issuedAt: { type: Date, required: true },
    terms: { type: String, default: "" },
    responsibleOfficer: { type: String, default: "" }
  },
  { _id: false }
);

const auditSchema = new Schema(
  {
    fromState: { type: String, required: true },
    toState: { type: String, required: true },
    changedAt: { type: Date, required: true },
    responsibleOfficer: { type: String, default: "" },
    note: { type: String, default: "" }
  },
  { _id: false }
);

const rccmsCaseSchema = new Schema(
  {
    caseIdentifier: { type: String, required: true, unique: true, index: true },
    parcel: { type: Schema.Types.ObjectId, ref: "Parcel", required: true, index: true },
    parcelId: { type: String, required: true, index: true },
    ulpin: { type: String, default: "" },
    filing: {
      filedAt: { type: Date, required: true },
      courtName: { type: String, default: "" },
      caseType: { type: String, default: "" },
      filingReference: { type: String, default: "" }
    },
    parties: { type: [partySchema], default: [] },
    currentStatus: { type: String, enum: RCCMS_CASE_STATES, required: true },
    orders: { type: [orderSchema], default: [] },
    responsibleOfficer: { type: String, default: "" },
    auditTrail: { type: [auditSchema], default: [] }
  },
  { timestamps: true }
);

export const RccmsCase = mongoose.model("RccmsCase", rccmsCaseSchema);
