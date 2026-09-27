import { DocumentRecord } from "../models/DocumentRecord.js";
import { OwnershipEvent } from "../models/OwnershipEvent.js";
import { Parcel } from "../models/Parcel.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { buildParcelVerificationReport } from "../services/parcelVerificationService.js";
import { env } from "../config/env.js";
import { eventBus } from "../events/eventBus.js";
import { getActiveStatutoryRestriction } from "../services/statutoryRestrictionService.js";
import { splitParcelPolygon } from "../services/cadastralSubdivisionService.js";
import { FieldSurveySubmission } from "../models/FieldSurveySubmission.js";
import { RccmsCase } from "../models/RccmsCase.js";
import { assembleParcelCentricRecord } from "../services/parcelCentricRecordService.js";
import {
  toCitizenParcelDetail,
  toCitizenParcelSearchResult,
  toOfficerParcelDetail,
  toOfficerParcelSearchResult
} from "../services/citizenParcelViewService.js";
import {
  createParcelTransaction,
  getEffectiveParcelTransaction,
  transitionParcelTransaction
} from "../services/parcelTransactionService.js";

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

const isValidSurveyPolygon = (geometry) =>
  Array.isArray(geometry?.coordinates) &&
  geometry.coordinates.length > 0 &&
  geometry.coordinates.every((ring) =>
    Array.isArray(ring) &&
    ring.length >= 4 &&
    ring.every((position) =>
      Array.isArray(position) &&
      Number.isFinite(position[0]) &&
      Number.isFinite(position[1]) &&
      position[0] >= -180 &&
      position[0] <= 180 &&
      position[1] >= -90 &&
      position[1] <= 90
    ) &&
    ring[0][0] === ring[ring.length - 1][0] &&
    ring[0][1] === ring[ring.length - 1][1]
  );

const rejectIfStatutorilyRestricted = async (parcel, res, operation) => {
  const restriction = await getActiveStatutoryRestriction(parcel);
  if (!restriction) return false;

  res.status(403).json({
    error: "STATUTORY_TRANSFER_RESTRICTION",
    blocked: true,
    legalBasis: "Active RCCMS stay restriction",
    administrativeReason: `${operation} cannot proceed. ${restriction.reason}`,
    message: `${operation} cannot proceed. ${restriction.reason}`,
    restriction
  });
  return true;
};

export const listParcels = asyncHandler(async (req, res) => {
  const { search = "", district = "", state = "" } = req.query;

  if (req.user?.role === "citizen") {
    const ulpin = String(search).trim();
    if (!ulpin) {
      res.json({ count: 0, items: [] });
      return;
    }
    const parcel = await Parcel.findOne({
      ulpin: new RegExp(`^${escapeRegex(ulpin)}$`, "i")
    }).lean();
    const items = parcel ? [toCitizenParcelSearchResult(parcel)] : [];
    res.json({ count: items.length, items });
    return;
  }

  if (req.user?.role !== "admin") {
    const searchTerm = String(search).trim();
    const parcels = searchTerm
      ? await Parcel.find({
          $or: [
            { ulpin: new RegExp(`^${escapeRegex(searchTerm)}$`, "i") },
            { parcelId: new RegExp(`^${escapeRegex(searchTerm)}$`, "i") },
            { surveyNumber: new RegExp(`^${escapeRegex(searchTerm)}$`, "i") }
          ]
        }).sort({ state: 1, district: 1, village: 1 }).limit(50).lean()
      : [];
    const items = parcels.map(toOfficerParcelSearchResult);
    res.json({ count: items.length, items });
    return;
  }

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

  const linkedRecordFilter = parcel.ulpin
    ? { $or: [{ ulpin: parcel.ulpin }, { parcel: parcel._id }] }
    : { parcel: parcel._id };
  const isCitizen = req.user?.role === "citizen";
  const isAdmin = req.user?.role === "admin";
  const canViewCourtRecords = isAdmin || req.user?.role === "court";
  const rccmsCasesQuery = RccmsCase.find(linkedRecordFilter).sort({ updatedAt: -1 });
  if (!canViewCourtRecords) rccmsCasesQuery.select("parcelId caseIdentifier currentStatus updatedAt");
  const [documents, ownershipHistory, verification, rccmsCases, surveySubmissions] = await Promise.all([
    isAdmin ? DocumentRecord.find({ parcel: parcel._id }).sort({ createdAt: 1 }).lean() : [],
    isAdmin || req.user?.role === "revenue_officer"
      ? OwnershipEvent.find({ parcel: parcel._id }).sort({ eventDate: 1 }).lean()
      : [],
    isAdmin ? buildParcelVerificationReport(parcel) : null,
    rccmsCasesQuery.lean(),
    isAdmin || req.user?.role === "surveyor"
      ? FieldSurveySubmission.find(linkedRecordFilter).sort({ surveyDate: -1 }).lean()
      : []
  ]);

  const unifiedRecord = assembleParcelCentricRecord({
    parcel,
    documents,
    ownershipHistory,
    rccmsCases,
    surveySubmissions
  });

  if (isCitizen) {
    res.json(toCitizenParcelDetail(parcel, unifiedRecord, req.user.id));
    return;
  }

  if (!isAdmin) {
    res.json(toOfficerParcelDetail(parcel, unifiedRecord, req.user.role, req.user.id));
    return;
  }

  res.json({
    ...parcel,
    documents,
    ownershipHistory,
    unifiedRecord,
    verification,
    qr: buildQrPayload(parcel)
  });
});

export const createParcelTransactionApplication = asyncHandler(async (req, res) => {
  const parcel = await Parcel.findOne({ parcelId: req.params.parcelId });
  if (!parcel) return res.status(404).json({ message: "Parcel not found." });

  const transactionType = req.body?.transactionType;
  if (typeof transactionType !== "string" || !transactionType.trim() || transactionType.trim().length > 100) {
    return res.status(400).json({ message: "Provide a transaction type of up to 100 characters." });
  }

  const transaction = createParcelTransaction({
    parcel,
    actor: { id: req.user.id, role: req.user.role },
    transactionType
  });
  parcel.departmentalWorkflows = [transaction, ...(parcel.departmentalWorkflows || [])];
  await parcel.save();

  const restriction = await getActiveStatutoryRestriction(parcel);
  res.status(201).json({
    transaction: getEffectiveParcelTransaction(transaction, restriction),
    prototype: true,
    notice: "This application is recorded in the local Land Stack prototype and is not a government registration decision."
  });
});

export const updateParcelTransactionStatus = asyncHandler(async (req, res) => {
  const parcel = await Parcel.findOne({ parcelId: req.params.parcelId });
  if (!parcel) return res.status(404).json({ message: "Parcel not found." });

  const workflows = parcel.departmentalWorkflows || [];
  const transactionIndex = workflows.findIndex((workflow) =>
    workflow?.workflowType === "LAND_TRANSACTION" && workflow.id === req.params.transactionId
  );
  if (transactionIndex < 0) {
    return res.status(404).json({ message: "Transaction application not found for this parcel." });
  }

  if (await rejectIfStatutorilyRestricted(parcel, res, "Transaction status update")) return;

  const current = workflows[transactionIndex];
  let updated;
  try {
    updated = transitionParcelTransaction({
      transaction: current,
      nextStatus: req.body?.status,
      actor: { id: req.user.id, role: req.user.role },
      note: req.body?.note
    });
  } catch (error) {
    if (error instanceof RangeError || error instanceof TypeError) {
      return res.status(400).json({ message: error.message });
    }
    throw error;
  }

  workflows[transactionIndex] = updated;
  parcel.departmentalWorkflows = workflows;
  await parcel.save();

  res.json({
    transaction: updated,
    prototype: true,
    notice: "The status reflects this local prototype workflow and is not a government registration decision."
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

export const submitFieldSurvey = asyncHandler(async (req, res) => {
  const parcel = await Parcel.findOne({ parcelId: req.params.parcelId });
  if (!parcel) return res.status(404).json({ message: "Parcel not found" });

  const {
    offlineId,
    surveyDate,
    observations,
    observedCoordinate
  } = req.body || {};
  if (
    typeof offlineId !== "string" ||
    !offlineId.trim() ||
    !Number.isFinite(Date.parse(surveyDate)) ||
    typeof observations !== "string" ||
    !observations.trim() ||
    parcel.geoJson?.geometry?.type !== "Polygon" ||
    !isValidSurveyPolygon(parcel.geoJson.geometry)
  ) {
    return res.status(400).json({ message: "A valid queued field survey and cadastral Polygon are required." });
  }
  if (
    observedCoordinate &&
    (!Number.isFinite(observedCoordinate.latitude) ||
      observedCoordinate.latitude < -90 ||
      observedCoordinate.latitude > 90 ||
      !Number.isFinite(observedCoordinate.longitude) ||
      observedCoordinate.longitude < -180 ||
      observedCoordinate.longitude > 180)
  ) {
    return res.status(400).json({ message: "The observed GPS coordinate is invalid." });
  }

  const filter = { offlineId: offlineId.trim() };
  const surveyorName = req.user?.name || req.user?.email;
  if (!surveyorName || !req.user?.id) {
    return res.status(401).json({ error: "UNAUTHORIZED", message: "A valid authenticated surveyor identity is required." });
  }
  let submission;
  try {
    submission = await FieldSurveySubmission.findOneAndUpdate(
      filter,
      {
        $setOnInsert: {
          parcel: parcel._id,
          parcelId: parcel.parcelId,
          ulpin: parcel.ulpin || "",
          surveyNumber: parcel.surveyNumber,
          surveyorId: String(req.user.id),
          surveyorName,
          surveyDate: new Date(surveyDate),
          observations: observations.trim(),
          observedCoordinate: observedCoordinate || null,
          cadastralGeometry: parcel.geoJson
        }
      },
      { new: true, upsert: true, runValidators: true }
    );
  } catch (error) {
    if (error.code !== 11000) throw error;
    submission = await FieldSurveySubmission.findOne(filter);
    if (!submission) throw error;
  }
  if (submission.parcelId !== parcel.parcelId) {
    return res.status(409).json({ message: "This offline survey identifier is already associated with a different parcel." });
  }
  res.status(201).json({ offlineId: submission.offlineId, synchronized: true });
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
  const action = String(actionType).toUpperCase();
  const isDeedOrTransfer =
    ["SALE_DEED", "REGISTRATION", "MUTATION", "E_MUTATION"].includes(action) ||
    department.toLowerCase().includes("registration") ||
    department.toLowerCase().includes("sro") ||
    /sale deed|conveyance|mutation|ownership transfer|patta transfer/i.test(title);

  if (isDeedOrTransfer && await rejectIfStatutorilyRestricted(parcel, res, "Deed registration or mutation")) {
    return;
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

  if (await rejectIfStatutorilyRestricted(parcel, res, "Subdivision")) return;

  const baseUlpin = parcel.ulpin || parcel.parcelId;
  const split = splitParcelPolygon(parcel.geoJson, splitRatio, baseUlpin);
  const [partA, partB] = split.children;

  const childSurveyA = `${parcel.surveyNumber}/1`;
  const childSurveyB = `${parcel.surveyNumber}/2`;

  const sketchId = `SK-11E-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`;

  const subdivisionRecord = {
    isSubdivided: true,
    subdivisionDate: new Date().toISOString().split("T")[0],
    subdivisionReason,
    surveyorName,
    sketchId,
    parentParcelId: parcel.parcelId,
    parentUlpin: baseUlpin,
    parentAreaSquareMeters: split.parentAreaSquareMeters,
    parentAreaInAcres: split.parentAreaInAcres,
    recordedParentAreaInAcres: parcel.areaInAcres,
    areaSource: "PARENT GEOJSON GEOMETRY",
    geometryAlgorithm: split.algorithm,
    identifierAlgorithm: split.identifierAlgorithm,
    activeSketch: {
      sketchId,
      surveyDate: new Date().toISOString().split("T")[0],
      surveyor: surveyorName,
      crs: "EPSG:4326 (WGS84)",
      splitAxis: split.splitAxis,
      splitLine: split.splitLine,
      approvalStatus: "PENDING_APPROVAL",
      approvalAuthority: "Tehsildar / Assistant Director Land Records (ADLR)"
    },
    subdivisions: [
      {
        part: "A",
        childIdentifier: partA.childIdentifier,
        identifierType: partA.identifierType,
        parentParcelId: parcel.parcelId,
        parentIdentifier: baseUlpin,
        geoJson: partA.geoJson,
        areaSquareMeters: partA.areaSquareMeters,
        surveyNumber: childSurveyA,
        areaInAcres: Number(partA.areaInAcres.toFixed(4)),
        sharePercent: Number(partA.sharePercent.toFixed(4)),
        status: "Demarcated",
        proposedOwner: parcel.currentOwners[0]?.name || "Co-Owner A"
      },
      {
        part: "B",
        childIdentifier: partB.childIdentifier,
        identifierType: partB.identifierType,
        parentParcelId: parcel.parcelId,
        parentIdentifier: baseUlpin,
        geoJson: partB.geoJson,
        areaSquareMeters: partB.areaSquareMeters,
        surveyNumber: childSurveyB,
        areaInAcres: Number(partB.areaInAcres.toFixed(4)),
        sharePercent: Number(partB.sharePercent.toFixed(4)),
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
    remarks: `Subdivision into Part A (${partA.areaInAcres.toFixed(4)} Acres, ${partA.childIdentifier}) and Part B (${partB.areaInAcres.toFixed(4)} Acres, ${partB.childIdentifier}). Pending Tehsildar sanction.`,
    txHash: generateRandomHash()
  };

  parcel.departmentalWorkflows = [workflowEntry, ...(parcel.departmentalWorkflows || [])];
  await parcel.save();

  eventBus.broadcast("SUBDIVISION_CREATED", {
    parcelId: parcel.parcelId,
    sketchId,
    surveyorName,
    childIdentifierA: partA.childIdentifier,
    childIdentifierB: partB.childIdentifier,
    areaA: partA.areaInAcres,
    areaB: partB.areaInAcres,
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

  if (await rejectIfStatutorilyRestricted(parcel, res, "Subdivision approval")) return;

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
    remarks: `Cadastral split sanctioned. Project child identifiers ${parcel.subdivisionData.subdivisions[0]?.childIdentifier || "not recorded"} & ${parcel.subdivisionData.subdivisions[1]?.childIdentifier || "not recorded"} activated on the cadastral layer.`,
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

  if (await rejectIfStatutorilyRestricted(parcel, res, "Mortgage lien creation")) return;

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
  const { inspectionReason = "Prototype remote-sensing change sample requires field review" } = req.body;

  const parcel = await Parcel.findOne({ parcelId });
  if (!parcel) {
    return res.status(404).json({ message: "Parcel not found" });
  }

  const inspectionWorkflow = {
    id: `WF-AI-${Date.now().toString().slice(-5)}`,
    department: "Revenue Inspection Cell & Town Planning",
    title: "Field Encroachment Inspection Task Scheduled",
    status: "Inspection Assigned to VAO",
    applicant: "Land Stack prototype change-detection module",
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
    summary: `Prototype change-detection review recorded for parcel ${parcel.parcelId}`
  });

  res.json({
    message: "Field inspection task created and assigned to Village Administrative Officer (VAO)",
    workflow: inspectionWorkflow
  });
});
