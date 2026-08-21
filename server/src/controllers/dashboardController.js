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
    /loan|encumbrance|active/i.test(parcel.authoritativeRecords.encumbranceStatus || "")
  ).length;

  res.json({
    legalNotice:
      "Authoritative Karnataka records remain the legal source of truth. Blockchain data in this MVP is a tamper-evident audit and document verification layer.",
    stats: {
      totalParcels: parcels.length,
      anchoredDocuments,
      activeEncumbrances,
      flaggedParcels
    },
    featuredParcels: parcels.map((parcel) => ({
      parcelId: parcel.parcelId,
      district: parcel.district,
      taluk: parcel.taluk,
      hobli: parcel.hobli,
      village: parcel.village,
      surveyNumber: parcel.surveyNumber,
      hissaNumber: parcel.hissaNumber,
      ulpin: parcel.ulpin || null,
      verificationHint: parcel.verificationHint,
      areaInAcres: parcel.areaInAcres,
      currentOwners: parcel.currentOwners
    })),
    recentScans: recentScans.map((scan) => ({
      id: scan._id,
      parcelId: scan.parcel?.parcelId || "",
      village: scan.parcel?.village || "",
      district: scan.parcel?.district || "",
      mode: scan.mode,
      overallStatus: scan.overallStatus,
      createdAt: scan.createdAt
    }))
  });
});
