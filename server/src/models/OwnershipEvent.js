import mongoose from "mongoose";

const { Schema } = mongoose;

const ownershipPartySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    relation: { type: String, default: "" },
    sharePercent: { type: Number, default: 100 },
    identifierMasked: { type: String, default: "" }
  },
  { _id: false }
);

const ownershipEventSchema = new Schema(
  {
    parcel: {
      type: Schema.Types.ObjectId,
      ref: "Parcel",
      required: true,
      index: true
    },
    eventDate: { type: Date, required: true },
    eventType: {
      type: String,
      enum: [
        "RTC_ENTRY",
        "MUTATION_SANCTIONED",
        "SALE_DEED_REGISTERED",
        "GIFT_DEED_REGISTERED",
        "INHERITANCE",
        "COURT_NOTE",
        "ENCUMBRANCE_UPDATED"
      ],
      required: true
    },
    owners: { type: [ownershipPartySchema], default: [] },
    sourceAuthority: {
      type: Schema.Types.Mixed,
      default: {}
    },
    summary: { type: String, required: true },
    mutationNumber: { type: String, default: "" },
    registrationNumber: { type: String, default: "" },
    documentReference: { type: String, default: "" },
    blockchainTxHash: { type: String, default: "" },
    anchorMode: {
      type: String,
      enum: ["demo", "live", "pending"],
      default: "demo"
    }
  },
  { timestamps: true }
);

export const OwnershipEvent = mongoose.model("OwnershipEvent", ownershipEventSchema);

