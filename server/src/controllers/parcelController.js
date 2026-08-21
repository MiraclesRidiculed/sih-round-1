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
  const { search = "", district = "" } = req.query;
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
        { district: pattern },
        { taluk: pattern },
        { hobli: pattern },
        { village: pattern }
      ]
    });
  }

  if (district) {
    filters.push({ district: new RegExp(`^${escapeRegex(String(district).trim())}$`, "i") });
  }

  const query = filters.length ? { $and: filters } : {};

  const parcels = await Parcel.find(query).sort({ district: 1, taluk: 1, village: 1 }).lean();

  res.json({
    count: parcels.length,
    items: parcels.map((parcel) => ({
      parcelId: parcel.parcelId,
      ulpin: parcel.ulpin || null,
      surveyNumber: parcel.surveyNumber,
      hissaNumber: parcel.hissaNumber,
      khataNumber: parcel.khataNumber,
      district: parcel.district,
      taluk: parcel.taluk,
      hobli: parcel.hobli,
      village: parcel.village,
      areaInAcres: parcel.areaInAcres,
      landUse: parcel.landUse,
      currentOwners: parcel.currentOwners,
      verificationHint: parcel.verificationHint
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

