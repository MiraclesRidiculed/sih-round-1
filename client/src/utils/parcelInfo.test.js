import assert from "node:assert/strict";
import test from "node:test";
import {
  formatParcelTimestamp,
  getParcelBoundaryCoordinates,
  getParcelInfo,
  getParcelLayers,
  getParcelPlanningInfo
} from "./parcelInfo.js";

const parcel = {
  parcelId: "TN-KPM-0001",
  ulpin: "33030400100482",
  state: "Tamil Nadu",
  district: "Kanchipuram",
  taluk: "Sriperumbudur",
  village: "Mambakkam",
  surveyNumber: "248/3",
  areaInAcres: 1.25,
  landClassification: "Dry Agricultural",
  stateProfile: { systemName: "Tamil Nilam / TNREGINET" },
  authoritativeRecords: { rtcNumber: "PATTA-KPM-5510" },
  verificationHint: { status: "verified" },
  updatedAt: "2026-08-20T08:00:00.000Z",
  geoJson: {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [[[79.9182, 12.9341], [79.9224, 12.9341], [79.9224, 12.9312], [79.9182, 12.9312], [79.9182, 12.9341]]] }
  }
};

const toUnifiedRecord = (source) => {
  const modules = {
    cadastral: {
      data: {
        parcelId: source.parcelId,
        ulpin: source.ulpin,
        surveyNumber: source.surveyNumber,
        hissaNumber: source.hissaNumber,
        district: source.district,
        taluk: source.taluk,
        village: source.village,
        areaInAcres: source.areaInAcres,
        landClassification: source.landClassification,
        geoJson: source.geoJson,
        cadastralMetadata: source.baseLayer || {}
      }
    },
    ror: {
      data: {
        record: source.essentialLayers?.ror || {},
        holders: source.currentOwners || [],
        rights: source.essentialLayers?.rrrSummary?.rights || [],
        mutation: source.authoritativeRecords || {},
        sourceRecord: source.authoritativeRecords || {},
        ownershipHistory: [],
        sourceRecords: []
      }
    },
    registration: { data: { record: source.essentialLayers?.registration || {}, sourceRecords: [] } },
    planning: { data: { masterPlan: source.essentialLayers?.masterPlanZoning || {}, sourceRecords: [] } },
    buildingPermission: { data: { record: source.essentialLayers?.buildingPermissions || {} } },
    encumbrance: { data: { record: source.essentialLayers?.encumbrance || {} } },
    landUse: { data: { landClassification: source.landClassification, landUse: source.landUse } },
    restrictions: {
      status: source.essentialLayers?.rrrSummary?.restrictions?.length ? "restricted" : undefined,
      data: {
        spatial: source.additionalLayers?.restrictionZones || {},
        recorded: source.essentialLayers?.rrrSummary?.restrictions || [],
        disputeRecord: source.disputeRecord || {},
        activeTransferRestriction: null,
        cases: []
      }
    },
    propertyTax: { data: source.additionalLayers?.propertyTax || {} },
    utilities: {
      data: {
        utilities: source.additionalLayers?.utilities || {},
        infrastructure: source.additionalLayers?.infrastructure || {},
        valuation: source.additionalLayers?.valuation || {}
      }
    },
    transactions: {
      status: "available",
      data: { applications: [] },
      source: { systemName: "Land Stack local transaction tracker", mode: "local-demo", authoritative: false }
    }
  };
  for (const module of Object.values(modules)) {
    module.status ||= hasData(module.data) ? "available" : "unavailable";
    module.source ||= { systemName: source.stateProfile?.systemName };
  }
  return {
    parcel: {
      parcelId: source.parcelId,
      ulpin: source.ulpin,
      state: source.state,
      sourceSystem: source.stateProfile?.systemName,
      recordStatus: source.verificationHint?.status,
      lastUpdatedAt: source.updatedAt
    },
    modules,
    synchronization: { disclaimer: "Local demonstration data only." }
  };
};

const hasData = (value) => {
  if (Array.isArray(value)) return value.some(hasData);
  if (value && typeof value === "object") return Object.values(value).some(hasData);
  return value !== undefined && value !== null && value !== "";
};

test("maps available parcel fields without substituting missing values", () => {
  const record = toUnifiedRecord(parcel);
  const info = getParcelInfo(record);
  assert.equal(info.ulpin, parcel.ulpin);
  assert.equal(info.sourceSystem, "Tamil Nilam / TNREGINET");
  assert.equal(info.sourceRecord, "PATTA-KPM-5510");
  assert.equal(info.recordStatus, "verified");
  assert.equal(info.area, "1.25 acres");
  assert.equal(getParcelInfo({ parcel: { parcelId: "INCOMPLETE" } }).ulpin, "Not available");
  assert.equal(getParcelInfo({ parcel: { parcelId: "INCOMPLETE" } }).lastUpdated, null);
  assert.equal(getParcelInfo({ parcel: { parcelId: "INCOMPLETE" } }).sourceRecord, "Not available");
});

test("extracts actual polygon boundary vertices without duplicate closing coordinate", () => {
  const coordinates = getParcelBoundaryCoordinates(parcel.geoJson);
  assert.equal(coordinates.length, 4);
  assert.deepEqual(coordinates[0], [79.9182, 12.9341]);
  assert.equal(getParcelBoundaryCoordinates({ geometry: { type: "Point", coordinates: [1, 2] } }).length, 0);
});

test("formats available timestamps and reports missing or invalid timestamps", () => {
  assert.notEqual(formatParcelTimestamp(parcel.updatedAt), "Not available");
  assert.equal(formatParcelTimestamp(null), "Not available");
  assert.equal(formatParcelTimestamp("invalid"), "Not available");
});

test("maps available tier modules from multiple state parcel records", () => {
  const tamilNaduLayers = getParcelLayers(toUnifiedRecord({
    ...parcel,
    essentialLayers: {
      ror: { rorNumber: "PATTA-KPM-5510", issueDate: "2024-03-15" },
      registration: { deedNumber: "DOC-2024-SPB-3109", registrationDate: "2024-04-10" },
      masterPlanZoning: { authority: "CMDA", zoneCategory: "Industrial" },
      buildingPermissions: { status: "Sanctioned", planApprovalNo: "CMDA/BP/2024/0912" },
      encumbrance: { hasMortgage: true, lenderName: "Indian Overseas Bank", mortgageAmount: "₹ 1,50,00,000" },
      rrrSummary: { rights: ["Recorded industrial-use right"], restrictions: ["12m front buffer"] }
    },
    additionalLayers: {
      propertyTax: { propertyTaxId: "PID-TN-SPB-9941", assessmentYear: "2025-26" },
      utilities: { waterSupplyLine: "SIPCOT water feeder" },
      valuation: { guidanceValueTotal: "₹ 1,74,24,000" },
      restrictionZones: { isEcoSensitive: false }
    }
  }));
  assert.ok(tamilNaduLayers.tabs.some((tab) => tab.id === "registration"));
  assert.ok(tamilNaduLayers.tabs.some((tab) => tab.id === "transactions"));
  assert.equal(tamilNaduLayers.availability.find((item) => item.id === "buildingPermission").status, "available");
  assert.ok(tamilNaduLayers.tabs.some((tab) => tab.id === "taxesUtilities"));
  assert.equal(tamilNaduLayers.sectionsByTab.encumbrances[0].rows[0].value, "Yes");
  assert.equal(tamilNaduLayers.sectionsByTab.taxesUtilities.length, 3);

  const chandigarhLayers = getParcelLayers(toUnifiedRecord({
    ulpin: "04010100200814",
    parcelId: "CHD-UT-0001",
    areaInAcres: 0.18,
    landClassification: "Urban Commercial Freehold",
    landUse: "Commercial Retail Arcade",
    geoJson: parcel.geoJson,
    currentOwners: [{ name: "Gurpreet Singh Dhillon", sharePercent: 60 }],
    essentialLayers: {
      ror: { rorNumber: "UPR-CHD-SEC17-084" },
      registration: { deedNumber: "REG-CHD-2023-1992" },
      encumbrance: { hasMortgage: false, status: "No active lien recorded" }
    },
    additionalLayers: { propertyTax: { propertyTaxId: "MCC-PID-SEC17-884" } }
  }));
  assert.ok(chandigarhLayers.tabs.some((tab) => tab.id === "rights"));
  assert.ok(chandigarhLayers.tabs.some((tab) => tab.id === "encumbrances"));
  assert.ok(chandigarhLayers.tabs.some((tab) => tab.id === "planning"));
  assert.ok(chandigarhLayers.sectionsByTab.planning.some((section) => section.title === "Land use"));
  assert.equal(chandigarhLayers.parcelInfo.ulpin, "04010100200814");
});

test("omits unsupported category tabs and marks absent layer modules as unconfigured", () => {
  const sparseLayers = getParcelLayers(toUnifiedRecord({
    parcelId: "PARCEL-ONLY",
    ulpin: "12345678901234",
    surveyNumber: "1/1",
    geoJson: parcel.geoJson
  }));
  assert.deepEqual(sparseLayers.tabs.map((tab) => tab.id), ["overview", "cadastral", "planning", "transactions"]);
  assert.equal(sparseLayers.availability.find((item) => item.id === "registration").configured, false);
  assert.ok(sparseLayers.additionalAvailability.every((module) => !module.configured));
});

test("renders backend status distinctions and local source provenance", () => {
  const record = toUnifiedRecord(parcel);
  record.modules.registration.status = "pending";
  record.modules.restrictions.status = "restricted";
  record.modules.ror.source.lastSynchronizedAt = "2026-08-20T08:00:00.000Z";
  record.modules.restrictions.data.activeTransferRestriction = {
    active: true,
    caseIdentifier: "CASE-52",
    reason: "A stay order is active."
  };
  const layers = getParcelLayers(record);

  assert.equal(layers.availability.find((item) => item.id === "registration").status, "pending");
  assert.equal(layers.availability.find((item) => item.id === "restrictions").status, "restricted");
  assert.equal(layers.availability.find((item) => item.id === "rights").source, "Tamil Nilam / TNREGINET");
  assert.equal(layers.availability.find((item) => item.id === "rights").lastSynchronizedAt, "2026-08-20T08:00:00.000Z");
  assert.ok(layers.sectionsByTab.restrictions[0].rows.some((row) => row.value === "A stay order is active."));
  assert.equal(layers.synchronization.disclaimer, "Local demonstration data only.");
});

test("shows permitted registration and encumbrance summaries and their missing states", () => {
  const record = toUnifiedRecord({
    ...parcel,
    essentialLayers: {
      registration: { status: "Registered", registrationDate: "2024-04-10", deedNumber: "PRIVATE-DEED-REF" },
      encumbrance: { hasMortgage: true, status: "Mortgage recorded", lenderName: "Private lender", mortgageAmount: "Sensitive" }
    }
  });

  record.modules.registration.status = "available";
  record.modules.encumbrance.status = "available";
  const layers = getParcelLayers(record);

  assert.ok(layers.sectionsByTab.registration.flatMap((item) => item.rows).some((row) =>
    row.label === "Registration status" && row.value === "Registered"
  ));
  assert.ok(layers.sectionsByTab.encumbrances.flatMap((item) => item.rows).some((row) =>
    row.label === "Mortgage recorded" && row.value === "Yes"
  ));
  record.modules.buildingPermission = { status: "unavailable", data: null };
  assert.equal(getParcelLayers(record).availability.find((item) => item.id === "buildingPermission").status, "unavailable");
});

test("maps local transaction applications, statuses, and history into the transaction tab", () => {
  const record = toUnifiedRecord(parcel);
  record.modules.transactions.data.applications = [{
    id: "transaction-1",
    applicationReference: "LS-APP-2026-12345678",
    transactionType: "Sale deed application",
    status: "Restricted",
    underlyingStatus: "Application Submitted",
    restrictionNotice: "An active RCCMS stay restriction is recorded.",
    initiatedAt: "2026-09-27T00:00:00.000Z",
    updatedAt: "2026-09-27T00:00:00.000Z",
    history: [{ status: "Application Submitted", changedAt: "2026-09-27T00:00:00.000Z" }]
  }];

  const layers = getParcelLayers(record);
  assert.ok(layers.tabs.some((tab) => tab.id === "transactions"));
  assert.ok(layers.sectionsByTab.transactions[0].rows.some((row) => row.value === "Restricted"));
  assert.ok(layers.sectionsByTab.transactions[0].rows.some((row) =>
    row.value === "An active RCCMS stay restriction is recorded."
  ));
});

test("assembles planning, land-use, permission, and restriction information from existing modules", () => {
  const record = toUnifiedRecord({
    ...parcel,
    landUse: "Industrial use recorded",
    essentialLayers: {
      masterPlanZoning: {
        authority: "Local Planning Authority",
        planReference: "MP-2031",
        planningDesignation: "Mixed use",
        zoneCategory: "Commercial",
        permissibleFar: 2.5,
        heritageRestrictions: "Facade controls apply"
      },
      buildingPermissions: {
        status: "Sanctioned",
        planApprovalNo: "BP-104",
        sanctionedDate: "2025-04-02",
        validTill: "2028-04-01"
      },
      rrrSummary: { restrictions: ["No construction within recorded buffer"] }
    }
  });
  record.modules.restrictions.data.recorded = ["No construction within recorded buffer"];

  const layers = getParcelLayers(record);
  const planningRows = layers.sectionsByTab.planning.flatMap((item) => item.rows);
  assert.equal(layers.planningInfo.available, true);
  assert.equal(layers.planningInfo.zoningGeoJson.geometry.type, "Polygon");
  assert.ok(planningRows.some((row) => row.value === "MP-2031"));
  assert.ok(planningRows.some((row) => row.value === "Industrial use recorded"));
  assert.ok(planningRows.some((row) => row.value === "BP-104"));
  assert.ok(planningRows.some((row) => row.value === "Facade controls apply"));
  assert.ok(planningRows.some((row) => row.value === "No construction within recorded buffer"));
});

test("reports unavailable planning information without exposing restricted map overlays", () => {
  const record = toUnifiedRecord({ parcelId: parcel.parcelId, ulpin: parcel.ulpin });
  const sparseLayers = getParcelLayers(record);
  assert.equal(sparseLayers.planningInfo.available, false);
  assert.ok(sparseLayers.tabs.some((tab) => tab.id === "planning"));

  record.modules.planning.status = "restricted";
  record.modules.buildingPermission.status = "restricted";
  record.modules.landUse.status = "restricted";
  record.modules.planning.data = null;
  record.modules.buildingPermission.data = null;
  record.modules.landUse.data = null;
  const inaccessible = getParcelPlanningInfo(record, {
    ...parcel,
    essentialLayers: { masterPlanZoning: { zoneCategory: "Restricted zone" } }
  });
  assert.equal(inaccessible.permitted, false);
  assert.equal(inaccessible.zoningGeoJson, null);
});
