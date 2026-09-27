import { resolveActiveStatutoryRestriction } from "./statutoryRestrictionService.js";

const PENDING_TRANSACTION_STATUSES = new Set([
  "Application Submitted",
  "Under Verification",
  "Registration Pending"
]);

const normalizeName = (value) =>
  typeof value === "string" ? value.trim().replace(/\s+/g, " ").toLowerCase() : "";

const compareNameSets = (left = [], right = []) => {
  const leftNames = left.map((owner) => normalizeName(owner?.name)).filter(Boolean).sort();
  const rightNames = right.map((owner) => normalizeName(owner?.name)).filter(Boolean).sort();
  return JSON.stringify(leftNames) === JSON.stringify(rightNames);
};

const makeFinding = ({ code, detected, explanation, sourceData, timestamp }) => ({
  code,
  detected,
  explanation,
  sourceData,
  confidence: {
    value: null,
    status: "not-calculated",
    explanation: "No calibrated confidence score is calculated by this deterministic rule."
  },
  timestamp
});

export const buildDecisionSupportReport = ({
  parcel,
  ownershipHistory = [],
  rccmsCases = [],
  now = new Date()
}) => {
  if (!parcel) throw new TypeError("A parcel is required to build a decision-support report.");

  const generatedAt = now.toISOString();
  const findings = [];
  const owners = Array.isArray(parcel.currentOwners) ? parcel.currentOwners : [];
  const normalizedOwnerNames = owners.map((owner) => normalizeName(owner?.name)).filter(Boolean);
  const duplicateOwnerCount = normalizedOwnerNames.length -
    new Set(normalizedOwnerNames).size;

  if (duplicateOwnerCount > 0) {
    findings.push(makeFinding({
      code: "POSSIBLE_DUPLICATE_HOLDER_ENTRY",
      detected: "Possible duplicate holder name entries are present.",
      explanation: "The parcel contains repeated normalized holder names. Shared names can be legitimate; review source records before making any change.",
      sourceData: [{
        record: "Parcel.currentOwners",
        fields: {
          parcelId: parcel.parcelId,
          holderEntryCount: owners.length,
          duplicateNameEntryCount: duplicateOwnerCount
        }
      }],
      timestamp: generatedAt
    }));
  }

  const latestOwnershipEvent = [...ownershipHistory]
    .filter((event) => event?.eventDate && Number.isFinite(new Date(event.eventDate).getTime()))
    .sort((left, right) => new Date(right.eventDate) - new Date(left.eventDate))[0];
  if (latestOwnershipEvent && !compareNameSets(owners, latestOwnershipEvent.owners || [])) {
    findings.push(makeFinding({
      code: "CURRENT_HOLDERS_DIFFER_FROM_LATEST_OWNERSHIP_EVENT",
      detected: "Current holder names differ from the latest recorded ownership event.",
      explanation: "This deterministic comparison uses normalized names only. It may reflect a pending or incomplete record update and is not a legal ownership determination.",
      sourceData: [{
        record: "Parcel.currentOwners",
        fields: { parcelId: parcel.parcelId, holderEntryCount: owners.length }
      }, {
        record: "OwnershipEvent",
        fields: {
          eventType: latestOwnershipEvent.eventType || null,
          eventDate: latestOwnershipEvent.eventDate,
          holderEntryCount: (latestOwnershipEvent.owners || []).length
        }
      }],
      timestamp: generatedAt
    }));
  }

  const activeRestriction = resolveActiveStatutoryRestriction(parcel, rccmsCases);
  const pendingTransactions = (parcel.departmentalWorkflows || [])
    .filter((workflow) =>
      workflow?.workflowType === "LAND_TRANSACTION" &&
      PENDING_TRANSACTION_STATUSES.has(workflow.status)
    );
  if (activeRestriction && pendingTransactions.length > 0) {
    findings.push(makeFinding({
      code: "PENDING_TRANSACTION_WITH_ACTIVE_RESTRICTION",
      detected: "Pending local transaction applications coexist with an active restriction record.",
      explanation: "The application has a pending transaction status while parcel/RCCMS records indicate an active transfer restriction. This is a review signal, not an enforcement decision.",
      sourceData: [{
        record: "Parcel.departmentalWorkflows",
        fields: {
          parcelId: parcel.parcelId,
          pendingApplicationCount: pendingTransactions.length,
          statuses: [...new Set(pendingTransactions.map((workflow) => workflow.status))]
        }
      }, {
        record: "Parcel/RCCMS restriction records",
        fields: {
          active: true
        }
      }],
      timestamp: generatedAt
    }));
  }

  const sampleChange = parcel.aiGeospatial?.satelliteChangeDetection;
  if (sampleChange?.anomalyDetected === true) {
    findings.push(makeFinding({
      code: "SIMULATED_SPATIAL_CHANGE_SAMPLE",
      detected: "An existing simulated change-detection sample is flagged for this parcel.",
      explanation: "This signal copies an existing local demonstration flag; it is not produced or validated by this ruleset and is not evidence of a real satellite-detected change.",
      sourceData: [{
        record: "Parcel.aiGeospatial.satelliteChangeDetection",
        fields: {
          parcelId: parcel.parcelId,
          ulpin: parcel.ulpin || null,
          anomalyDetected: true,
          anomalyType: sampleChange.anomalyType || null,
          lastSatellitePassDate: sampleChange.lastSatellitePassDate || null
        }
      }],
      timestamp: generatedAt
    }));
  }

  return {
    schemaVersion: 1,
    generatedAt,
    algorithm: {
      name: "Land Stack deterministic decision-support rules",
      version: "1",
      type: "rules-based",
      predictiveModel: false
    },
    parcel: {
      parcelId: parcel.parcelId || null,
      ulpin: parcel.ulpin || null
    },
    status: findings.length ? "signals-found" : "no-rule-signals",
    findings,
    validation: {
      predictiveAccuracy: "not measured",
      calibratedConfidence: false
    },
    limitation: "Decision support only. Rules operate on available local application/demo records, can produce false positives or miss issues, and do not make legal, ownership, registration, or enforcement decisions."
  };
};
