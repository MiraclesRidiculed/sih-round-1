import mongoose from "mongoose";

const { Schema } = mongoose;

const documentRecordSchema = new Schema(
  {
    parcel: {
      type: Schema.Types.ObjectId,
      ref: "Parcel",
      required: true,
      index: true
    },
    documentType: {
      type: String,
      enum: [
        "RTC",
        "PATTA_CHITTA",
        "UPR_RECORD",
        "MUTATION_ORDER",
        "SALE_DEED",
        "REGISTERED_DEED",
        "ENCUMBRANCE_CERTIFICATE",
        "SURVEY_SKETCH",
        "KHATA_EXTRACT",
        "COURT_ORDER",
        "BUILDING_APPROVAL",
        "HERITAGE_NOC",
        "OTHER"
      ],
      required: true
    },
    title: { type: String, required: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, default: "application/pdf" },
    storageType: {
      type: String,
      enum: ["ipfs", "object-storage", "demo"],
      default: "demo"
    },
    storageUri: { type: String, required: true },
    sha256Hash: { type: String, required: true, lowercase: true, index: true },
    hashAnchored: { type: Boolean, default: false },
    blockchainTxHash: { type: String, default: "" },
    verificationStatus: {
      type: String,
      enum: ["matched", "not-anchored", "mismatch", "pending"],
      default: "pending"
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

export const DocumentRecord = mongoose.model("DocumentRecord", documentRecordSchema);

