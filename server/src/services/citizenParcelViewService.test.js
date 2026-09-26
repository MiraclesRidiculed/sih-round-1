import assert from "node:assert/strict";
import test from "node:test";
import { requireRole } from "../middleware/authMiddleware.js";
import {
  toCitizenParcelDetail,
  toCitizenParcelSearchResult,
  toOfficerParcelDetail
} from "./citizenParcelViewService.js";

const sourceParcel = {
  parcelId: "TN-KPM-0001",
  ulpin: "33030400100482",
  state: "Tamil Nadu",
  district: "Kanchipuram",
  taluk: "Sriperumbudur",
  village: "Mambakkam",
  surveyNumber: "248/3",
  areaInAcres: 1.25,
  landClassification: "Dry Agricultural",
  landUse: "Agricultural",
  stateProfile: { systemName: "Tamil Nilam demo" },
  currentOwners: [{ name: "Private Owner", identifierMasked: "XXXX" }],
  qrToken: "internal-qr-secret",
  departmentalWorkflows: [{ status: "Internal review" }],
  disputeRecord: { caseNumber: "INTERNAL-CASE", presidingBench: "Internal Bench" },
  subdivisionData: {
    isSubdivided: true,
    activeSketch: { sketchId: "SKETCH-1", status: "Approved", confidentialNote: "Secret sketch note" },
    subdivisions: [{
      childIdentifier: "CHILD-1",
      part: 1,
      areaInAcres: 0.5,
      internalOfficerNote: "Secret child note",
      geoJson: { type: "Feature", geometry: { type: "Polygon", coordinates: [[[79, 12], [79.5, 12], [79.5, 13], [79, 12]]] }, properties: { confidential: "secret" } }
    }]
  },
  geoJson: {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [[[79, 12], [80, 12], [80, 13], [79, 12]]] },
    properties: { privateOwnerName: "Private Owner", internalMemo: "secret" }
  },
  verificationHint: { status: "verified", summary: "internal verification note" },
  updatedAt: "2026-08-20T08:00:00.000Z"
};

const unifiedRecord = {
  schemaVersion: 1,
  correlation: { key: "ulpin", value: sourceParcel.ulpin, localParcelId: sourceParcel.parcelId },
  parcel: { sourceSystem: "Tamil Nilam demo", recordStatus: "verified", lastUpdatedAt: sourceParcel.updatedAt },
  synchronization: { mode: "local-demo", authoritative: false, realTime: false, disclaimer: "Local demonstration data only." },
  modules: {
    cadastral: {
      status: "available",
      data: { parcelId: sourceParcel.parcelId, ulpin: sourceParcel.ulpin, surveyNumber: "248/3", geoJson: sourceParcel.geoJson, fieldSurveySubmissions: [{ surveyorName: "Staff name" }] },
      source: { systemName: "Survey demo", mode: "local-demo", authoritative: false, lastSynchronizedAt: "2026-08-20" }
    },
    ror: {
      status: "available",
      data: {
        record: { rorNumber: "PATTA-1", holderName: "Private Owner", mutationStatus: "Complete" },
        holders: sourceParcel.currentOwners,
        rights: ["Recorded agricultural right"],
        ownershipHistory: [{ summary: "Internal history" }],
        sourceRecord: { rtcNumber: "RTC-1" },
        sourceRecords: [{ title: "Confidential document" }]
      },
      source: { systemName: "Tamil Nilam", mode: "local-demo", authoritative: false }
    },
    registration: {
      status: "available",
      data: { record: { status: "Registered", deedNumber: "DEED-1", considerationValue: 1000000 }, sourceRecord: { registrationDate: "2024-02-01" } },
      source: { systemName: "Registration demo", mode: "local-demo", authoritative: false }
    },
    planning: {
      status: "available",
      data: {
        masterPlan: {
          authority: "Planning office",
          zoneCategory: "Residential",
          planReference: "PLAN-2031-01",
          planningRestrictions: "Heritage facade controls",
          internalMemo: "secret"
        }
      },
      source: { systemName: "Planning demo", mode: "local-demo", authoritative: false }
    },
    buildingPermission: {
      status: "available",
      data: { record: { status: "Sanctioned", planApprovalNo: "APP-1", validTill: "2028-12-03", confidentialMemo: "secret" } },
      source: { systemName: "Planning demo", mode: "local-demo", authoritative: false }
    },
    encumbrance: {
      status: "available",
      data: { record: { hasMortgage: true, status: "Mortgage recorded", lenderName: "Private Bank", mortgageAmount: "Sensitive" } },
      source: { systemName: "Registration demo", mode: "local-demo", authoritative: false }
    },
    landUse: {
      status: "available",
      data: { landClassification: "Dry Agricultural", landUse: "Agricultural" },
      source: { systemName: "Land use demo", mode: "local-demo", authoritative: false }
    },
    restrictions: {
      status: "restricted",
      data: {
        spatial: { isEcoSensitive: false },
        recorded: ["Access buffer"],
        activeTransferRestriction: { active: true, caseIdentifier: "INTERNAL-CASE", reason: "Sensitive staff reason" },
        cases: [{ parties: [{ name: "Party" }], auditTrail: [{ note: "Private note" }] }]
      },
      source: { systemName: "Court system", mode: "local-demo", authoritative: false }
    },
    propertyTax: { status: "unavailable", data: null, source: null },
    utilities: { status: "unavailable", data: null, source: null },
    transactions: {
      status: "available",
      data: {
        parcelId: sourceParcel.parcelId,
        ulpin: sourceParcel.ulpin,
        registrationRecord: { deedNumber: "SENSITIVE-SRO-RECORD" },
        applications: [
          {
            id: "application-citizen-1",
            applicantId: "citizen-1",
            applicationReference: "LS-APP-1",
            transactionType: "Sale deed application",
            status: "Application Submitted",
            history: [{ status: "Application Submitted", changedByRole: "citizen", note: "received" }]
          },
          {
            id: "application-citizen-2",
            applicantId: "citizen-2",
            applicationReference: "LS-APP-2",
            transactionType: "Mutation application",
            status: "Under Verification",
            history: []
          }
        ]
      },
      source: { systemName: "Local prototype", mode: "local-demo", authoritative: false }
    }
  }
};

test("citizen parcel lookup includes only safe summary fields", () => {
  const result = toCitizenParcelSearchResult(sourceParcel);
  assert.equal(result.ulpin, sourceParcel.ulpin);
  assert.equal(result.surveyNumber, sourceParcel.surveyNumber);
  assert.equal("currentOwners" in result, false);
  assert.equal("geoJson" in result, false);
  assert.equal("disputeRecord" in result, false);
});

test("citizen detail exposes permitted statuses and land information, not administrative or personal data", () => {
  const result = toCitizenParcelDetail(sourceParcel, unifiedRecord, "citizen-1");
  const serialized = JSON.stringify(result);

  assert.equal(result.unifiedRecord.correlation.value, sourceParcel.ulpin);
  assert.equal(result.unifiedRecord.modules.registration.data.record.status, "Registered");
  assert.equal(result.unifiedRecord.modules.encumbrance.data.record.hasMortgage, true);
  assert.equal(result.unifiedRecord.modules.landUse.data.landUse, "Agricultural");
  assert.equal(result.unifiedRecord.modules.planning.data.masterPlan.zoneCategory, "Residential");
  assert.equal(result.unifiedRecord.modules.planning.data.masterPlan.planReference, "PLAN-2031-01");
  assert.equal(result.unifiedRecord.modules.planning.data.masterPlan.planningRestrictions, "Heritage facade controls");
  assert.equal(result.unifiedRecord.modules.buildingPermission.data.record.planApprovalNo, "APP-1");
  assert.equal(result.unifiedRecord.modules.buildingPermission.data.record.validTill, "2028-12-03");
  assert.equal("confidentialMemo" in result.unifiedRecord.modules.buildingPermission.data.record, false);
  assert.equal(result.unifiedRecord.modules.restrictions.status, "restricted");
  assert.deepEqual(result.unifiedRecord.modules.restrictions.data.activeTransferRestriction, {
    active: true,
    notice: "A transfer restriction is recorded for this parcel."
  });
  assert.equal(result.unifiedRecord.modules.propertyTax.status, "unavailable");
  assert.deepEqual(
    result.unifiedRecord.modules.transactions.data.applications.map((application) => application.id),
    ["application-citizen-1"]
  );
  assert.equal("applicantId" in result.unifiedRecord.modules.transactions.data.applications[0], false);
  assert.equal("registrationRecord" in result.unifiedRecord.modules.transactions.data, false);
  assert.equal("note" in result.unifiedRecord.modules.transactions.data.applications[0].history[0], false);
  assert.deepEqual(result.geoJson, {
    type: "Feature",
    geometry: sourceParcel.geoJson.geometry
  });
  assert.equal(result.unifiedRecord.synchronization.realTime, false);
  for (const restrictedValue of [
    "Private Owner",
    "XXXX",
    "internal-qr-secret",
    "INTERNAL-CASE",
    "Private Bank",
    "Sensitive staff reason",
    "Confidential document",
    "Internal review",
    "secret"
  ]) {
    assert.equal(serialized.includes(restrictedValue), false, `Citizen response must not expose ${restrictedValue}`);
  }
});

test("citizen response preserves unavailable status when a dataset has no configured source", () => {
  const result = toCitizenParcelDetail(sourceParcel, unifiedRecord);
  assert.equal(result.unifiedRecord.modules.propertyTax.status, "unavailable");
  assert.equal(result.unifiedRecord.modules.propertyTax.data, null);
  assert.equal(result.unifiedRecord.modules.propertyTax.source, null);
});

test("officer parcel views expose only each role's application demo modules", () => {
  const roleModules = {
    revenue_officer: ["cadastral", "ror", "landUse", "restrictions"],
    surveyor: ["cadastral", "restrictions"],
    sro: ["cadastral", "registration", "encumbrance", "restrictions", "transactions"],
    court: ["cadastral", "restrictions"],
    bank: ["cadastral", "ror", "encumbrance", "restrictions"]
  };

  for (const [role, permittedModules] of Object.entries(roleModules)) {
    const result = toOfficerParcelDetail(sourceParcel, unifiedRecord, role);
    assert.deepEqual(result.unifiedRecord.access.permittedModules, permittedModules);
    for (const [name, module] of Object.entries(result.unifiedRecord.modules)) {
      assert.equal(
        module.status === "restricted" && module.data === null,
        !permittedModules.includes(name),
        `${role} should ${permittedModules.includes(name) ? "receive" : "not receive"} ${name}`
      );
      if (!permittedModules.includes(name)) {
        assert.equal(module.data, null);
        assert.equal(module.source, null);
      }
    }
    assert.equal("currentOwners" in result, false);
    assert.equal("qr" in result, false);
    assert.equal("documents" in result, false);
    assert.equal(result.unifiedRecord.access.policy, "application-demo-rbac");
  }
});

test("role projections restrict personal, operational, and unrelated module details", () => {
  const revenue = toOfficerParcelDetail(sourceParcel, unifiedRecord, "revenue_officer");
  assert.equal(revenue.unifiedRecord.modules.ror.data.record.rorNumber, "PATTA-1");
  assert.equal(revenue.unifiedRecord.modules.ror.data.record.holderName, "Private Owner");
  assert.equal("deedNumber" in revenue.unifiedRecord.modules.ror.data.record, false);
  assert.equal(revenue.unifiedRecord.modules.ror.data.ownershipHistory.length, 1);
  assert.equal("sourceAuthority" in revenue.unifiedRecord.modules.ror.data.ownershipHistory[0], false);
  assert.equal("divisionData" in revenue, false);

  const surveyor = toOfficerParcelDetail(sourceParcel, unifiedRecord, "surveyor");
  assert.equal(surveyor.unifiedRecord.modules.cadastral.data.geoJson.geometry.type, "Polygon");
  assert.equal(surveyor.subdivisionData.activeSketch.sketchId, "SKETCH-1");
  assert.equal(surveyor.unifiedRecord.modules.cadastral.data.fieldSurveySubmissions.length, 1);

  const sro = toOfficerParcelDetail(sourceParcel, unifiedRecord, "sro");
  assert.equal(sro.unifiedRecord.modules.registration.data.record.status, "Registered");
  assert.equal("considerationValue" in sro.unifiedRecord.modules.registration.data.record, false);
  assert.equal(sro.unifiedRecord.modules.encumbrance.data.record.lenderName, "Private Bank");
  assert.equal(sro.unifiedRecord.modules.transactions.data.applications.length, 2);
  assert.equal(sro.unifiedRecord.modules.transactions.data.registrationRecord.deedNumber, "SENSITIVE-SRO-RECORD");

  const court = toOfficerParcelDetail(sourceParcel, unifiedRecord, "court");
  assert.equal(court.unifiedRecord.modules.restrictions.data.cases[0].parties[0].name, "Party");
  assert.equal(court.unifiedRecord.modules.restrictions.data.cases[0].auditTrail[0].note, "Private note");
  assert.equal(court.unifiedRecord.modules.restrictions.data.activeTransferRestriction.caseIdentifier, "INTERNAL-CASE");

  const bank = toOfficerParcelDetail(sourceParcel, unifiedRecord, "bank");
  assert.deepEqual(bank.unifiedRecord.modules.ror.data.holders, [{ name: "Private Owner" }]);
  assert.equal("identifierMasked" in bank.unifiedRecord.modules.ror.data.holders[0], false);
  assert.equal(bank.unifiedRecord.modules.encumbrance.data.record.mortgageAmount, "Sensitive");
  assert.equal(bank.unifiedRecord.modules.restrictions.data.cases.length, 0);
  assert.equal(surveyor.subdivisionData.activeSketch.confidentialNote, undefined);
  assert.equal(surveyor.subdivisionData.subdivisions[0].internalOfficerNote, undefined);
  assert.equal("properties" in surveyor.subdivisionData.subdivisions[0].geoJson, false);
  assert.equal(JSON.stringify(revenue).includes("Private lender"), false);
});

test("rejects unmapped roles instead of falling back to broad parcel data", () => {
  assert.throws(() => toOfficerParcelDetail(sourceParcel, unifiedRecord, "unmapped"), /No officer parcel access policy/);
});

test("backend role middleware distinguishes unauthenticated and disallowed parcel operations", () => {
  const authorizeCourtOperation = requireRole(["court", "admin"]);
  const invoke = (user) => {
    let status;
    let body;
    let nextCalled = false;
    authorizeCourtOperation(
      { user },
      {
        status(code) {
          status = code;
          return this;
        },
        json(value) {
          body = value;
          return this;
        }
      },
      () => {
        nextCalled = true;
      }
    );
    return { status, body, nextCalled };
  };

  assert.equal(invoke(null).status, 401);
  assert.equal(invoke({ role: "citizen", jti: "session-citizen" }).status, 403);
  assert.equal(invoke({ role: "surveyor", jti: "session-surveyor" }).nextCalled, false);
  assert.equal(invoke({ role: "court", jti: "session-court" }).nextCalled, true);
});
