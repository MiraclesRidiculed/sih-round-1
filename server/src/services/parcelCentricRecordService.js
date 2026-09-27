import { resolveActiveStatutoryRestriction } from "./statutoryRestrictionService.js";
import {
  getEffectiveParcelTransaction,
  isParcelTransaction
} from "./parcelTransactionService.js";
import { createRemoteSensingChangeDetection } from "./remoteSensingChangeDetectionService.js";

const hasData = (value) => {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.some(hasData);
  if (typeof value === "object") return Object.values(value).some(hasData);
  return true;
};

const statusIndicatesPending = (value) => {
  if (typeof value === "string") return /\b(pending|in progress|under scrutiny|under review)\b/i.test(value);
  if (Array.isArray(value)) return value.some(statusIndicatesPending);
  if (value && typeof value === "object") return Object.values(value).some(statusIndicatesPending);
  return false;
};

const selectRecord = (record = {}, keys) => Object.fromEntries(
  keys
    .filter((key) => record?.[key] !== undefined && record[key] !== null && record[key] !== "")
    .map((key) => [key, record[key]])
);

const createModule = ({ data, systemName, sourceAvailability, restricted = false }) => {
  const available = hasData(data);
  const source = sourceAvailability || {};
  const explicitPending = typeof source.status === "string" && /\b(pending|in progress|under review)\b/i.test(source.status);
  const status = restricted
    ? "restricted"
    : explicitPending || statusIndicatesPending(data)
      ? "pending"
      : available
        ? "available"
        : "unavailable";

  return {
    status,
    data: available ? data : null,
    source: {
      systemName: source.department || source.systemName || (available ? systemName : null),
      mode: "local-demo",
      authoritative: false,
      lastSynchronizedAt: source.lastSyncedAt || null
    }
  };
};

const documentsOfType = (documents, types) => documents
  .filter((document) => types.includes(document.documentType))
  .map((document) => ({
    id: String(document._id),
    documentType: document.documentType,
    title: document.title,
    reference: document.metadata?.reference || document.fileName,
    verificationStatus: document.verificationStatus,
    createdAt: document.createdAt || null,
    storageType: document.storageType
  }));

const mapOwnershipHistory = (events) => events.map((event) => ({
  id: String(event._id),
  eventDate: event.eventDate || null,
  eventType: event.eventType,
  owners: event.owners || [],
  sourceAuthority: event.sourceAuthority || {},
  summary: event.summary,
  mutationNumber: event.mutationNumber || "",
  registrationNumber: event.registrationNumber || "",
  documentReference: event.documentReference || "",
  anchorMode: event.anchorMode
}));

export const assembleParcelCentricRecord = ({
  parcel,
  documents = [],
  ownershipHistory = [],
  rccmsCases = [],
  surveySubmissions = []
}) => {
  if (!parcel) throw new TypeError("A parcel is required to assemble its unified record.");

  const ulpin = parcel.ulpin || null;
  const profileSystem = parcel.stateProfile?.systemName || null;
  const sourceAvailability = parcel.sourceAvailability || {};
  const activeRestriction = resolveActiveStatutoryRestriction(parcel, rccmsCases);
  const transactionApplications = (parcel.departmentalWorkflows || [])
    .filter(isParcelTransaction)
    .map((transaction) => getEffectiveParcelTransaction(transaction, activeRestriction))
    .map((transaction) => ({
      id: transaction.id,
      applicationReference: transaction.applicationReference,
      transactionType: transaction.transactionType,
      status: transaction.status,
      underlyingStatus: transaction.underlyingStatus || null,
      restrictionNotice: transaction.restrictionNotice || null,
      initiatedAt: transaction.initiatedAt,
      updatedAt: transaction.updatedAt,
      submittedByRole: transaction.submittedByRole,
      applicantId: transaction.applicantId,
      history: transaction.history || [],
      localPrototype: true
    }));
  const rorRecord = parcel.essentialLayers?.ror || {};
  const registrationRecord = parcel.essentialLayers?.registration || {};
  const zoningRecord = parcel.essentialLayers?.masterPlanZoning || {};
  const documentsByModule = {
    ror: documentsOfType(documents, ["RTC", "PATTA_CHITTA", "UPR_RECORD", "MUTATION_ORDER", "KHATA_EXTRACT"]),
    registration: documentsOfType(documents, ["SALE_DEED", "REGISTERED_DEED"]),
    planning: documentsOfType(documents, ["HERITAGE_NOC"]),
    buildingPermission: documentsOfType(documents, ["BUILDING_APPROVAL"]),
    encumbrance: documentsOfType(documents, ["ENCUMBRANCE_CERTIFICATE"]),
    cadastral: documentsOfType(documents, ["SURVEY_SKETCH"])
  };

  const modules = {
    cadastral: createModule({
      systemName: profileSystem,
      sourceAvailability: sourceAvailability.survey,
      data: {
        parcelId: parcel.parcelId,
        ulpin,
        surveyNumber: parcel.surveyNumber,
        hissaNumber: parcel.hissaNumber || null,
        areaInAcres: parcel.areaInAcres,
        district: parcel.district,
        taluk: parcel.taluk,
        hobli: parcel.hobli,
        village: parcel.village,
        landClassification: parcel.landClassification,
        geoJson: parcel.geoJson || null,
        cadastralMetadata: parcel.baseLayer || {},
        sourceRecords: documentsByModule.cadastral,
        fieldSurveySubmissions: surveySubmissions.map((submission) => ({
          offlineId: submission.offlineId,
          surveyDate: submission.surveyDate || null,
          observedCoordinate: submission.observedCoordinate || null,
          surveyorName: submission.surveyorName || null,
          createdAt: submission.createdAt || null
        }))
      }
    }),
    ror: createModule({
      systemName: profileSystem,
      sourceAvailability: sourceAvailability.rtc,
      data: {
        record: rorRecord,
        holders: parcel.currentOwners || [],
        rights: parcel.essentialLayers?.rrrSummary?.rights || [],
        mutation: selectRecord(parcel.authoritativeRecords, ["mutationNumber", "mutationStatus", "khataStatus"]),
        sourceRecord: selectRecord(parcel.authoritativeRecords, ["rtcNumber", "rtcLastUpdated"]),
        ownershipHistory: mapOwnershipHistory(ownershipHistory),
        sourceRecords: documentsByModule.ror
      }
    }),
    registration: createModule({
      systemName: profileSystem,
      sourceAvailability: sourceAvailability.registration,
      data: {
        record: registrationRecord,
        sourceRecord: selectRecord(parcel.authoritativeRecords, ["registrationReference", "registrationDate"]),
        sourceRecords: documentsByModule.registration
      }
    }),
    planning: createModule({
      systemName: zoningRecord.authority || profileSystem,
      sourceAvailability: sourceAvailability.planning,
      data: {
        masterPlan: zoningRecord,
        sourceRecords: documentsByModule.planning
      }
    }),
    buildingPermission: createModule({
      systemName: profileSystem,
      sourceAvailability: sourceAvailability.buildingPermissions || sourceAvailability.planning,
      data: {
        record: parcel.essentialLayers?.buildingPermissions || {},
        sourceRecords: documentsByModule.buildingPermission
      }
    }),
    encumbrance: createModule({
      systemName: profileSystem,
      sourceAvailability: sourceAvailability.encumbrance,
      data: {
        record: parcel.essentialLayers?.encumbrance || {},
        sourceRecord: selectRecord(parcel.authoritativeRecords, ["encumbranceStatus", "encumbranceCertificateNo"]),
        sourceRecords: documentsByModule.encumbrance
      }
    }),
    landUse: createModule({
      systemName: profileSystem,
      sourceAvailability: sourceAvailability.planning,
      data: {
        landClassification: parcel.landClassification,
        landUse: parcel.landUse
      }
    }),
    restrictions: createModule({
      systemName: profileSystem,
      sourceAvailability: sourceAvailability.rtc,
      restricted: Boolean(activeRestriction),
      data: {
        spatial: parcel.additionalLayers?.restrictionZones || {},
        recorded: parcel.essentialLayers?.rrrSummary?.restrictions || [],
        disputeRecord: parcel.disputeRecord || {},
        activeTransferRestriction: activeRestriction,
        cases: rccmsCases.map((rccmsCase) => ({
          caseIdentifier: rccmsCase.caseIdentifier,
          currentStatus: rccmsCase.currentStatus,
          filing: rccmsCase.filing || {},
          parties: rccmsCase.parties || [],
          orders: rccmsCase.orders || [],
          auditTrail: rccmsCase.auditTrail || [],
          responsibleOfficer: rccmsCase.responsibleOfficer || "",
          filedAt: rccmsCase.filing?.filedAt || null,
          createdAt: rccmsCase.createdAt || null,
          updatedAt: rccmsCase.updatedAt || null
        }))
      }
    }),
    propertyTax: createModule({
      systemName: profileSystem,
      sourceAvailability: sourceAvailability.propertyTax,
      data: parcel.additionalLayers?.propertyTax || {}
    }),
    utilities: createModule({
      systemName: profileSystem,
      sourceAvailability: sourceAvailability.utilities,
      data: {
        utilities: parcel.additionalLayers?.utilities || {},
        infrastructure: parcel.additionalLayers?.infrastructure || {},
        valuation: parcel.additionalLayers?.valuation || {}
      }
    }),
    transactions: {
      status: "available",
      data: {
        parcelId: parcel.parcelId,
        ulpin,
        registrationRecord: Object.keys(registrationRecord).length ? registrationRecord : null,
        sourceRecord: selectRecord(parcel.authoritativeRecords, ["registrationReference", "registrationDate"]),
        applications: transactionApplications
      },
      source: {
        systemName: "Land Stack local transaction tracker",
        mode: "local-demo",
        authoritative: false,
        lastSynchronizedAt: null
      }
    },
    changeDetection: {
      status: "available",
      data: createRemoteSensingChangeDetection(parcel),
      source: {
        systemName: null,
        mode: "simulated",
        authoritative: false,
        lastSynchronizedAt: null
      }
    }
  };

  return {
    schemaVersion: 1,
    correlation: {
      key: "ulpin",
      value: ulpin,
      localParcelId: parcel.parcelId
    },
    parcel: {
      parcelId: parcel.parcelId,
      ulpin,
      state: parcel.state || null,
      sourceSystem: profileSystem,
      recordStatus: parcel.verificationHint?.status || null,
      lastUpdatedAt: parcel.updatedAt || null
    },
    synchronization: {
      mode: "local-demo",
      authoritative: false,
      realTime: false,
      disclaimer: "Assembled from local Land Stack records and demonstration seed data; no external government systems are queried."
    },
    modules
  };
};
