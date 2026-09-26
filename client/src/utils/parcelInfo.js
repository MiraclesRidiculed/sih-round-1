import { formatArea } from "./format.js";

const displayValue = (value) => (
  value !== undefined && value !== null && String(value).trim() !== ""
    ? String(value)
    : "Not available"
);

const hasMeaningfulModuleData = (value) => {
  if (value === undefined || value === null || value === "") return false;
  if (Array.isArray(value)) return value.some(hasMeaningfulModuleData);
  if (typeof value === "object") return Object.values(value).some(hasMeaningfulModuleData);
  return true;
};

export const getParcelPlanningInfo = (unifiedRecord = {}, parcel = {}) => {
  const modules = unifiedRecord.modules || {};
  const planningModule = modules.planning || {};
  const buildingPermissionModule = modules.buildingPermission || {};
  const landUseModule = modules.landUse || {};
  const masterPlan = planningModule.status !== "restricted"
    ? planningModule.data?.masterPlan || parcel.essentialLayers?.masterPlanZoning || {}
    : {};
  const buildingPermission = buildingPermissionModule.status !== "restricted"
    ? buildingPermissionModule.data?.record || parcel.essentialLayers?.buildingPermissions || {}
    : {};
  const landUse = landUseModule.status !== "restricted" ? landUseModule.data || {} : {};
  const permitted = [planningModule, buildingPermissionModule, landUseModule]
    .some((module) => module.status !== "restricted");
  const meaningfulLandUse = {
    landClassification: landUse.landClassification ?? parcel.landClassification,
    landUse: landUse.landUse ?? parcel.landUse
  };
  const hasMasterPlan = hasMeaningfulModuleData(masterPlan);
  const hasBuildingPermission = hasMeaningfulModuleData(buildingPermission);
  const hasLandUse = hasMeaningfulModuleData(meaningfulLandUse);
  const geometry = modules.cadastral?.data?.geoJson || parcel.geoJson || null;
  const hasZoningDesignation = [
    masterPlan.zoneCategory,
    masterPlan.planningDesignation,
    masterPlan.landUseDesignation
  ].some((value) => typeof value === "string" && value.trim());

  return {
    permitted,
    available: hasMasterPlan || hasBuildingPermission || hasLandUse,
    masterPlan,
    buildingPermission,
    landUse: meaningfulLandUse,
    restrictions: modules.restrictions?.data || {},
    geoJson: geometry,
    zoningGeoJson: permitted && hasZoningDesignation && geometry?.geometry ? geometry : null,
    zoningColor: /^#[0-9a-f]{6}$/i.test(geometry?.properties?.zoningColor || "")
      ? geometry.properties.zoningColor
      : "#2563eb"
  };
};

const makeRows = (source, fields) => fields
  .filter(([key]) => source?.[key] !== undefined && source?.[key] !== null && source?.[key] !== "")
  .map(([key, label, format = displayValue]) => ({ label, value: format(source[key]) }));

const section = (title, rows) => rows.length ? { title, rows } : null;

const makeModuleSections = (sources, definitions) => definitions
  .map(([key, title, fields]) => section(title, makeRows(sources?.[key], fields)))
  .filter(Boolean);

const recordFields = [
  ["rorNumber", "Record number"],
  ["holderName", "Recorded holder"],
  ["issueDate", "Issue date"],
  ["subDivisionStatus", "Sub-division status"],
  ["mutationStatus", "Mutation status"]
];

const registrationFields = [
  ["status", "Registration status"],
  ["registrationStatus", "Registration status"],
  ["sroOffice", "Registration office"],
  ["deedNumber", "Deed reference"],
  ["registrationDate", "Registration date"],
  ["documentType", "Document type"],
  ["considerationValue", "Consideration value"],
  ["stampDutyPaid", "Stamp duty recorded"]
];

const masterPlanFields = [
  ["authority", "Planning authority"],
  ["planName", "Master Plan"],
  ["planReference", "Plan reference"],
  ["planYear", "Plan year"],
  ["effectiveDate", "Effective date"],
  ["planningDesignation", "Planning designation"],
  ["landUseDesignation", "Land-use designation"],
  ["zoneCategory", "Zone category"],
  ["status", "Plan status"],
  ["permissibleFar", "Permissible FAR"],
  ["maxCoveragePercent", "Maximum coverage (%)"],
  ["setbackFront", "Front setback"],
  ["setbackRear", "Rear setback"]
];

const buildingPermissionFields = [
  ["status", "Permission status"],
  ["planApprovalNo", "Approval reference"],
  ["sanctionedHeightMeters", "Sanctioned height (m)"],
  ["sanctionedDate", "Sanctioned date"],
  ["validTill", "Valid until"],
  ["setbackViolations", "Setback violations", (value) => value ? "Recorded" : "None recorded"]
];

const encumbranceFields = [
  ["hasMortgage", "Mortgage recorded", (value) => value ? "Yes" : "No"],
  ["lenderName", "Lender"],
  ["mortgageAmount", "Amount"],
  ["chargeType", "Charge type"],
  ["chargeDate", "Charge date"],
  ["status", "Record status"]
];

const taxFields = [
  ["propertyTaxId", "Property tax identifier"],
  ["assessmentYear", "Assessment year"],
  ["annualDemand", "Annual demand", (value) => String(value)],
  ["amountPaid", "Amount paid", (value) => String(value)],
  ["duesAmount", "Outstanding amount", (value) => String(value)],
  ["paymentStatus", "Payment status"],
  ["receiptNo", "Receipt reference"]
];

const utilityFields = [
  ["waterSupplyLine", "Water supply"],
  ["waterConnectionId", "Water connection reference"],
  ["powerSubstationDistance", "Power infrastructure"],
  ["drainageNetwork", "Drainage"],
  ["telecomFiber", "Telecommunications"]
];

const valuationFields = [
  ["circleRatePerSqFt", "Circle rate per sq. ft.", (value) => String(value)],
  ["guidanceValueTotal", "Guidance value"],
  ["marketEstimateRange", "Market estimate range"],
  ["lastRevisionDate", "Last revision date"]
];

const restrictionZoneFields = [
  ["isEcoSensitive", "Eco-sensitive area", (value) => value ? "Yes" : "No"],
  ["isWithin30mBuffer", "Within 30 m buffer", (value) => value ? "Yes" : "No"],
  ["lakeBufferDistanceMeters", "Distance from lake buffer (m)", (value) => String(value)],
  ["heritageZone", "Heritage zone"],
  ["crzZone", "Coastal regulation zone"],
  ["highTensionLineOverlap", "High-tension line overlap", (value) => value ? "Yes" : "No"],
  ["heritageBuffer", "Heritage buffer overlap", (value) => value ? "Yes" : "No"]
];

const textListSection = (title, values) => {
  const items = Array.isArray(values) ? values.filter((value) => typeof value === "string" && value.trim()) : [];
  return items.length ? { title, rows: items.map((value, index) => ({ label: `Item ${index + 1}`, value })) } : null;
};

export const getParcelInfo = (unifiedRecord = {}) => {
  const parcel = unifiedRecord.parcel || {};
  const cadastral = unifiedRecord.modules?.cadastral?.data || {};
  const ror = unifiedRecord.modules?.ror?.data || {};
  return {
    parcelId: displayValue(parcel.parcelId),
    ulpin: displayValue(parcel.ulpin),
    state: displayValue(parcel.state),
    district: displayValue(cadastral.district),
    taluk: displayValue(cadastral.taluk),
    village: displayValue(cadastral.village),
    surveyNumber: displayValue(cadastral.surveyNumber),
    area: Number.isFinite(cadastral.areaInAcres) ? formatArea(cadastral.areaInAcres) : "Not available",
    sourceSystem: displayValue(parcel.sourceSystem),
    landType: displayValue(cadastral.landClassification),
    recordStatus: displayValue(parcel.recordStatus),
    lastUpdated: parcel.lastUpdatedAt || null,
    sourceRecord: displayValue(
      ror.sourceRecord?.rtcNumber ||
      ror.sourceRecord?.recordId ||
      ror.sourceRecord?.sourceRecordId
    )
  };
};

export const getParcelBoundaryCoordinates = (geoJson) => {
  const ring = geoJson?.geometry?.type === "Polygon"
    ? geoJson.geometry.coordinates?.[0]
    : null;
  if (!Array.isArray(ring)) return [];

  const coordinates = ring.filter((position) =>
    Array.isArray(position) &&
    Number.isFinite(position[0]) &&
    Number.isFinite(position[1])
  );
  if (coordinates.length > 1) {
    const [firstLongitude, firstLatitude] = coordinates[0];
    const [lastLongitude, lastLatitude] = coordinates[coordinates.length - 1];
    if (firstLongitude === lastLongitude && firstLatitude === lastLatitude) {
      coordinates.pop();
    }
  }
  return coordinates;
};

export const formatParcelTimestamp = (value) => {
  if (!value) return "Not available";
  const timestamp = new Date(value);
  return Number.isNaN(timestamp.getTime()) ? "Not available" : timestamp.toLocaleString();
};

const sourceDocumentsSection = (documents = []) => section("Linked source documents", documents.map((document) => ({
  label: document.title || document.documentType || "Source document",
  value: [
    document.reference,
    document.verificationStatus,
    document.createdAt ? formatParcelTimestamp(document.createdAt) : null
  ].filter(Boolean).join(" · ") || "Recorded"
})));

const ownershipHistorySection = (events = []) => section("Ownership and mutation history", events.map((event) => ({
  label: event.eventType || "Recorded event",
  value: [
    event.summary,
    event.eventDate ? formatParcelTimestamp(event.eventDate) : null,
    event.mutationNumber,
    event.registrationNumber
  ].filter(Boolean).join(" · ") || "Recorded"
})));

export const getParcelLayers = (unifiedRecord = {}) => {
  const modules = unifiedRecord.modules || {};
  const cadastral = modules.cadastral?.data || {};
  const ror = modules.ror?.data || {};
  const registration = modules.registration?.data || {};
  const planning = modules.planning?.data || {};
  const planningInfo = getParcelPlanningInfo(unifiedRecord);
  const buildingPermission = modules.buildingPermission?.data || {};
  const encumbrance = modules.encumbrance?.data || {};
  const landUse = modules.landUse?.data || {};
  const restrictions = modules.restrictions?.data || {};
  const transactions = modules.transactions?.data || {};
  const propertyTax = modules.propertyTax?.data || {};
  const utilities = modules.utilities?.data || {};
  const parcel = {
    ...cadastral,
    landUse: landUse.landUse,
    parcelId: unifiedRecord.parcel?.parcelId,
    ulpin: unifiedRecord.parcel?.ulpin,
    state: unifiedRecord.parcel?.state,
    verificationHint: { status: unifiedRecord.parcel?.recordStatus },
    updatedAt: unifiedRecord.parcel?.lastUpdatedAt,
    stateProfile: { systemName: unifiedRecord.parcel?.sourceSystem },
    baseLayer: cadastral.cadastralMetadata || {},
    geoJson: cadastral.geoJson,
    currentOwners: ror.holders || [],
    ownershipHistory: ror.ownershipHistory || [],
    essentialLayers: {
      ror: ror.record || {},
      registration: registration.record || {},
      masterPlanZoning: planning.masterPlan || {},
      buildingPermissions: buildingPermission.record || {},
      encumbrance: encumbrance.record || {},
      rrrSummary: {
        rights: ror.rights || [],
        restrictions: restrictions.recorded || []
      }
    },
    additionalLayers: {
      propertyTax,
      utilities: utilities.utilities || {},
      infrastructure: utilities.infrastructure || {},
      valuation: utilities.valuation || {},
      restrictionZones: restrictions.spatial || {}
    },
    authoritativeRecords: {
      ...ror.sourceRecord,
      ...ror.mutation,
      ...registration.sourceRecord,
      ...encumbrance.sourceRecord
    },
    disputeRecord: restrictions.disputeRecord || {}
  };
  const moduleStatus = (id) => modules[id]?.status || "unavailable";
  const categoryStatus = (id) => {
    const groupedModules = {
      planning: ["planning", "buildingPermission"],
      taxesUtilities: ["propertyTax", "utilities"]
    }[id];
    if (!groupedModules) return moduleStatus(id);
    const statuses = groupedModules.map(moduleStatus);
    return statuses.includes("restricted")
      ? "restricted"
      : statuses.includes("pending")
        ? "pending"
        : statuses.includes("available")
          ? "available"
          : "unavailable";
  };
  const sourceRecordRows = (data, fields) => makeRows(data, fields);
  const baseRows = makeRows(parcel, [
    ["parcelId", "Parcel identifier"],
    ["ulpin", "ULPIN"],
    ["surveyNumber", "Survey number"],
    ["hissaNumber", "Hissa / sub-division"],
    ["areaInAcres", "Parcel area", (value) => formatArea(value)],
    ["landClassification", "Land classification"],
    ["district", "District"],
    ["taluk", "Taluk / Tehsil"],
    ["village", "Village / Ward"]
  ]);
  const baseLayerRows = makeRows(parcel.baseLayer, [
    ["cadastralSheetNo", "Cadastral sheet"],
    ["crs", "Coordinate reference system"],
    ["coordinatePrecision", "Coordinate precision"],
    ["villageGridRef", "Village grid reference"]
  ]);
  const boundaryCoordinates = getParcelBoundaryCoordinates(parcel.geoJson);
  if (boundaryCoordinates.length) {
    baseLayerRows.push({
      label: "Parcel boundary",
      value: `GeoJSON ${parcel.geoJson.geometry.type} · ${boundaryCoordinates.length} boundary coordinates`
    });
  }
  const cadastralSections = [section("Base / cadastral record", [...baseRows, ...baseLayerRows])].filter(Boolean);
  const cadastralDocuments = sourceDocumentsSection(cadastral.sourceRecords);
  if (cadastralDocuments) cadastralSections.push(cadastralDocuments);
  const surveys = section("Field survey submissions", (cadastral.fieldSurveySubmissions || []).map((submission) => ({
    label: submission.offlineId || "Field survey",
    value: [submission.surveyorName, submission.surveyDate ? formatParcelTimestamp(submission.surveyDate) : null]
      .filter(Boolean)
      .join(" · ") || "Recorded"
  })));
  if (surveys) cadastralSections.push(surveys);
  const subdivisions = section("Subdivision records", (cadastral.subdivisionData?.subdivisions || []).map((subdivision) => ({
    label: subdivision.childIdentifier || subdivision.parcelId || `Child parcel ${subdivision.part || ""}`.trim(),
    value: [
      subdivision.areaInAcres !== undefined ? `${subdivision.areaInAcres} acres` : null,
      subdivision.status
    ].filter(Boolean).join(" · ") || "Recorded"
  })));
  if (cadastral.subdivisionData?.isSubdivided) {
    const subdivisionStatus = section("Subdivision status", [{
      label: "Status",
      value: cadastral.subdivisionData.activeSketch?.status || "Subdivision recorded"
    }]);
    if (subdivisionStatus) cadastralSections.push(subdivisionStatus);
    if (subdivisions) cadastralSections.push(subdivisions);
  }

  const rorSections = makeModuleSections(parcel.essentialLayers, [
    ["ror", "Record of Rights", recordFields]
  ]);
  const mutationRows = makeRows(parcel.authoritativeRecords, [
    ["mutationNumber", "Mutation reference"],
    ["mutationStatus", "Mutation status"],
    ["khataStatus", "Khata / record status"]
  ]);
  if (mutationRows.length) rorSections.push({ title: "Mutation and source records", rows: mutationRows });
  const ownershipHistory = ownershipHistorySection(parcel.ownershipHistory);
  if (ownershipHistory) rorSections.push(ownershipHistory);
  const rorDocuments = sourceDocumentsSection(ror.sourceRecords);
  if (rorDocuments) rorSections.push(rorDocuments);
  if (Array.isArray(parcel.currentOwners) && parcel.currentOwners.length) {
    rorSections.push({
      title: "Rights holders",
      rows: parcel.currentOwners.map((owner, index) => ({
        label: owner.name || `Holder ${index + 1}`,
        value: [
          owner.relation,
          Number.isFinite(owner.sharePercent) ? `${owner.sharePercent}% share` : null
        ].filter(Boolean).join(" · ") || "Recorded"
      }))
    });
  }
  rorSections.push(textListSection("Recorded rights", parcel.essentialLayers?.rrrSummary?.rights));

  const registrationSections = makeModuleSections(parcel.essentialLayers, [
    ["registration", "Registration record", registrationFields]
  ]);
  const authoritativeRegistration = makeRows(parcel.authoritativeRecords, [
    ["registrationReference", "Source registration reference"],
    ["registrationDate", "Source registration date"]
  ]);
  if (authoritativeRegistration.length) registrationSections.push({ title: "Source record", rows: authoritativeRegistration });
  const registrationDocuments = sourceDocumentsSection(registration.sourceRecords);
  if (registrationDocuments) registrationSections.push(registrationDocuments);

  const planningSections = makeModuleSections(parcel.essentialLayers, [
    ["masterPlanZoning", "Master Plan / zoning", masterPlanFields],
    ["buildingPermissions", "Building permissions", buildingPermissionFields]
  ]);
  const planningLandUseRows = makeRows(planningInfo.landUse, [
    ["landClassification", "Recorded land classification"],
    ["landUse", "Recorded land use"]
  ]);
  if (planningLandUseRows.length) {
    planningSections.push({ title: "Land use", rows: planningLandUseRows });
  }
  const masterPlanRestrictions = makeRows(planningInfo.masterPlan, [
    ["heritageRestrictions", "Planning restriction"],
    ["planningRestrictions", "Planning restriction"],
    ["applicableRegulations", "Applicable regulation"]
  ]);
  const recordedRestrictions = Array.isArray(planningInfo.restrictions.recorded)
    ? planningInfo.restrictions.recorded
        .filter((restriction) => typeof restriction === "string" && restriction.trim())
        .map((restriction, index) => ({ label: `Recorded restriction ${index + 1}`, value: restriction }))
    : [];
  if (planningInfo.restrictions.activeTransferRestriction?.active) {
    recordedRestrictions.push({
      label: "Active transfer restriction",
      value: planningInfo.restrictions.activeTransferRestriction.notice || "A transfer restriction is recorded for this parcel."
    });
  }
  if (masterPlanRestrictions.length || recordedRestrictions.length) {
    planningSections.push({
      title: "Restrictions",
      rows: [...masterPlanRestrictions, ...recordedRestrictions]
    });
  }
  const planningDocuments = sourceDocumentsSection(planning.sourceRecords);
  if (planningDocuments) planningSections.push(planningDocuments);
  const buildingPermissionDocuments = sourceDocumentsSection(buildingPermission.sourceRecords);
  if (buildingPermissionDocuments) planningSections.push(buildingPermissionDocuments);

  const encumbranceSections = makeModuleSections(parcel.essentialLayers, [
    ["encumbrance", "Mortgage / encumbrance", encumbranceFields]
  ]);
  const authoritativeEncumbrance = makeRows(parcel.authoritativeRecords, [
    ["encumbranceStatus", "Source encumbrance status"],
    ["encumbranceCertificateNo", "Certificate reference"]
  ]);
  if (authoritativeEncumbrance.length) {
    encumbranceSections.push({ title: "Source record", rows: authoritativeEncumbrance });
  }
  const encumbranceDocuments = sourceDocumentsSection(encumbrance.sourceRecords);
  if (encumbranceDocuments) encumbranceSections.push(encumbranceDocuments);

  const landUseRows = makeRows(parcel, [
    ["landClassification", "Land classification"],
    ["landUse", "Recorded land use"]
  ]);
  const landUseSections = section("Land use and zoning", landUseRows);

  const additionalLayers = parcel.additionalLayers || {};
  const additionalSections = makeModuleSections(additionalLayers, [
    ["propertyTax", "Property tax", taxFields],
    ["utilities", "Utilities and infrastructure", utilityFields],
    ["infrastructure", "Infrastructure", [
      ["name", "Name"],
      ["type", "Type"],
      ["status", "Status"],
      ["provider", "Provider"],
      ["distance", "Distance"]
    ]],
    ["valuation", "Valuation", valuationFields]
  ]);
  const restrictionRows = makeRows(parcel.additionalLayers?.restrictionZones, restrictionZoneFields);
  const activeRestriction = restrictions.activeTransferRestriction;
  if (activeRestriction) {
    restrictionRows.push(
      ...sourceRecordRows(activeRestriction, [
        ["caseIdentifier", "Active case"],
        ["reason", "Administrative restriction reason"]
      ])
    );
  }
  const courtCaseRows = (restrictions.cases || []).map((rccmsCase) => ({
    label: rccmsCase.caseIdentifier || "Revenue court case",
    value: [
      rccmsCase.currentStatus,
      rccmsCase.filing?.courtName,
      rccmsCase.filing?.filingReference,
      rccmsCase.responsibleOfficer,
      ...(rccmsCase.parties || []).map((party) => `${party.role || "Party"}: ${party.name}`),
      ...(rccmsCase.orders || []).map((order) => `${order.type}: ${order.reference}`),
      ...(rccmsCase.auditTrail || []).map((entry) => entry.note),
      rccmsCase.updatedAt ? formatParcelTimestamp(rccmsCase.updatedAt) : null
    ].filter(Boolean).join(" · ") || "Recorded"
  }));
  const restrictionSections = [
    section("Environmental and spatial restrictions", restrictionRows),
    textListSection("Recorded restrictions", parcel.essentialLayers?.rrrSummary?.restrictions),
    section("Revenue court record", makeRows(parcel.disputeRecord, [
      ["caseNumber", "Case number"],
      ["courtName", "Court"],
      ["injunctionStatus", "Injunction status"],
      ["transactionLock", "Transaction lock", (value) => value ? "Active" : "Inactive"],
      ["stayOrderDate", "Stay order date"],
      ["nextHearing", "Next hearing"]
    ])),
    section("Revenue court cases and orders", courtCaseRows)
  ].filter(Boolean);
  const transactionSections = [
    ...((transactions.registrationRecord && Object.keys(transactions.registrationRecord).length)
      ? [{
          title: "Existing registration record",
          rows: makeRows(transactions.registrationRecord, registrationFields)
            .concat(makeRows(transactions.sourceRecord, [
              ["registrationReference", "Source registration reference"],
              ["registrationDate", "Source registration date"]
            ]))
        }]
      : []),
    ...(transactions.applications || []).map((application) => ({
        title: application.applicationReference || "Transaction application",
        rows: [
          { label: "Transaction type", value: displayValue(application.transactionType) },
          { label: "Current status", value: displayValue(application.status) },
          ...(application.underlyingStatus
            ? [{ label: "Underlying status", value: application.underlyingStatus }]
            : []),
          { label: "Submitted", value: formatParcelTimestamp(application.initiatedAt) },
          { label: "Last updated", value: formatParcelTimestamp(application.updatedAt) },
          ...(application.restrictionNotice
            ? [{ label: "Restriction", value: application.restrictionNotice }]
            : []),
          ...((application.history || []).map((entry, index) => ({
            label: `History ${index + 1} · ${entry.status}`,
            value: [
              formatParcelTimestamp(entry.changedAt),
              entry.changedByRole,
              entry.note
            ].filter(Boolean).join(" · ") || "Recorded"
          })))
        ]
    }))
  ];

  const sectionsByTab = {
    cadastral: cadastralSections,
    rights: rorSections.filter(Boolean),
    registration: registrationSections,
    planning: planningSections,
    encumbrances: encumbranceSections,
    landUse: [landUseSections].filter(Boolean),
    taxesUtilities: additionalSections,
    restrictions: restrictionSections,
    transactions: transactionSections
  };

  const planningPermitted = planningInfo.permitted;
  const tabs = [
    { id: "overview", label: "Overview", layer: "Common identifier" },
    { id: "cadastral", label: "Cadastral", layer: "Layer 1 — Base / Cadastral" },
    { id: "rights", label: "Rights & Ownership", layer: "Layer 2 — Core Governance" },
    { id: "registration", label: "Registration", layer: "Layer 2 — Core Governance" },
    { id: "planning", label: "Planning & Permissions", layer: "Layer 2 — Core Governance" },
    { id: "encumbrances", label: "Encumbrances", layer: "Layer 2 — Core Governance" },
    { id: "landUse", label: "Land Use", layer: "Layer 2 — Core Governance" },
    { id: "taxesUtilities", label: "Taxes & Utilities", layer: "Layer 3 — Additional / Use-case" },
    { id: "restrictions", label: "Restrictions", layer: "Layer 2 — Core Governance" },
    { id: "transactions", label: "Transactions", layer: "Local application tracking" }
  ].filter((tab) => (
    tab.id === "overview" ||
    tab.id === "cadastral" ||
    (tab.id === "planning"
      ? planningPermitted
      : tab.id === "transactions"
      ? categoryStatus("transactions") !== "unavailable" && categoryStatus("transactions") !== "restricted"
      : categoryStatus({
          rights: "ror",
          registration: "registration",
          planning: "planning",
          encumbrances: "encumbrance",
          landUse: "landUse",
          taxesUtilities: "taxesUtilities",
          restrictions: "restrictions"
        }[tab.id]) !== "unavailable" && sectionsByTab[tab.id]?.length)
  ));

  const availability = [
    { id: "rights", label: "Rights & Ownership" },
    { id: "registration", label: "Registration" },
    { id: "planning", label: "Planning / zoning" },
    { id: "buildingPermission", label: "Building permissions" },
    { id: "encumbrances", label: "Encumbrances" },
    { id: "landUse", label: "Land Use" },
    { id: "taxesUtilities", label: "Taxes & Utilities" },
    { id: "restrictions", label: "Restrictions" },
    { id: "transactions", label: "Transaction tracking" }
  ].map((item) => {
    const moduleId = {
      rights: "ror",
      registration: "registration",
      planning: "planning",
      buildingPermission: "buildingPermission",
      encumbrances: "encumbrance",
      landUse: "landUse",
      taxesUtilities: "taxesUtilities",
      restrictions: "restrictions",
      transactions: "transactions"
    }[item.id];
    const status = item.id === "planning"
      ? categoryStatus("planning")
      : categoryStatus(moduleId);
    const sourceModules = item.id === "planning"
      ? ["planning", "buildingPermission"]
      : item.id === "taxesUtilities"
        ? ["propertyTax", "utilities"]
        : [moduleId];
    return {
      ...item,
      status,
      configured: status !== "unavailable",
      source: sourceModules.map((id) => modules[id]?.source?.systemName).find(Boolean) || null,
      lastSynchronizedAt: sourceModules.map((id) => modules[id]?.source?.lastSynchronizedAt).find(Boolean) || null
    };
  });

  const additionalAvailability = [
    { id: "propertyTax", label: "Property tax", status: moduleStatus("propertyTax") },
    { id: "utilities", label: "Utilities and infrastructure", status: moduleStatus("utilities") },
    { id: "valuation", label: "Valuation", status: hasMeaningfulModuleData(utilities.valuation) ? moduleStatus("utilities") : "unavailable" }
  ].map((item) => ({ ...item, configured: item.status !== "unavailable" }));

  return {
    tabs,
    sectionsByTab,
    availability,
    additionalAvailability,
    boundaryCoordinates,
    parcelInfo: getParcelInfo(unifiedRecord),
    planningInfo,
    synchronization: unifiedRecord.synchronization || null,
    access: unifiedRecord.access || null
  };
};
