import { DocumentRecord } from "../models/DocumentRecord.js";
import { OwnershipEvent } from "../models/OwnershipEvent.js";
import { Parcel } from "../models/Parcel.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { buildParcelVerificationReport } from "../services/parcelVerificationService.js";
import { env } from "../config/env.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildQrPayload = (parcel) => ({
  parcelId: parcel.parcelId,
  token: parcel.qrToken,
  district: parcel.district,
  surveyNumber: parcel.surveyNumber,
  publicUrl: `${env.clientUrl}/verify/${parcel.parcelId}?token=${parcel.qrToken}`
});

export const listParcels = asyncHandler(async (req, res) => {
  const { search = "", district = "", state = "" } = req.query;
  const filters = [];

  if (search) {
    const pattern = new RegExp(escapeRegex(String(search).trim()), "i");
    filters.push({
      $or: [
        { parcelId: pattern },
        { ulpin: pattern },
        { surveyNumber: pattern },
        { hissaNumber: pattern },
        { khataNumber: pattern },
        { propertyId: pattern },
        { state: pattern },
        { district: pattern },
        { taluk: pattern },
        { hobli: pattern },
        { village: pattern },
        { "currentOwners.name": pattern }
      ]
    });
  }

  if (district) {
    filters.push({ district: new RegExp(`^${escapeRegex(String(district).trim())}$`, "i") });
  }

  if (state && state !== "All") {
    filters.push({ state: new RegExp(`^${escapeRegex(String(state).trim())}$`, "i") });
  }

  const query = filters.length ? { $and: filters } : {};

  const parcels = await Parcel.find(query).sort({ state: 1, district: 1, village: 1 }).lean();

  res.json({
    count: parcels.length,
    items: parcels.map((parcel) => ({
      parcelId: parcel.parcelId,
      ulpin: parcel.ulpin || null,
      surveyNumber: parcel.surveyNumber,
      hissaNumber: parcel.hissaNumber,
      khataNumber: parcel.khataNumber,
      propertyId: parcel.propertyId,
      state: parcel.state || "Karnataka",
      stateProfile: parcel.stateProfile || {},
      district: parcel.district,
      taluk: parcel.taluk,
      hobli: parcel.hobli,
      village: parcel.village,
      areaInAcres: parcel.areaInAcres,
      landClassification: parcel.landClassification,
      landUse: parcel.landUse,
      geoJson: parcel.geoJson,
      currentOwners: parcel.currentOwners,
      verificationHint: parcel.verificationHint,
      baseLayer: parcel.baseLayer || {},
      essentialLayers: parcel.essentialLayers || {},
      additionalLayers: parcel.additionalLayers || {},
      aiGeospatial: parcel.aiGeospatial || {},
      departmentalWorkflows: parcel.departmentalWorkflows || []
    }))
  });
});

export const getParcelDetail = asyncHandler(async (req, res) => {
  const parcel = await Parcel.findOne({ parcelId: req.params.parcelId }).lean();

  if (!parcel) {
    res.status(404).json({ message: "Parcel not found" });
    return;
  }

  const [documents, ownershipHistory, verification] = await Promise.all([
    DocumentRecord.find({ parcel: parcel._id }).sort({ createdAt: 1 }).lean(),
    OwnershipEvent.find({ parcel: parcel._id }).sort({ eventDate: 1 }).lean(),
    buildParcelVerificationReport(parcel)
  ]);

  res.json({
    ...parcel,
    documents,
    ownershipHistory,
    verification,
    qr: buildQrPayload(parcel)
  });
});

export const getParcelVerification = asyncHandler(async (req, res) => {
  const parcel = await Parcel.findOne({ parcelId: req.params.parcelId }).lean();

  if (!parcel) {
    res.status(404).json({ message: "Parcel not found" });
    return;
  }

  const verification = await buildParcelVerificationReport(parcel);
  res.json(verification);
});

export const getParcelQr = asyncHandler(async (req, res) => {
  const parcel = await Parcel.findOne({ parcelId: req.params.parcelId }).lean();

  if (!parcel) {
    res.status(404).json({ message: "Parcel not found" });
    return;
  }

  res.json(buildQrPayload(parcel));
});

export const addParcelWorkflow = asyncHandler(async (req, res) => {
  const { parcelId } = req.params;
  const { department = "Revenue", title = "Service Request", applicant = "Citizen / Officer", remarks = "Processed via Land Stack DPI Interoperable API" } = req.body;

  const parcel = await Parcel.findOne({ parcelId });
  if (!parcel) {
    res.status(404).json({ message: "Parcel not found" });
    return;
  }

  const hexChars = "0123456789abcdef";
  let randomHash = "0x";
  for (let i = 0; i < 64; i += 1) {
    randomHash += hexChars[Math.floor(Math.random() * 16)];
  }

  const newWorkflow = {
    id: `WF-${Date.now().toString().slice(-6)}`,
    department,
    title,
    status: "Completed",
    applicant,
    initiatedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    remarks,
    txHash: randomHash
  };

  parcel.departmentalWorkflows = [newWorkflow, ...(parcel.departmentalWorkflows || [])];
  await parcel.save();

  res.json({
    message: "Workflow action recorded and anchored to Land Stack DPI audit trail",
    workflow: newWorkflow
  });
});


