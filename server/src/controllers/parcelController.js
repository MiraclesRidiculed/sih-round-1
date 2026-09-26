import { DocumentRecord } from "../models/DocumentRecord.js";
import { OwnershipEvent } from "../models/OwnershipEvent.js";
import { Parcel } from "../models/Parcel.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { buildParcelVerificationReport } from "../services/parcelVerificationService.js";
import { env } from "../config/env.js";
import { eventBus } from "../events/eventBus.js";

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildQrPayload = (parcel) => ({
  parcelId: parcel.parcelId,
  token: parcel.qrToken,
  district: parcel.district,
  surveyNumber: parcel.surveyNumber,
  publicUrl: `${env.clientUrl}/verify/${parcel.parcelId}?token=${parcel.qrToken}`
});

const generateRandomHash = () => {
  const hexChars = "0123456789abcdef";
  let hash = "0x";
  for (let i = 0; i < 64; i += 1) {
    hash += hexChars[Math.floor(Math.random() * 16)];
  }
  return hash;
};

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
      departmentalWorkflows: parcel.departmentalWorkflows || [],
      disputeRecord: parcel.disputeRecord || {},
      subdivisionData: parcel.subdivisionData || {},
      verticalStrata: parcel.verticalStrata || {}
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
  const {
    department = "Revenue",
    title = "Service Request",
    applicant = "Citizen / Officer",
    remarks = "Processed via Land Stack DPI Interoperable API",
    actionType = "GENERAL"
  } = req.body;

  const parcel = await Parcel.findOne({ parcelId });
  if (!parcel) {
    res.status(404).json({ message: "Parcel not found" });
    return;
  }

  // Pre-Registration Anti-Fraud Lock Check
  const isDeedOrTransfer =
    actionType === "SALE_DEED" ||
    actionType === "REGISTRATION" ||
    department.toLowerCase().includes("registration") ||
    department.toLowerCase().includes("sro") ||
    title.toLowerCase().includes("sale deed") ||
    title.toLowerCase().includes("conveyance");

  if (isDeedOrTransfer && parcel.disputeRecord?.transactionLock) {
    const blockedCount = (parcel.disputeRecord.blockedAttemptsCount || 0) + 1;
    parcel.disputeRecord.blockedAttemptsCount = blockedCount;

    const blockedWorkflow = {
      id: `WF-BLK-${Date.now().toString().slice(-6)}`,
      department: "Sub-Registrar (SRO) Anti-Fraud Gate",
      title: "🚨 Transfer Registration Blocked",
      status: "Blocked by Law",
      applicant,
      initiatedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      remarks: `Attempted sale deed registration blocked under Section 52 Transfer of Property Act (Lis Pendens) & Civil Court Stay (${parcel.disputeRecord.caseNumber || "Injunction Active"}). Attempt #${blockedCount}.`,
      txHash: generateRandomHash()
    };

    parcel.departmentalWorkflows = [blockedWorkflow, ...(parcel.departmentalWorkflows || [])];
    await parcel.save();

    eventBus.broadcast("TRANSACTION_BLOCKED", {
      parcelId: parcel.parcelId,
      ulpin: parcel.ulpin,
      caseNumber: parcel.disputeRecord.caseNumber,
      courtName: parcel.disputeRecord.courtName,
      legalBasis: "Section 52 Transfer of Property Act — Lis Pendens (Active Injunction)",
      message: `Registration blocked on ${parcel.parcelId} due to active court order.`
    });

    return res.status(403).json({
      error: "TRANSACTION_BLOCKED",
      blocked: true,
      legalBasis: "Section 52, Transfer of Property Act (Lis Pendens) & Civil Court Injunction",
      message: `🚨 REGISTRATION BLOCKED: Active Court Injunction / Transaction Restriction Detected on parcel ${parcel.parcelId}. Transfer not permitted during pendency of litigation.`,
      dispute: parcel.disputeRecord,
      workflow: blockedWorkflow
    });
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
    txHash: generateRandomHash()
  };

  parcel.departmentalWorkflows = [newWorkflow, ...(parcel.departmentalWorkflows || [])];
  await parcel.save();

  // Broadcast real-time event across DPI
  eventBus.broadcast("WORKFLOW_COMPLETED", {
    parcelId: parcel.parcelId,
    ulpin: parcel.ulpin,
    department,
    title,
    applicant,
    summary: `${title} completed for parcel ${parcel.parcelId}`
  });

  res.json({
    message: "Workflow action recorded and anchored to Land Stack DPI audit trail",
    workflow: newWorkflow
  });
});

export const simulateSroDeedFastTrack = asyncHandler(async (req, res) => {
  const { parcelId } = req.params;
  const { buyerName = "Aaditya Venkatesh", consideration = "₹ 1,15,00,000", stampDuty = "₹ 5,75,000" } = req.body;

  const parcel = await Parcel.findOne({ parcelId });
  if (!parcel) {
    return res.status(404).json({ message: "Parcel not found" });
  }

  // Pre-Registration Anti-Fraud Lock
  if (parcel.disputeRecord?.transactionLock) {
    const blockedCount = (parcel.disputeRecord.blockedAttemptsCount || 0) + 1;
    parcel.disputeRecord.blockedAttemptsCount = blockedCount;

    const blockedWorkflow = {
      id: `WF-BLK-${Date.now().toString().slice(-6)}`,
      department: "Sub-Registrar (SRO) Anti-Fraud Gate",
      title: "🚨 Fast-Track Deed Registration Blocked",
      status: "Blocked by Law",
      applicant: buyerName,
      initiatedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      remarks: `Attempted sale deed registration blocked under Section 52 Transfer of Property Act (Lis Pendens) & Civil Court Stay (${parcel.disputeRecord.caseNumber || "Injunction Active"}). Attempt #${blockedCount}.`,
      txHash: generateRandomHash()
    };

    parcel.departmentalWorkflows = [blockedWorkflow, ...(parcel.departmentalWorkflows || [])];
    await parcel.save();

    eventBus.broadcast("TRANSACTION_BLOCKED", {
      parcelId: parcel.parcelId,
      ulpin: parcel.ulpin,
      caseNumber: parcel.disputeRecord.caseNumber,
      courtName: parcel.disputeRecord.courtName,
      legalBasis: "Section 52 Transfer of Property Act — Lis Pendens",
      message: `Registration blocked on ${parcel.parcelId} due to active court order.`
    });

    return res.status(403).json({
      error: "TRANSACTION_BLOCKED",
      blocked: true,
      legalBasis: "Section 52, Transfer of Property Act (Lis Pendens) & Civil Court Injunction",
      message: `🚨 REGISTRATION BLOCKED: Active Court Injunction / Transaction Restriction Detected on parcel ${parcel.parcelId}. Deed registration denied.`,
      dispute: parcel.disputeRecord
    });
  }

  // 1. SRO Deed Registration
  const deedNumber = `DOC-${new Date().getFullYear()}-SRO-${Date.now().toString().slice(-5)}`;
  const sroWorkflow = {
    id: `WF-SRO-${Date.now().toString().slice(-5)}`,
    department: "Sub-Registrar (SRO)",
    title: `Sale Deed Registered (${deedNumber})`,
    status: "Registered",
    applicant: buyerName,
    initiatedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    remarks: `Deed executed: Consideration ${consideration}, Stamp Duty ${stampDuty} paid. Electronic Index-II generated.`,
    txHash: generateRandomHash()
  };

  // 2. Automated e-Mutation Trigger (Inter-agency Zero-Lag Sync)
  const mutationNumber = `MR-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
  const mutationWorkflow = {
    id: `WF-MUT-${Date.now().toString().slice(-5)}`,
    department: "Revenue Department (Bhoomi / Tamil Nilam)",
    title: `Automated e-Mutation Sanctioned (${mutationNumber})`,
    status: "Sanctioned in RoR",
    applicant: buyerName,
    initiatedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    remarks: `Direct SRO API hook triggered automatic e-Mutation under DPI interoperability protocol. Updated digital Record of Rights.`,
    txHash: generateRandomHash()
  };

  // Update current owner
  const previousOwner = parcel.currentOwners[0]?.name || "Prior Landowner";
  parcel.currentOwners = [
    {
      name: buyerName,
      relation: "Transferee via Registered Sale Deed",
      sharePercent: 100,
      identifierMasked: `XXXX${Math.floor(1000 + Math.random() * 9000)}`
    }
  ];

  parcel.departmentalWorkflows = [mutationWorkflow, sroWorkflow, ...(parcel.departmentalWorkflows || [])];
  parcel.verificationHint = {
    status: "verified",
    summary: `Transferred to ${buyerName} via registered deed ${deedNumber} with automated zero-lag e-Mutation ${mutationNumber}.`
  };

  await parcel.save();

  // Broadcast real-time events across agencies
  eventBus.broadcast("DEED_REGISTERED", {
    parcelId: parcel.parcelId,
    ulpin: parcel.ulpin,
    deedNumber,
    buyerName,
    previousOwner,
    consideration,
    summary: `SRO Registered Sale Deed ${deedNumber} in favor of ${buyerName}`
  });

  setTimeout(() => {
    eventBus.broadcast("MUTATION_COMPLETED", {
      parcelId: parcel.parcelId,
      ulpin: parcel.ulpin,
      mutationNumber,
      newOwner: buyerName,
      summary: `Automated e-Mutation ${mutationNumber} reflected in digital RoR / Patta`
    });
  }, 400);

  res.json({
    message: "Deed registered & automated e-Mutation executed in under 1s across Land Stack DPI",
    parcelId: parcel.parcelId,
    deedNumber,
    mutationNumber,
    newOwner: buyerName,
    workflows: [sroWorkflow, mutationWorkflow]
  });
});

export const subdivideParcel = asyncHandler(async (req, res) => {
  const { parcelId } = req.params;
  const {
    splitRatio = 0.6,
    subdivisionReason = "Family Partition / Partial Sale Boundary Division",
    surveyorName = "Licensed Surveyor P. Vignesh, LIS"
  } = req.body;

  const parcel = await Parcel.findOne({ parcelId });
  if (!parcel) {
    return res.status(404).json({ message: "Parcel not found" });
  }

  if (parcel.disputeRecord?.transactionLock) {
    return res.status(403).json({
      error: "SUBDIVISION_RESTRICTED",
      message: `🔒 Subdivision Blocked: Parcel ${parcel.parcelId} is under active court stay. Cadastral alterations prohibited.`
    });
  }

  const totalAcres = Number(parcel.areaInAcres || 1.0);
  const areaA = Number((totalAcres * splitRatio).toFixed(2));
  const areaB = Number((totalAcres - areaA).toFixed(2));

  const baseUlpin = parcel.ulpin || parcel.parcelId;
  const childUlpinA = `${baseUlpin}-A`;
  const childUlpinB = `${baseUlpin}-B`;

  const childSurveyA = `${parcel.surveyNumber}/1`;
  const childSurveyB = `${parcel.surveyNumber}/2`;

  const sketchId = `SK-11E-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;

  const subdivisionRecord = {
    isSubdivided: true,
    subdivisionDate: new Date().toISOString().split("T")[0],
    subdivisionReason,
    surveyorName,
    sketchId,
    parentUlpin: baseUlpin,
    parentAreaAcres: totalAcres,
    activeSketch: {
      sketchId,
      surveyDate: new Date().toISOString().split("T")[0],
      surveyor: surveyorName,
      crs: "EPSG:4326 (WGS84)",
      scale: "1:1000",
      northOrientation: "0° True North",
      approvalStatus: "PENDING_APPROVAL",
      approvalAuthority: "Tehsildar / Assistant Director Land Records (ADLR)",
      demarcationLineCoords: [
        [12.9326, 79.9182],
        [12.9326, 79.9224]
      ]
    },
    subdivisions: [
      {
        part: "A",
        subUlpin: childUlpinA,
        surveyNumber: childSurveyA,
        areaInAcres: areaA,
        sharePercent: Math.round(splitRatio * 100),
        status: "Demarcated",
        proposedOwner: parcel.currentOwners[0]?.name || "Co-Owner A"
      },
      {
        part: "B",
        subUlpin: childUlpinB,
        surveyNumber: childSurveyB,
        areaInAcres: areaB,
        sharePercent: Math.round((1 - splitRatio) * 100),
        status: "Demarcated",
        proposedOwner: "Co-Owner B / Transferee"
      }
    ]
  };

  parcel.subdivisionData = subdivisionRecord;

  const workflowEntry = {
    id: `WF-SURV-${Date.now().toString().slice(-5)}`,
    department: "Survey Settlement & Land Records (SSLR)",
    title: `11E Cadastral Subdivision Proposed (${sketchId})`,
    status: "Pending Revenue Officer Approval",
    applicant: surveyorName,
    initiatedAt: new Date().toISOString(),
    completedAt: null,
    remarks: `Subdivision into Part A (${areaA} Acres, ${childUlpinA}) and Part B (${areaB} Acres, ${childUlpinB}). Pending Tehsildar sanction.`,
    txHash: generateRandomHash()
  };

  parcel.departmentalWorkflows = [workflowEntry, ...(parcel.departmentalWorkflows || [])];
  await parcel.save();

  eventBus.broadcast("SUBDIVISION_CREATED", {
    parcelId: parcel.parcelId,
    sketchId,
    surveyorName,
    childUlpinA,
    childUlpinB,
    areaA,
    areaB,
    summary: `11E Survey Subdivision proposed for ${parcel.parcelId} by Surveyor ${surveyorName}`
  });

  res.json({
    message: "Cadastral subdivision proposed and 11E survey sketch generated. Ready for Revenue Officer scrutiny.",
    subdivisionData: parcel.subdivisionData,
    workflow: workflowEntry
  });
});

export const approveSubdivision = asyncHandler(async (req, res) => {
  const { parcelId } = req.params;
  const { approvedBy = "Tehsildar & Assistant Director Land Records" } = req.body;

  const parcel = await Parcel.findOne({ parcelId });
  if (!parcel) {
    return res.status(404).json({ message: "Parcel not found" });
  }

  if (!parcel.subdivisionData?.activeSketch) {
    return res.status(400).json({ message: "No active subdivision sketch found to approve" });
  }

  parcel.subdivisionData.activeSketch.approvalStatus = "APPROVED";
  parcel.subdivisionData.activeSketch.approvedAt = new Date().toISOString();
  parcel.subdivisionData.activeSketch.approvedBy = approvedBy;

  const approvalWorkflow = {
    id: `WF-APPR-${Date.now().toString().slice(-5)}`,
    department: "Revenue Department (Tehsildar)",
    title: `11E Subdivision Sketch Sanctioned`,
    status: "Approved & Anchored",
    applicant: approvedBy,
    initiatedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    remarks: `Cadastral split sanctioned. Child ULPINs ${parcel.subdivisionData.subdivisions[0]?.subUlpin} & ${parcel.subdivisionData.subdivisions[1]?.subUlpin} activated on Land Stack Base Cadastral Layer.`,
    txHash: generateRandomHash()
  };

  parcel.departmentalWorkflows = [approvalWorkflow, ...(parcel.departmentalWorkflows || [])];
  await parcel.save();

  eventBus.broadcast("SUBDIVISION_APPROVED", {
    parcelId: parcel.parcelId,
    sketchId: parcel.subdivisionData.activeSketch.sketchId,
    approvedBy,
    summary: `Subdivision sketch approved for ${parcel.parcelId}. Child cadastral parcels active.`
  });

  res.json({
    message: "Subdivision sketch approved and child ULPINs registered on Land Stack DPI",
    subdivisionData: parcel.subdivisionData,
    workflow: approvalWorkflow
  });
});

export const createBankLien = asyncHandler(async (req, res) => {
  const { parcelId } = req.params;
  const {
    lenderName = "Indian Overseas Bank, Large Corporate Branch",
    mortgageAmount = "₹ 2,25,00,000",
    chargeType = "Equitable Mortgage & Working Capital Hypothecation"
  } = req.body;

  const parcel = await Parcel.findOne({ parcelId });
  if (!parcel) {
    return res.status(404).json({ message: "Parcel not found" });
  }

  if (parcel.disputeRecord?.transactionLock) {
    return res.status(403).json({
      error: "LIEN_RESTRICTED",
      message: "Cannot create mortgage lien on a parcel under active court injunction."
    });
  }

  parcel.essentialLayers = parcel.essentialLayers || {};
  parcel.essentialLayers.encumbrance = {
    hasMortgage: true,
    lenderName,
    mortgageAmount,
    chargeType,
    chargeDate: new Date().toISOString().split("T")[0],
    status: "Active Bank Charge Registered (Finacle / SRO)"
  };

  const lienWorkflow = {
    id: `WF-BNK-${Date.now().toString().slice(-5)}`,
    department: "Bank / Financial Institution (Finacle Gateway)",
    title: `Mortgage Charge Placed (${mortgageAmount})`,
    status: "Charge Created",
    applicant: lenderName,
    initiatedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    remarks: `${chargeType} of ${mortgageAmount} entered in RoR Column 11 and registered with SRO.`,
    txHash: generateRandomHash()
  };

  parcel.departmentalWorkflows = [lienWorkflow, ...(parcel.departmentalWorkflows || [])];
  await parcel.save();

  eventBus.broadcast("LIEN_CREATED", {
    parcelId: parcel.parcelId,
    ulpin: parcel.ulpin,
    lenderName,
    mortgageAmount,
    summary: `Bank Mortgage Lien of ${mortgageAmount} created by ${lenderName}`
  });

  res.json({
    message: "Bank mortgage charge registered and anchored across Land Stack Encumbrance Layer",
    encumbrance: parcel.essentialLayers.encumbrance,
    workflow: lienWorkflow
  });
});

export const releaseBankLien = asyncHandler(async (req, res) => {
  const { parcelId } = req.params;
  const { lenderName = "Lending Institution", remarks = "Loan closed; No-Dues Certificate (NDC) issued and charge vacated." } = req.body;

  const parcel = await Parcel.findOne({ parcelId });
  if (!parcel) {
    return res.status(404).json({ message: "Parcel not found" });
  }

  parcel.essentialLayers = parcel.essentialLayers || {};
  parcel.essentialLayers.encumbrance = {
    hasMortgage: false,
    lenderName: "None",
    mortgageAmount: "₹ 0",
    status: "Clear Title / Prior Charge Released"
  };

  const releaseWorkflow = {
    id: `WF-BNK-${Date.now().toString().slice(-5)}`,
    department: "Bank / Financial Institution (Finacle Gateway)",
    title: "Mortgage Charge Released (NDC Issued)",
    status: "Discharged",
    applicant: lenderName,
    initiatedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    remarks,
    txHash: generateRandomHash()
  };

  parcel.departmentalWorkflows = [releaseWorkflow, ...(parcel.departmentalWorkflows || [])];
  await parcel.save();

  eventBus.broadcast("LIEN_RELEASED", {
    parcelId: parcel.parcelId,
    ulpin: parcel.ulpin,
    summary: `Mortgage lien released by ${lenderName}. Clear title established.`
  });

  res.json({
    message: "Bank mortgage lien released and title cleared on Land Stack DPI",
    encumbrance: parcel.essentialLayers.encumbrance,
    workflow: releaseWorkflow
  });
});

export const recommendAiInspection = asyncHandler(async (req, res) => {
  const { parcelId } = req.params;
  const { inspectionReason = "AI Satellite Change Detection flagged 142 sq.m unauthorized footprint expansion into buffer zone" } = req.body;

  const parcel = await Parcel.findOne({ parcelId });
  if (!parcel) {
    return res.status(404).json({ message: "Parcel not found" });
  }

  const inspectionWorkflow = {
    id: `WF-AI-${Date.now().toString().slice(-5)}`,
    department: "Revenue Inspection Cell & Town Planning",
    title: "Field Encroachment Inspection Task Scheduled",
    status: "Inspection Assigned to VAO",
    applicant: "AI Geospatial Surveillance Radar",
    initiatedAt: new Date().toISOString(),
    completedAt: null,
    remarks: `${inspectionReason}. Physical field verification with GNSS rover scheduled.`,
    txHash: generateRandomHash()
  };

  parcel.departmentalWorkflows = [inspectionWorkflow, ...(parcel.departmentalWorkflows || [])];
  await parcel.save();

  eventBus.broadcast("AI_RECOMMENDATION_CREATED", {
    parcelId: parcel.parcelId,
    ulpin: parcel.ulpin,
    confidenceScorePercent: parcel.aiGeospatial?.satelliteChangeDetection?.confidenceScorePercent || 94,
    summary: `Field Inspection task scheduled for ${parcel.parcelId} based on AI satellite alert`
  });

  res.json({
    message: "Field inspection task created and assigned to Village Administrative Officer (VAO)",
    workflow: inspectionWorkflow
  });
});
