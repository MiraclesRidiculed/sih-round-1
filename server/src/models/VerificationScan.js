import mongoose from "mongoose";

const { Schema } = mongoose;

const verificationScanSchema = new Schema(
  {
    parcel: {
      type: Schema.Types.ObjectId,
      ref: "Parcel",
      required: true,
      index: true
    },
    mode: {
      type: String,
      enum: ["qr", "manual-search", "document-check"],
      required: true
    },
    scanToken: { type: String, default: "" },
    scannerIp: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    resultSummary: { type: String, default: "" },
    overallStatus: { type: String, default: "" },
    documentHashChecked: { type: String, default: "" }
  },
  { timestamps: true }
);

export const VerificationScan = mongoose.model("VerificationScan", verificationScanSchema);

