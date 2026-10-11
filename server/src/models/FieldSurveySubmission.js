import mongoose from "mongoose";

const { Schema } = mongoose;

const observedCoordinateSchema = new Schema(
  {
    latitude: { type: Number, required: true, min: -90, max: 90 },
    longitude: { type: Number, required: true, min: -180, max: 180 },
    accuracyMeters: { type: Number, min: 0 },
    capturedAt: { type: Date }
  },
  { _id: false }
);

const fieldSurveySubmissionSchema = new Schema(
  {
    offlineId: { type: String, required: true, unique: true, index: true },
    parcel: { type: Schema.Types.ObjectId, ref: "Parcel", required: true, index: true },
    parcelId: { type: String, required: true, index: true },
    ulpin: { type: String, default: "" },
    surveyNumber: { type: String, default: "" },
    surveyorId: { type: String, default: "" },
    surveyorName: { type: String, required: true },
    surveyDate: { type: Date, required: true },
    observations: { type: String, required: true, trim: true },
    observedCoordinate: { type: observedCoordinateSchema, default: null },
    cadastralGeometry: { type: Schema.Types.Mixed, required: true }
  },
  { timestamps: true }
);

export const FieldSurveySubmission = mongoose.model("FieldSurveySubmission", fieldSurveySubmissionSchema);
