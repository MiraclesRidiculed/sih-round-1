import assert from "node:assert/strict";
import test from "node:test";
import { buildDecisionSupportReport } from "./decisionSupportService.js";

const parcel = {
  parcelId: "KAR-BLRU-0001",
  ulpin: "29140200300119",
  currentOwners: [
    { name: "Holder A", sharePercent: 60 },
    { name: "Holder A", sharePercent: 40 }
  ],
  departmentalWorkflows: [{
    workflowType: "LAND_TRANSACTION",
    applicationReference: "LS-APP-1",
    status: "Registration Pending"
  }],
  disputeRecord: {},
  aiGeospatial: {
    satelliteChangeDetection: {
      anomalyDetected: true,
      anomalyType: "Simulated boundary sample",
      lastSatellitePassDate: "2026-08-18",
      confidenceScorePercent: 94
    }
  }
};

test("reports explainable parcel signals with source records and no unvalidated confidence", () => {
  const report = buildDecisionSupportReport({
    parcel,
    ownershipHistory: [{
      eventType: "MUTATION_SANCTIONED",
      eventDate: "2026-08-20T00:00:00.000Z",
      owners: [{ name: "Different Holder" }]
    }],
    rccmsCases: [{
      parcelId: parcel.parcelId,
      caseIdentifier: "CASE-1",
      currentStatus: "INTERIM_INJUNCTION",
      updatedAt: "2026-08-21T00:00:00.000Z"
    }],
    now: new Date("2026-09-27T00:00:00.000Z")
  });

  assert.equal(report.status, "signals-found");
  assert.equal(report.parcel.ulpin, parcel.ulpin);
  assert.equal(report.generatedAt, "2026-09-27T00:00:00.000Z");
  assert.equal(report.algorithm.type, "rules-based");
  assert.equal(report.algorithm.predictiveModel, false);
  assert.deepEqual(report.findings.map(({ code }) => code), [
    "POSSIBLE_DUPLICATE_HOLDER_ENTRY",
    "CURRENT_HOLDERS_DIFFER_FROM_LATEST_OWNERSHIP_EVENT",
    "PENDING_TRANSACTION_WITH_ACTIVE_RESTRICTION",
    "SIMULATED_SPATIAL_CHANGE_SAMPLE"
  ]);

  for (const finding of report.findings) {
    assert.ok(finding.detected);
    assert.ok(finding.explanation);
    assert.ok(finding.sourceData.length);
    assert.equal(finding.timestamp, report.generatedAt);
    assert.deepEqual(finding.confidence, {
      value: null,
      status: "not-calculated",
      explanation: "No calibrated confidence score is calculated by this deterministic rule."
    });
  }

  const serialized = JSON.stringify(report);
  assert.equal(serialized.includes("94"), false);
  assert.equal(serialized.includes("Different Holder"), false);
  assert.equal(serialized.includes("CASE-1"), false);
  assert.match(report.findings[3].explanation, /not produced or validated by this ruleset/);
  assert.match(report.limitation, /do not make legal/);
});

test("returns an explicit no-signal report when available records do not trigger rules", () => {
  const cleanParcel = {
    parcelId: "TN-KPM-0001",
    ulpin: "33030400100482",
    currentOwners: [{ name: "Holder A" }],
    departmentalWorkflows: [],
    disputeRecord: {},
    aiGeospatial: {}
  };
  const report = buildDecisionSupportReport({ parcel: cleanParcel });

  assert.equal(report.status, "no-rule-signals");
  assert.deepEqual(report.findings, []);
  assert.equal(report.validation.calibratedConfidence, false);
  assert.throws(() => buildDecisionSupportReport({}), /A parcel is required/);
});
