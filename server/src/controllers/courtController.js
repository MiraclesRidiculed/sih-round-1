import { Parcel } from "../models/Parcel.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { eventBus } from "../events/eventBus.js";

export const issueCourtInjunction = asyncHandler(async (req, res) => {
  const { parcelId } = req.params;
  const {
    caseNumber = "OS-2024-BGM-104",
    courtName = "Civil Court Senior Division & Assistant Commissioner",
    presidingBench = "Bench III (Revenue Injunctions)",
    caseType = "Title Dispute & Boundary Injunction Suit",
    injunctionTerms = "Interim order restraining sale, conveyance, gift, lease, mutation or subdivision under Section 52 Transfer of Property Act",
    nextHearing = "2026-11-20",
    orderReference = `COURT-INJ-${Date.now().toString().slice(-6)}`
  } = req.body;

  const parcel = await Parcel.findOne({ parcelId });
  if (!parcel) {
    return res.status(404).json({ message: "Parcel not found" });
  }

  const hexChars = "0123456789abcdef";
  let randomHash = "0x";
  for (let i = 0; i < 64; i += 1) {
    randomHash += hexChars[Math.floor(Math.random() * 16)];
  }

  const disputeData = {
    hasActiveInjunction: true,
    transactionLock: true,
    caseNumber,
    courtName,
    presidingBench,
    caseType,
    stayOrderDate: new Date().toISOString().split("T")[0],
    injunctionStatus: "Active Court Injunction (Stay on Alienation)",
    injunctionTerms,
    nextHearing,
    orderReference,
    blockedAttemptsCount: parcel.disputeRecord?.blockedAttemptsCount || 0
  };

  parcel.disputeRecord = disputeData;
  parcel.verificationHint = {
    status: "mismatch",
    summary: `Active Legal Dispute: Interim injunction issued by ${courtName} (Case #${caseNumber}). Transaction lock active.`
  };

  const workflowEntry = {
    id: `WF-${Date.now().toString().slice(-6)}`,
    department: "Revenue Court (RCCMS)",
    title: `Injunction Order Issued (${caseNumber})`,
    status: "Injunction Active",
    applicant: `Hon. ${presidingBench}`,
    initiatedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    remarks: `${injunctionTerms}. Ref: ${orderReference}`,
    txHash: randomHash
  };

  parcel.departmentalWorkflows = [workflowEntry, ...(parcel.departmentalWorkflows || [])];
  await parcel.save();

  // Broadcast real-time DPI event to all connected portals
  eventBus.broadcast("COURT_INJUNCTION_ISSUED", {
    parcelId: parcel.parcelId,
    ulpin: parcel.ulpin,
    village: parcel.village,
    district: parcel.district,
    caseNumber,
    courtName,
    stayOrderDate: disputeData.stayOrderDate,
    transactionLock: true,
    summary: `Court Stay Issued on ${parcel.parcelId} by ${courtName}`
  });

  res.json({
    message: "Court stay injunction issued and transaction lock enforced across Land Stack DPI",
    parcelId: parcel.parcelId,
    disputeRecord: parcel.disputeRecord,
    workflow: workflowEntry
  });
});

export const liftCourtInjunction = asyncHandler(async (req, res) => {
  const { parcelId } = req.params;
  const { orderReference = `DISPOSE-${Date.now().toString().slice(-6)}`, remarks = "Suit disposed / Compromise decree entered; injunction vacated" } = req.body;

  const parcel = await Parcel.findOne({ parcelId });
  if (!parcel) {
    return res.status(404).json({ message: "Parcel not found" });
  }

  const hexChars = "0123456789abcdef";
  let randomHash = "0x";
  for (let i = 0; i < 64; i += 1) {
    randomHash += hexChars[Math.floor(Math.random() * 16)];
  }

  parcel.disputeRecord = {
    ...parcel.disputeRecord,
    hasActiveInjunction: false,
    transactionLock: false,
    injunctionStatus: "Injunction Vacated / Disposed",
    injunctionTerms: "No active restriction",
    vacatedDate: new Date().toISOString().split("T")[0]
  };

  parcel.verificationHint = {
    status: "verified",
    summary: `Litigation stay vacated under order ${orderReference}. Parcel title restored for lawful transaction.`
  };

  const workflowEntry = {
    id: `WF-${Date.now().toString().slice(-6)}`,
    department: "Revenue Court (RCCMS)",
    title: `Injunction Vacated (${orderReference})`,
    status: "Disposed",
    applicant: "RCCMS Registrar",
    initiatedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    remarks,
    txHash: randomHash
  };

  parcel.departmentalWorkflows = [workflowEntry, ...(parcel.departmentalWorkflows || [])];
  await parcel.save();

  eventBus.broadcast("COURT_INJUNCTION_REMOVED", {
    parcelId: parcel.parcelId,
    ulpin: parcel.ulpin,
    transactionLock: false,
    summary: `Court Stay Vacated on ${parcel.parcelId}. Transactions unlocked.`
  });

  res.json({
    message: "Injunction vacated and transaction lock removed",
    parcelId: parcel.parcelId,
    disputeRecord: parcel.disputeRecord
  });
});

export const getDisputeDetails = asyncHandler(async (req, res) => {
  const parcel = await Parcel.findOne({ parcelId: req.params.parcelId }).lean();
  if (!parcel) {
    return res.status(404).json({ message: "Parcel not found" });
  }

  res.json({
    parcelId: parcel.parcelId,
    ulpin: parcel.ulpin,
    disputeRecord: parcel.disputeRecord || {},
    courtWorkflows: (parcel.departmentalWorkflows || []).filter((w) =>
      w.department?.toLowerCase().includes("court") || w.title?.toLowerCase().includes("injunction") || w.title?.toLowerCase().includes("dispute")
    )
  });
});
