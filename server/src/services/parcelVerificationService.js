import { DocumentRecord } from "../models/DocumentRecord.js";
import { OwnershipEvent } from "../models/OwnershipEvent.js";
import { fetchRegistrationSnapshot } from "./integrations/kaveriRegistrationGateway.js";
import { fetchRtcSnapshot } from "./integrations/bhoomiRtcGateway.js";
import { fetchSurveySnapshot } from "./integrations/surveyGateway.js";
import { fetchParcelAnchors, getBlockchainStatus } from "./blockchainService.js";

const normalizeHash = (hash) => String(hash || "").trim().toLowerCase().replace(/^0x/, "");

const compareOwnerSets = (leftOwners = [], rightOwners = []) => {
  const left = leftOwners.map((owner) => owner.name.trim().toLowerCase()).sort();
  const right = rightOwners.map((owner) => owner.name.trim().toLowerCase()).sort();
  return JSON.stringify(left) === JSON.stringify(right);
};

const makeFinding = (severity, title, detail, code) => ({
  severity,
  title,
  detail,
  code
});

export const buildParcelVerificationReport = async (parcel) => {
  const [documents, ownershipEvents, blockchainAnchors] = await Promise.all([
    DocumentRecord.find({ parcel: parcel._id }).sort({ createdAt: 1 }).lean(),
    OwnershipEvent.find({ parcel: parcel._id }).sort({ eventDate: 1 }).lean(),
    fetchParcelAnchors(parcel)
  ]);

  const [rtcSnapshot, registrationSnapshot, surveySnapshot] = await Promise.all([
    fetchRtcSnapshot(parcel),
    fetchRegistrationSnapshot(parcel, documents, ownershipEvents),
    fetchSurveySnapshot(parcel)
  ]);

  const findings = [];

  if (parcel.geoJson?.geometry?.type === "Polygon") {
    findings.push(
      makeFinding(
        "pass",
        "2D parcel geometry present",
        "Parcel geometry is stored as GeoJSON Polygon and remains within Karnataka-only MVP scope.",
        "MAP_2D_POLYGON"
      )
    );
  }

  const latestOwnershipEvent = [...ownershipEvents].sort(
    (left, right) => new Date(right.eventDate) - new Date(left.eventDate)
  )[0];

  if (latestOwnershipEvent && compareOwnerSets(parcel.currentOwners, latestOwnershipEvent.owners)) {
    findings.push(
      makeFinding(
        "pass",
        "Current owner set matches latest ownership event",
        "Current parcel ownership aligns with the newest recorded ownership event in MongoDB.",
        "OWNER_EVENT_MATCH"
      )
    );
  } else if (latestOwnershipEvent) {
    findings.push(
      makeFinding(
        "high",
        "Current owner set diverges from latest ownership event",
        "The latest ownership event does not match the current owner set reflected on the parcel record.",
        "OWNER_EVENT_MISMATCH"
      )
    );
  }

  if (
    registrationSnapshot.latestRegisteredOwnerNames.length &&
    compareOwnerSets(
      parcel.currentOwners,
      registrationSnapshot.latestRegisteredOwnerNames.map((name) => ({ name }))
    )
  ) {
    findings.push(
      makeFinding(
        "pass",
        "Registered deed holder aligns with current parcel owner set",
        "Registration metadata is internally consistent with the parcel owner summary.",
        "REGISTRATION_MATCH"
      )
    );
  } else if (registrationSnapshot.latestRegisteredOwnerNames.length) {
    findings.push(
      makeFinding(
        "high",
        "Registered deed holder differs from parcel owner set",
        "Registration metadata suggests a different owner than the current parcel state, which needs manual review against authoritative Karnataka records.",
        "REGISTRATION_OWNER_MISMATCH"
      )
    );
  }

  if (/pending/i.test(parcel.authoritativeRecords.mutationStatus || "")) {
    findings.push(
      makeFinding(
        "warning",
        "Mutation reflection is pending",
        "Mutation status indicates the revenue record may not yet have caught up with registration or transfer activity.",
        "MUTATION_PENDING"
      )
    );
  } else {
    findings.push(
      makeFinding(
        "pass",
        "Mutation trail is reflected",
        "Seeded mutation data appears synchronized with current parcel state.",
        "MUTATION_OK"
      )
    );
  }

  if (/objection|dispute/i.test(parcel.authoritativeRecords.disputeStatus || parcel.authoritativeRecords.mutationStatus || "")) {
    findings.push(
      makeFinding(
        "high",
        "Dispute or objection noted",
        "Revenue remarks in the demo dataset contain an objection/dispute note that prevents a clean verification outcome.",
        "DISPUTE_NOTE"
      )
    );
  }

  if (/loan|encumbrance|active/i.test(parcel.authoritativeRecords.encumbranceStatus || "")) {
    findings.push(
      makeFinding(
        "warning",
        "Encumbrance activity present",
        "Encumbrance data indicates an active entry that should be reviewed before relying on the parcel transaction history.",
        "ENCUMBRANCE_ACTIVE"
      )
    );
  } else {
    findings.push(
      makeFinding(
        "pass",
        "No active encumbrance flagged in seeded summary",
        "The latest encumbrance summary does not show a live burden in demo data.",
        "ENCUMBRANCE_CLEAR"
      )
    );
  }

  const anchoredDocuments = documents.filter((document) => document.hashAnchored).length;
  const unanchoredDocuments = documents.length - anchoredDocuments;

  if (unanchoredDocuments === 0) {
    findings.push(
      makeFinding(
        "pass",
        "All supporting document hashes are anchored or marked matched",
        "Every stored supporting document in the demo parcel has a corresponding blockchain-ready fingerprint entry.",
        "DOCS_ALL_ANCHORED"
      )
    );
  } else {
    findings.push(
      makeFinding(
        "warning",
        "Some documents are not yet chain-anchored",
        `${unanchoredDocuments} supporting document(s) still need blockchain anchoring.`,
        "DOCS_PENDING_ANCHOR"
      )
    );
  }

  const hasHigh = findings.some((finding) => finding.severity === "high");
  const hasWarning = findings.some((finding) => finding.severity === "warning");
  const overallStatus = hasHigh ? "mismatch" : hasWarning ? "attention" : "verified";

  return {
    generatedAt: new Date().toISOString(),
    overallStatus,
    summary:
      overallStatus === "verified"
        ? "Seeded Karnataka parcel data is internally consistent across the available records."
        : overallStatus === "attention"
          ? "The parcel can be reviewed, but pending updates or unanchored records need attention."
          : "The parcel contains conflicting ownership or objection signals and requires manual verification against authoritative Karnataka records.",
    legalNotice:
      "Blockchain fingerprints and event history are tamper-evident aids only. They do not by themselves establish legal ownership.",
    identity: {
      parcelId: parcel.parcelId,
      ulpin: parcel.ulpin || "ULPIN not available in seeded record",
      surveyNumber: parcel.surveyNumber,
      hissaNumber: parcel.hissaNumber,
      district: parcel.district,
      taluk: parcel.taluk,
      hobli: parcel.hobli,
      village: parcel.village
    },
    authoritativeSnapshots: {
      rtc: rtcSnapshot,
      registration: registrationSnapshot,
      survey: surveySnapshot
    },
    documentSummary: {
      totalDocuments: documents.length,
      anchoredDocuments,
      unanchoredDocuments,
      matchedDocuments: documents.filter((document) => document.verificationStatus === "matched").length
    },
    blockchain: {
      ...getBlockchainStatus(),
      localAnchorStatus: parcel.blockchain?.anchorStatus || "demo-ready",
      onChainEventCount: blockchainAnchors.length
    },
    findings,
    ownershipTimeline: ownershipEvents,
    documents,
    blockchainAnchors
  };
};

export const verifyDocumentFingerprint = async ({ parcel, sha256Hash }) => {
  const normalizedHash = normalizeHash(sha256Hash);
  const search = normalizedHash.replace(/^0x/, "");

  const query = { sha256Hash: search };

  if (parcel) {
    query.parcel = parcel._id;
  }

  const matchedDocuments = await DocumentRecord.find(query).populate("parcel").lean();

  if (!matchedDocuments.length) {
    return {
      status: "not_found",
      sha256Hash: search,
      message: "No stored document fingerprint matches the submitted hash.",
      matches: []
    };
  }

  const allAnchored = matchedDocuments.every((document) => document.hashAnchored);

  return {
    status: allAnchored ? "verified" : "attention",
    sha256Hash: search,
    message: allAnchored
      ? "Submitted fingerprint matches a stored document hash and every match is chain-ready."
      : "Submitted fingerprint matches a stored document hash, but some matching records are not yet chain-anchored.",
    matches: matchedDocuments.map((document) => ({
      parcelId: document.parcel.parcelId,
      parcelLabel: `${document.parcel.district} / ${document.parcel.taluk} / ${document.parcel.village}`,
      documentType: document.documentType,
      title: document.title,
      hashAnchored: document.hashAnchored,
      blockchainTxHash: document.blockchainTxHash,
      recordReference: document.metadata?.recordReference || "",
      integrationMode: document.metadata?.integrationMode || "demo"
    }))
  };
};

