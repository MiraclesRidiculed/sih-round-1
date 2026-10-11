import { DocumentRecord } from "../models/DocumentRecord.js";
import { OwnershipEvent } from "../models/OwnershipEvent.js";
import { Parcel } from "../models/Parcel.js";
import { RccmsCase } from "../models/RccmsCase.js";
import { FieldSurveySubmission } from "../models/FieldSurveySubmission.js";
import {
  toCitizenParcelDetail,
  toOfficerParcelDetail
} from "../services/citizenParcelViewService.js";
import { assembleParcelCentricRecord } from "../services/parcelCentricRecordService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  createInteroperabilityError,
  createInteroperabilityResponse,
  canAccessInteroperabilityModule,
  INTEROPERABILITY_MODULES
} from "../services/landInteroperabilityService.js";

const ULPIN_PATTERN = /^\d{14}$/;

const sendError = (res, status, code, message, ulpin) =>
  res.status(status).json(createInteroperabilityError({ code, message, ulpin }));

const loadProjectedRecord = async (parcel, user) => {
  const linkedRecordFilter = parcel.ulpin
    ? { $or: [{ ulpin: parcel.ulpin }, { parcel: parcel._id }] }
    : { parcel: parcel._id };
  const isAdmin = user.role === "admin";
  const canViewCourtRecords = isAdmin || user.role === "court";
  const rccmsCasesQuery = RccmsCase.find(linkedRecordFilter).sort({ updatedAt: -1 });
  if (!canViewCourtRecords) rccmsCasesQuery.select("parcelId caseIdentifier currentStatus updatedAt");

  const [documents, ownershipHistory, rccmsCases, surveySubmissions] = await Promise.all([
    isAdmin ? DocumentRecord.find({ parcel: parcel._id }).sort({ createdAt: 1 }).lean() : [],
    user.role !== "citizen"
      ? OwnershipEvent.find({ parcel: parcel._id }).sort({ eventDate: 1 }).lean()
      : [],
    rccmsCasesQuery.lean(),
    isAdmin || user.role === "surveyor"
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

  if (isAdmin) {
    return {
      ...unifiedRecord,
      access: {
        role: user.role,
        policy: "application-demo-rbac",
        notice: "Role-based views are application demo permissions and do not establish legal authority."
      }
    };
  }

  const detail = user.role === "citizen"
    ? toCitizenParcelDetail(parcel, unifiedRecord, user.id)
    : toOfficerParcelDetail(parcel, unifiedRecord, user.role, user.id);
  return detail.unifiedRecord;
};

export const getInteroperabilityParcel = asyncHandler(async (req, res) => {
  const ulpin = String(req.params.ulpin || "").trim();
  if (!ULPIN_PATTERN.test(ulpin)) {
    return sendError(res, 400, "INVALID_ULPIN", "ULPIN must contain exactly 14 digits.", ulpin);
  }

  const parcel = await Parcel.findOne({ ulpin }).lean();
  if (!parcel) return sendError(res, 404, "PARCEL_NOT_FOUND", "No parcel was found for this ULPIN.", ulpin);

  const record = await loadProjectedRecord(parcel, req.user);
  return res.json(createInteroperabilityResponse({
    data: record,
    ulpin: parcel.ulpin || ulpin,
    role: req.user.role
  }));
});

export const getInteroperabilityParcelModule = asyncHandler(async (req, res) => {
  const ulpin = String(req.params.ulpin || "").trim();
  if (!ULPIN_PATTERN.test(ulpin)) {
    return sendError(res, 400, "INVALID_ULPIN", "ULPIN must contain exactly 14 digits.", ulpin);
  }

  const moduleName = INTEROPERABILITY_MODULES[req.params.module];
  if (!moduleName) return sendError(res, 404, "MODULE_NOT_FOUND", "The requested parcel module is not available.", ulpin);
  if (!canAccessInteroperabilityModule(req.user.role, req.params.module)) {
    return sendError(res, 403, "MODULE_ACCESS_RESTRICTED", "Your role is not permitted to access this parcel module.", ulpin);
  }

  const parcel = await Parcel.findOne({ ulpin }).lean();
  if (!parcel) return sendError(res, 404, "PARCEL_NOT_FOUND", "No parcel was found for this ULPIN.", ulpin);

  const record = await loadProjectedRecord(parcel, req.user);
  const module = record.modules?.[moduleName];
  if (!module || module.status === "restricted") {
    return sendError(res, 403, "MODULE_ACCESS_RESTRICTED", "Your role is not permitted to access this parcel module.", parcel.ulpin || ulpin);
  }

  const moduleSource = {
    ...(module.source || {}),
    systemName: module.source?.systemName || null,
    mode: ["simulated", "rules-based"].includes(module.source?.mode)
      ? module.source.mode
      : "local-demo",
    authoritative: false,
    realTime: false,
    lastSynchronizedAt: module.source?.lastSynchronizedAt || null,
    disclaimer: "This module contains local Land Stack prototype data; no external government system is queried."
  };
  return res.json(createInteroperabilityResponse({
    data: { ulpin: parcel.ulpin || ulpin, module },
    ulpin: parcel.ulpin || ulpin,
    role: req.user.role,
    module: req.params.module,
    source: moduleSource
  }));
});

export const interoperabilityNotFoundHandler = (req, res) =>
  res.status(404).json(createInteroperabilityError({
    code: "ROUTE_NOT_FOUND",
    message: "Land interoperability API route not found.",
    ulpin: req.params.ulpin
  }));

export const interoperabilityErrorHandler = (error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (process.env.NODE_ENV !== "test") console.error(error);
  return res.status(error.statusCode || 500).json(createInteroperabilityError({
    code: error.statusCode ? "REQUEST_FAILED" : "INTERNAL_SERVER_ERROR",
    message: error.statusCode ? error.message : "The interoperability API request could not be completed.",
    ulpin: req.params.ulpin
  }));
};
