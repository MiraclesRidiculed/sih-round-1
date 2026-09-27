const pick = (source = {}, fields) => Object.fromEntries(
  fields
    .filter((field) => source?.[field] !== undefined && source[field] !== null && source[field] !== "")
    .map((field) => [field, source[field]])
);

const publicModule = (module, data, hideData = false) => ({
  status: hideData && module?.status && module.status !== "unavailable"
    ? "restricted"
    : module?.status || "unavailable",
  data: hideData || module?.status === "unavailable" ? null : data,
  source: module?.source
    ? {
        systemName: module.source.systemName || null,
        mode: module.source.mode,
        authoritative: module.source.authoritative,
        lastSynchronizedAt: module.source.lastSynchronizedAt || null
      }
    : null
});

const moduleNames = [
  "cadastral",
  "ror",
  "registration",
  "planning",
  "buildingPermission",
  "encumbrance",
  "landUse",
  "restrictions",
  "propertyTax",
  "utilities",
  "transactions",
  "changeDetection"
];

const OFFICER_MODULE_ACCESS = Object.freeze({
  revenue_officer: ["cadastral", "ror", "landUse", "restrictions", "changeDetection"],
  surveyor: ["cadastral", "restrictions", "changeDetection"],
  sro: ["cadastral", "registration", "encumbrance", "restrictions", "transactions", "changeDetection"],
  court: ["cadastral", "restrictions", "changeDetection"],
  bank: ["cadastral", "ror", "encumbrance", "restrictions", "changeDetection"]
});

const projectOfficerModule = (name, module, role, actorId) => {
  const data = module?.data || {};
  if (name === "cadastral") {
    return {
      parcelId: data.parcelId,
      ulpin: data.ulpin,
      surveyNumber: data.surveyNumber,
      hissaNumber: data.hissaNumber,
      district: data.district,
      taluk: data.taluk,
      hobli: data.hobli,
      village: data.village,
      areaInAcres: data.areaInAcres,
      landClassification: data.landClassification,
      geoJson: data.geoJson?.geometry
        ? { type: data.geoJson.type, geometry: data.geoJson.geometry }
        : null,
      cadastralMetadata: pick(data.cadastralMetadata, [
        "cadastralSheetNo",
        "crs",
        "coordinatePrecision",
        "villageGridRef",
        "localAreaUnit"
      ]),
      fieldSurveySubmissions: role === "surveyor"
        ? (data.fieldSurveySubmissions || []).map((submission) => ({
            offlineId: submission.offlineId,
            surveyDate: submission.surveyDate || null,
            observedCoordinate: submission.observedCoordinate || null,
            createdAt: submission.createdAt || null
          }))
        : [],
      sourceRecords: []
    };
  }
  if (name === "ror") {
    const holders = (data.holders || []).map((holder) =>
      role === "bank"
        ? pick(holder, ["name", "relation", "sharePercent"])
        : pick(holder, ["name", "relation", "sharePercent"])
    );
    return {
      record: role === "bank"
        ? pick(data.record, ["rorNumber", "holderName", "sharePercent", "issueDate"])
        : pick(data.record, [
            "rorNumber",
            "holderName",
            "issueDate",
            "subDivisionStatus",
            "mutationStatus",
            "khataStatus",
            "landTaxDemandYear"
          ]),
      rights: data.rights || [],
      holders,
      mutation: role === "revenue_officer" ? data.mutation || {} : {},
      sourceRecord: role === "revenue_officer" ? pick(data.sourceRecord, ["rtcNumber"]) : {},
      ownershipHistory: role === "revenue_officer"
        ? (data.ownershipHistory || []).map((event) => ({
            eventDate: event.eventDate || null,
            eventType: event.eventType,
            owners: (event.owners || []).map((holder) => pick(holder, ["name", "relation", "sharePercent"])),
            summary: event.summary,
            mutationNumber: event.mutationNumber,
            registrationNumber: event.registrationNumber
          }))
        : [],
      sourceRecords: []
    };
  }
  if (name === "registration") {
    return {
      record: pick(data.record, [
        "status",
        "registrationStatus",
        "registrationDate",
        "deedNumber",
        "documentType",
        "sroOffice"
      ]),
      sourceRecord: pick(data.sourceRecord, ["registrationDate"]),
      sourceRecords: []
    };
  }
  if (name === "encumbrance") {
    return {
      record: pick(data.record, ["hasMortgage", "status", "lenderName", "mortgageAmount", "chargeType", "chargeDate"]),
      sourceRecord: pick(data.sourceRecord, ["encumbranceStatus", "encumbranceCertificateNo"]),
      sourceRecords: []
    };
  }
  if (name === "restrictions") {
    const court = role === "court";
    return {
      spatial: role === "surveyor" ? data.spatial || {} : {},
      recorded: ["surveyor", "revenue_officer"].includes(role) ? data.recorded || [] : [],
      disputeRecord: court
        ? pick(data.disputeRecord, ["caseNumber", "courtName", "injunctionStatus", "transactionLock", "stayOrderDate", "nextHearing"])
        : {},
      activeTransferRestriction: data.activeTransferRestriction?.active
        ? {
            active: true,
            ...(court
              ? pick(data.activeTransferRestriction, ["caseIdentifier", "reason"])
              : { notice: "A transfer restriction is recorded for this parcel." })
          }
        : null,
      cases: court
        ? (data.cases || []).map((caseRecord) => ({
            caseIdentifier: caseRecord.caseIdentifier,
            currentStatus: caseRecord.currentStatus,
            filing: caseRecord.filing || {},
            parties: caseRecord.parties || [],
            orders: caseRecord.orders || [],
            auditTrail: caseRecord.auditTrail || [],
            responsibleOfficer: caseRecord.responsibleOfficer || "",
            filedAt: caseRecord.filedAt || null,
            updatedAt: caseRecord.updatedAt || null
          }))
        : []
    };
  }
  if (name === "planning") {
    return {
      masterPlan: pick(data.masterPlan, [
        "authority",
        "zoneCategory",
        "status",
        "planName",
        "planReference",
        "planYear",
        "effectiveDate",
        "planningDesignation",
        "landUseDesignation",
        "permissibleFar",
        "maxCoveragePercent",
        "setbackFront",
        "setbackRear",
        "heritageRestrictions",
        "planningRestrictions",
        "applicableRegulations"
      ]),
      sourceRecords: []
    };
  }
  if (name === "buildingPermission") {
    return {
      record: pick(data.record, [
        "status",
        "planApprovalNo",
        "sanctionedHeightMeters",
        "sanctionedDate",
        "validTill",
        "setbackViolations"
      ])
    };
  }
  if (name === "landUse") return pick(data, ["landClassification", "landUse"]);
  if (name === "transactions") {
    return {
      parcelId: data.parcelId,
      ulpin: data.ulpin,
      ...(role === "sro"
        ? {
            registrationRecord: data.registrationRecord,
            sourceRecord: data.sourceRecord || {}
          }
        : {}),
      applications: (data.applications || [])
        .filter((application) => role !== "citizen" || application.applicantId === String(actorId))
        .map((application) => ({
          id: application.id,
          applicationReference: application.applicationReference,
          transactionType: application.transactionType,
          status: application.status,
          underlyingStatus: application.underlyingStatus || null,
          restrictionNotice: application.restrictionNotice || null,
          initiatedAt: application.initiatedAt,
          updatedAt: application.updatedAt,
          submittedByRole: application.submittedByRole,
          history: (application.history || []).map((entry) => ({
            status: entry.status,
            changedAt: entry.changedAt,
            ...(role === "citizen"
              ? {}
              : { changedByRole: entry.changedByRole, note: entry.note })
          })),
          localPrototype: true
        }))
    };
  }
  if (name === "changeDetection") {
    return data;
  }
  return null;
};

export const toCitizenParcelSearchResult = (parcel) => ({
  parcelId: parcel.parcelId,
  ulpin: parcel.ulpin || null,
  state: parcel.state,
  district: parcel.district,
  taluk: parcel.taluk,
  village: parcel.village,
  surveyNumber: parcel.surveyNumber,
  areaInAcres: parcel.areaInAcres,
  landClassification: parcel.landClassification
});

export const toOfficerParcelSearchResult = (parcel) => toCitizenParcelSearchResult(parcel);

export const toOfficerParcelDetail = (parcel, unifiedRecord, role, actorId) => {
  const allowedModules = role === "citizen"
    ? ["cadastral", "ror", "registration", "planning", "buildingPermission", "encumbrance", "landUse", "restrictions", "transactions", "changeDetection"]
    : OFFICER_MODULE_ACCESS[role];
  if (!allowedModules) throw new TypeError(`No officer parcel access policy is configured for role "${role}".`);
  const sourceModules = unifiedRecord.modules || {};
  const modules = Object.fromEntries(moduleNames.map((name) => {
    if (!allowedModules.includes(name)) {
      return [name, { status: "restricted", data: null, source: null }];
    }

    const module = sourceModules[name] || { status: "unavailable", data: null, source: null };
    if (name === "changeDetection") {
      const data = projectOfficerModule(name, module, role, actorId);
      return [name, publicModule(module, data)];
    }
    const data = projectOfficerModule(name, module, role, actorId);
    return [name, publicModule(module, data)];
  }));
  const publicRecord = {
    schemaVersion: unifiedRecord.schemaVersion,
    correlation: {
      key: "ulpin",
      value: unifiedRecord.correlation?.value || null,
      localParcelId: parcel.parcelId
    },
    parcel: {
      parcelId: parcel.parcelId,
      ulpin: parcel.ulpin || null,
      state: parcel.state,
      sourceSystem: unifiedRecord.parcel?.sourceSystem || null,
      recordStatus: unifiedRecord.parcel?.recordStatus || null,
      lastUpdatedAt: unifiedRecord.parcel?.lastUpdatedAt || null
    },
    synchronization: unifiedRecord.synchronization,
    access: {
      role,
      policy: "application-demo-rbac",
      permittedModules: allowedModules,
      notice: "Role-based views are application demo permissions and do not establish legal authority."
    },
    modules
  };
  const cadastral = modules.cadastral.data || {};
  const detail = {
    parcelId: parcel.parcelId,
    ulpin: parcel.ulpin || null,
    state: parcel.state,
    district: parcel.district,
    taluk: parcel.taluk,
    hobli: parcel.hobli,
    village: parcel.village,
    surveyNumber: parcel.surveyNumber,
    hissaNumber: parcel.hissaNumber,
    areaInAcres: parcel.areaInAcres,
    landClassification: parcel.landClassification,
    landUse: parcel.landUse,
    geoJson: cadastral.geoJson?.geometry
      ? { type: cadastral.geoJson.type, geometry: cadastral.geoJson.geometry }
      : null,
    stateProfile: { systemName: parcel.stateProfile?.systemName || null },
    verificationHint: { status: parcel.verificationHint?.status || null },
    updatedAt: parcel.updatedAt || null,
    unifiedRecord: publicRecord
  };
  if (role === "surveyor") {
    const subdivisionData = parcel.subdivisionData || {};
    const activeSketch = subdivisionData.activeSketch || {};
    const permittedSubdivision = {
      isSubdivided: Boolean(subdivisionData.isSubdivided),
      activeSketch: pick(activeSketch, ["sketchId", "status", "splitLine", "demarcationLineCoords"]),
      subdivisions: (subdivisionData.subdivisions || []).map((subdivision) => ({
        childIdentifier: subdivision.childIdentifier || null,
        part: subdivision.part || null,
        areaInAcres: subdivision.areaInAcres ?? null,
        geoJson: subdivision.geoJson?.geometry
          ? { type: subdivision.geoJson.type, geometry: subdivision.geoJson.geometry }
          : null
      }))
    };
    detail.subdivisionData = permittedSubdivision;
    modules.cadastral.data.subdivisionData = permittedSubdivision;
  }
  if (role === "court") {
    detail.disputeRecord = {
      hasActiveInjunction: Boolean(parcel.disputeRecord?.hasActiveInjunction),
      transactionLock: Boolean(parcel.disputeRecord?.transactionLock),
      injunctionStatus: parcel.disputeRecord?.injunctionStatus || null,
      stayOrderDate: parcel.disputeRecord?.stayOrderDate || null,
      nextHearing: parcel.disputeRecord?.nextHearing || null
    };
  }
  return detail;
};

export const toCitizenParcelDetail = (parcel, unifiedRecord, actorId) => {
  const modules = unifiedRecord.modules || {};
  const cadastral = modules.cadastral?.data || {};
  const ror = modules.ror?.data || {};
  const registration = modules.registration?.data || {};
  const planning = modules.planning?.data || {};
  const buildingPermission = modules.buildingPermission?.data || {};
  const encumbrance = modules.encumbrance?.data || {};
  const landUse = modules.landUse?.data || {};
  const restrictions = modules.restrictions?.data || {};

  const citizenModules = {
    cadastral: publicModule(modules.cadastral, {
      parcelId: cadastral.parcelId,
      ulpin: cadastral.ulpin,
      surveyNumber: cadastral.surveyNumber,
      hissaNumber: cadastral.hissaNumber,
      district: cadastral.district,
      taluk: cadastral.taluk,
      village: cadastral.village,
      areaInAcres: cadastral.areaInAcres,
      landClassification: cadastral.landClassification,
      geoJson: cadastral.geoJson?.geometry
        ? { type: cadastral.geoJson.type, geometry: cadastral.geoJson.geometry }
        : null,
      cadastralMetadata: pick(cadastral.cadastralMetadata, [
        "cadastralSheetNo",
        "crs",
        "coordinatePrecision",
        "villageGridRef",
        "localAreaUnit"
      ])
    }),
    ror: publicModule(modules.ror, {
      record: pick(ror.record, ["rorNumber", "issueDate", "subDivisionStatus", "mutationStatus"]),
      rights: ror.rights || [],
      mutation: pick(ror.mutation, ["mutationStatus", "khataStatus"]),
      sourceRecord: pick(ror.sourceRecord, ["rtcNumber"]),
      holders: [],
      ownershipHistory: [],
      sourceRecords: []
    }),
    registration: publicModule(modules.registration, {
      record: pick(registration.record, ["status", "registrationStatus", "registrationDate", "documentType"]),
      sourceRecord: pick(registration.sourceRecord, ["registrationDate"]),
      sourceRecords: []
    }),
    planning: publicModule(modules.planning, {
      masterPlan: pick(planning.masterPlan, [
        "authority",
        "zoneCategory",
        "status",
        "planName",
        "planReference",
        "planYear",
        "effectiveDate",
        "planningDesignation",
        "landUseDesignation",
        "permissibleFar",
        "maxCoveragePercent",
        "setbackFront",
        "setbackRear",
        "heritageRestrictions",
        "planningRestrictions",
        "applicableRegulations"
      ]),
      sourceRecords: []
    }),
    buildingPermission: publicModule(modules.buildingPermission, {
      record: pick(buildingPermission.record, [
        "status",
        "planApprovalNo",
        "sanctionedHeightMeters",
        "sanctionedDate",
        "validTill",
        "setbackViolations"
      ])
    }),
    encumbrance: publicModule(modules.encumbrance, {
      record: pick(encumbrance.record, ["hasMortgage", "status"])
    }),
    landUse: publicModule(modules.landUse, {
      landClassification: landUse.landClassification,
      landUse: landUse.landUse
    }),
    restrictions: publicModule(modules.restrictions, {
      spatial: pick(restrictions.spatial, [
        "isEcoSensitive",
        "isWithin30mBuffer",
        "lakeBufferDistanceMeters",
        "heritageZone",
        "crzZone",
        "highTensionLineOverlap",
        "heritageBuffer"
      ]),
      recorded: restrictions.recorded || [],
      activeTransferRestriction: restrictions.activeTransferRestriction?.active
        ? { active: true, notice: "A transfer restriction is recorded for this parcel." }
        : null,
      cases: []
    }),
    propertyTax: publicModule(modules.propertyTax, null, true),
    utilities: publicModule(modules.utilities, null, true),
    transactions: publicModule(
      modules.transactions,
      projectOfficerModule("transactions", modules.transactions, "citizen", actorId)
    ),
    changeDetection: publicModule(
      modules.changeDetection,
      projectOfficerModule("changeDetection", modules.changeDetection, "citizen", actorId)
    )
  };

  const publicRecord = {
    schemaVersion: unifiedRecord.schemaVersion,
    correlation: {
      key: "ulpin",
      value: unifiedRecord.correlation?.value || null,
      localParcelId: parcel.parcelId
    },
    parcel: {
      parcelId: parcel.parcelId,
      ulpin: parcel.ulpin || null,
      state: parcel.state,
      sourceSystem: unifiedRecord.parcel?.sourceSystem || null,
      recordStatus: unifiedRecord.parcel?.recordStatus || null,
      lastUpdatedAt: unifiedRecord.parcel?.lastUpdatedAt || null
    },
    synchronization: unifiedRecord.synchronization,
    modules: citizenModules
  };

  return {
    parcelId: parcel.parcelId,
    ulpin: parcel.ulpin || null,
    state: parcel.state,
    district: parcel.district,
    taluk: parcel.taluk,
    hobli: parcel.hobli,
    village: parcel.village,
    surveyNumber: parcel.surveyNumber,
    hissaNumber: parcel.hissaNumber,
    areaInAcres: parcel.areaInAcres,
    landClassification: parcel.landClassification,
    landUse: parcel.landUse,
    geoJson: citizenModules.cadastral.data?.geoJson || null,
    stateProfile: { systemName: parcel.stateProfile?.systemName || null },
    verificationHint: { status: parcel.verificationHint?.status || null },
    updatedAt: parcel.updatedAt || null,
    unifiedRecord: publicRecord
  };
};
