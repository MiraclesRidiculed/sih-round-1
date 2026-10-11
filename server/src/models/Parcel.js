import mongoose from "mongoose";

const { Schema } = mongoose;

const ownerShareSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    relation: { type: String, trim: true, default: "" },
    sharePercent: { type: Number, default: 100 },
    identifierMasked: { type: String, default: "" }
  },
  { _id: false }
);

const geoJsonSchema = new Schema(
  {
    type: { type: String, enum: ["Feature"], default: "Feature" },
    geometry: {
      type: {
        type: String,
        enum: ["Polygon"],
        required: true
      },
      coordinates: {
        type: [[[Number]]],
        required: true
      }
    },
    properties: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  { _id: false }
);

const parcelSchema = new Schema(
  {
    parcelId: { type: String, required: true, unique: true, index: true },
    ulpin: { type: String, unique: true, sparse: true, trim: true },
    surveyNumber: { type: String, required: true, trim: true },
    hissaNumber: { type: String, trim: true, default: "" },
    khataNumber: { type: String, trim: true, default: "" },
    propertyId: { type: String, trim: true, default: "" },
    district: { type: String, required: true, trim: true, index: true },
    taluk: { type: String, required: true, trim: true },
    hobli: { type: String, required: true, trim: true },
    village: { type: String, required: true, trim: true },
    areaInAcres: { type: Number, required: true },
    landClassification: { type: String, required: true, trim: true },
    landUse: { type: String, required: true, trim: true },
    geoJson: { type: geoJsonSchema, required: true },
    currentOwners: { type: [ownerShareSchema], default: [] },
    state: { type: String, required: true, default: "Karnataka", index: true },
    stateProfile: {
      type: Schema.Types.Mixed,
      default: {}
    },
    baseLayer: {
      type: Schema.Types.Mixed,
      default: {}
    },
    essentialLayers: {
      type: Schema.Types.Mixed,
      default: {}
    },
    additionalLayers: {
      type: Schema.Types.Mixed,
      default: {}
    },
    aiGeospatial: {
      type: Schema.Types.Mixed,
      default: {}
    },
    departmentalWorkflows: {
      type: [Schema.Types.Mixed],
      default: []
    },
    authoritativeRecords: {
      type: Schema.Types.Mixed,
      default: {}
    },
    sourceAvailability: {
      type: Schema.Types.Mixed,
      default: {}
    },
    verificationHint: {
      status: {
        type: String,
        enum: ["verified", "attention", "mismatch"],
        default: "attention"
      },
      summary: { type: String, default: "" }
    },
    blockchain: {
      type: Schema.Types.Mixed,
      default: {}
    },
    qrToken: { type: String, required: true, unique: true },
    demoNotes: { type: String, default: "" },
    disputeRecord: {
      type: Schema.Types.Mixed,
      default: {
        hasActiveInjunction: false,
        transactionLock: false,
        caseNumber: "",
        courtName: "",
        presidingBench: "",
        caseType: "",
        stayOrderDate: "",
        injunctionStatus: "No Pending Injunction",
        injunctionTerms: "",
        nextHearing: "",
        orderReference: "",
        blockedAttemptsCount: 0
      }
    },
    subdivisionData: {
      type: Schema.Types.Mixed,
      default: {
        isSubdivided: false,
        activeSketch: null,
        subdivisions: []
      }
    },
    verticalStrata: {
      type: Schema.Types.Mixed,
      default: {
        hasVerticalUnits: false,
        buildingName: "",
        totalFloors: 0,
        floors: []
      }
    },
    simulationState: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

export const Parcel = mongoose.model("Parcel", parcelSchema);

