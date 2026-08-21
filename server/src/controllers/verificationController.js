import { DocumentRecord } from "../models/DocumentRecord.js";
import { Parcel } from "../models/Parcel.js";
import { VerificationScan } from "../models/VerificationScan.js";
import { anchorDocumentOnChain, getBlockchainStatus } from "../services/blockchainService.js";
import { buildParcelVerificationReport, verifyDocumentFingerprint } from "../services/parcelVerificationService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const scanParcelQr = asyncHandler(async (req, res) => {
  const parcel = await Parcel.findOne({ parcelId: req.params.parcelId });

  if (!parcel) {
    res.status(404).json({ message: "Parcel not found" });
    return;
  }

  if (!req.body?.token || req.body.token !== parcel.qrToken) {
    res.status(400).json({
      message: "Invalid QR token for this parcel"
    });
    return;
  }

  const verification = await buildParcelVerificationReport(parcel.toObject());

  await VerificationScan.create({
    parcel: parcel._id,
    mode: "qr",
    scanToken: req.body.token,
    scannerIp: req.ip,
    userAgent: req.get("user-agent") || "",
    resultSummary: verification.summary,
    overallStatus: verification.overallStatus
  });

  res.json({
    parcelId: parcel.parcelId,
    verification
  });
});

export const verifyDocumentHash = asyncHandler(async (req, res) => {
  const { parcelId, sha256Hash } = req.body || {};

  if (!sha256Hash) {
    res.status(400).json({ message: "sha256Hash is required" });
    return;
  }

  const parcel = parcelId ? await Parcel.findOne({ parcelId }) : null;

  if (parcelId && !parcel) {
    res.status(404).json({ message: "Parcel not found" });
    return;
  }

  const result = await verifyDocumentFingerprint({ parcel, sha256Hash });

  if (parcel) {
    await VerificationScan.create({
      parcel: parcel._id,
      mode: "document-check",
      scanToken: "",
      scannerIp: req.ip,
      userAgent: req.get("user-agent") || "",
      resultSummary: result.message,
      overallStatus: result.status,
      documentHashChecked: result.sha256Hash
    });
  }

  res.json(result);
});

export const anchorDocument = asyncHandler(async (req, res) => {
  const { parcelId, documentId } = req.body || {};

  if (!parcelId || !documentId) {
    res.status(400).json({ message: "parcelId and documentId are required" });
    return;
  }

  const parcel = await Parcel.findOne({ parcelId });

  if (!parcel) {
    res.status(404).json({ message: "Parcel not found" });
    return;
  }

  const document = await DocumentRecord.findOne({ _id: documentId, parcel: parcel._id });

  if (!document) {
    res.status(404).json({ message: "Document not found for parcel" });
    return;
  }

  const result = await anchorDocumentOnChain({ parcel, document });

  if (result.anchored) {
    document.hashAnchored = true;
    document.blockchainTxHash = result.txHash;
    document.verificationStatus = "matched";
    await document.save();
  }

  res.json({
    ...result,
    blockchain: getBlockchainStatus()
  });
});

export const blockchainStatus = asyncHandler(async (req, res) => {
  res.json(getBlockchainStatus());
});
