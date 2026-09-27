import { Parcel } from "../models/Parcel.js";
import { RccmsCase } from "../models/RccmsCase.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { buildGovernanceDashboard } from "../services/governanceDashboardService.js";

const DASHBOARD_PARCEL_FIELDS = [
  "parcelId",
  "state",
  "district",
  "landUse",
  "disputeRecord",
  "departmentalWorkflows",
  "subdivisionData",
  "aiGeospatial",
  "essentialLayers.encumbrance.hasMortgage",
  "additionalLayers.propertyTax.paymentStatus",
  "additionalLayers.propertyTax.assessmentStatus",
  "additionalLayers.propertyTax.status"
].join(" ");

export const getDashboard = asyncHandler(async (req, res) => {
  const [parcels, rccmsCases] = await Promise.all([
    Parcel.find().select(DASHBOARD_PARCEL_FIELDS).lean(),
    RccmsCase.find().select("parcelId caseIdentifier currentStatus updatedAt").lean()
  ]);
  const dashboard = buildGovernanceDashboard({
    role: req.user.role,
    parcels,
    rccmsCases
  });

  if (req.user.role !== "admin") {
    return res.json({
      ...dashboard,
      generatedAt: new Date().toISOString()
    });
  }

  const featuredParcels = await Parcel.find()
    .sort({ district: 1 })
    .lean();

  return res.json({
    ...dashboard,
    generatedAt: new Date().toISOString(),
    featuredParcels: featuredParcels.map((parcel) => ({
      parcelId: parcel.parcelId,
      state: parcel.state || "Karnataka",
      stateProfile: parcel.stateProfile || {},
      district: parcel.district,
      taluk: parcel.taluk,
      hobli: parcel.hobli,
      village: parcel.village,
      surveyNumber: parcel.surveyNumber,
      hissaNumber: parcel.hissaNumber,
      khataNumber: parcel.khataNumber,
      propertyId: parcel.propertyId,
      ulpin: parcel.ulpin || null,
      verificationHint: parcel.verificationHint,
      areaInAcres: parcel.areaInAcres,
      landClassification: parcel.landClassification,
      landUse: parcel.landUse,
      geoJson: parcel.geoJson,
      currentOwners: parcel.currentOwners,
      baseLayer: parcel.baseLayer || {},
      essentialLayers: parcel.essentialLayers || {},
      additionalLayers: parcel.additionalLayers || {},
      aiGeospatial: parcel.aiGeospatial || {},
      departmentalWorkflows: parcel.departmentalWorkflows || []
    }))
  });
});
