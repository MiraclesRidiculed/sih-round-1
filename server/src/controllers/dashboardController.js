import { DocumentRecord } from "../models/DocumentRecord.js";
import { Parcel } from "../models/Parcel.js";
import { VerificationScan } from "../models/VerificationScan.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getDashboard = asyncHandler(async (req, res) => {
  const [parcels, anchoredDocuments, recentScans] = await Promise.all([
    Parcel.find().sort({ district: 1 }).lean(),
    DocumentRecord.countDocuments({ hashAnchored: true }),
    VerificationScan.find().sort({ createdAt: -1 }).limit(8).populate("parcel").lean()
  ]);

  const flaggedParcels = parcels.filter((parcel) => parcel.verificationHint.status !== "verified").length;
  const activeEncumbrances = parcels.filter((parcel) =>
    /loan|encumbrance|active|mortgage/i.test(parcel.authoritativeRecords?.encumbranceStatus || "") ||
    parcel.essentialLayers?.encumbrance?.hasMortgage
  ).length;
  const aiAnomaliesDetected = parcels.filter((parcel) =>
    Boolean(parcel.aiGeospatial?.satelliteChangeDetection?.anomalyDetected)
  ).length;

  const states = Array.from(new Set(parcels.map((p) => p.state || "Karnataka")));

  res.json({
    legalNotice:
      "Authoritative State revenue, registration, and survey records remain the legal source of truth. Land Stack DPI provides an interoperable GIS integration, RRR framework, and tamper-evident audit layer under the aegis of the Department of Land Resources (DoLR), Government of India.",
    stats: {
      totalParcels: parcels.length,
      statesOnboarded: states.length,
      spatialLayersActive: 3,
      aiAnomaliesDetected,
      anchoredDocuments,
      activeEncumbrances,
      flaggedParcels
    },
    pilotStates: [
      {
        name: "Tamil Nadu",
        status: "Active Pilot (Launched 31 Dec 2025)",
        systems: "Tamil Nilam & TNREGINET",
        leadAgency: "Department of Land Administration, TN",
        parcelsCount: parcels.filter((p) => p.state === "Tamil Nadu").length
      },
      {
        name: "Chandigarh (UT)",
        status: "Active Pilot (Urban Cadastre)",
        systems: "Estate Office & Municipal Corp",
        leadAgency: "Chandigarh Administration",
        parcelsCount: parcels.filter((p) => p.state?.includes("Chandigarh")).length
      },
      {
        name: "Karnataka",
        status: "Active State Integration",
        systems: "Bhoomi, Kaveri 2.0 & SSLR",
        leadAgency: "Revenue Department, GoK",
        parcelsCount: parcels.filter((p) => p.state === "Karnataka").length
      }
    ],
    featuredParcels: parcels.map((parcel) => ({
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
    })),
    recentScans: recentScans.map((scan) => ({
      id: scan._id,
      parcelId: scan.parcel?.parcelId || "",
      village: scan.parcel?.village || "",
      district: scan.parcel?.district || "",
      state: scan.parcel?.state || "Karnataka",
      mode: scan.mode,
      overallStatus: scan.overallStatus,
      createdAt: scan.createdAt
    }))
  });
});
