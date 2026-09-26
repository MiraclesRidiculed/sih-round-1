const sourceAvailability = (department, lastSyncedAt) => ({
  department,
  integrationMode: "demo",
  authoritative: false,
  lastSyncedAt
});

export const demoParcels = [
  // 1. TAMIL NADU PILOT PARCEL (Launched 31 Dec 2025)
  {
    parcelId: "TN-KPM-0001",
    ulpin: "33030400100482",
    surveyNumber: "248/3",
    hissaNumber: "B",
    khataNumber: "PATTA-KPM-5510",
    propertyId: "PID-TN-SPB-9941",
    state: "Tamil Nadu",
    district: "Kanchipuram",
    taluk: "Sriperumbudur",
    hobli: "Sunguvarchatram",
    village: "Mambakkam",
    areaInAcres: 1.25,
    landClassification: "Dry Agricultural (Converted to Industrial Zone)",
    landUse: "Electronics Manufacturing & Hi-Tech Logistics Park",
    stateProfile: {
      systemName: "Tamil Nilam (Land Records) & TNREGINET (Registration)",
      rorLabel: "Patta / Chitta",
      surveyLabel: "Survey No. & Sub-division",
      localUnit: "Grounds & Cents (30 Cents / 5.4 Grounds)"
    },
    geoJson: {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [79.9182, 12.9341],
            [79.9224, 12.9341],
            [79.9224, 12.9312],
            [79.9182, 12.9312],
            [79.9182, 12.9341]
          ]
        ]
      },
      properties: {
        label: "Mambakkam Survey 248/3B (Tamil Nadu Land Stack Pilot)",
        zoningColor: "#3b82f6"
      }
    },
    currentOwners: [
      {
        name: "Senthil Kumar V",
        relation: "S/o Varadarajan",
        sharePercent: 100,
        identifierMasked: "XXXX9182"
      }
    ],
    baseLayer: {
      cadastralSheetNo: "CS-TN-KPM-048",
      vertexCount: 4,
      coordinatePrecision: "GNSS CORS Sub-meter (±5cm)",
      localAreaUnit: "1.25 Acres (30 Cents / 5.4 Grounds)",
      crs: "EPSG:4326 / WGS84",
      villageGridRef: "Grid-MAM-NW-14",
      vertices: [
        { pt: 1, lat: 12.9341, lng: 79.9182, marker: "Stone Monolith N-1" },
        { pt: 2, lat: 12.9341, lng: 79.9224, marker: "Stone Monolith N-2" },
        { pt: 3, lat: 12.9312, lng: 79.9224, marker: "Survey Peg S-1" },
        { pt: 4, lat: 12.9312, lng: 79.9182, marker: "Survey Peg S-2" }
      ]
    },
    essentialLayers: {
      ror: {
        rorNumber: "PATTA-KPM-5510",
        issueDate: "2024-03-15",
        holderName: "Senthil Kumar V",
        subDivisionStatus: "Sanctioned & Digitized in Tamil Nilam",
        landTaxDemandYear: "2025-26",
        revenueCourtDispute: false
      },
      registration: {
        sroOffice: "SRO Sriperumbudur",
        deedNumber: "DOC-2024-SPB-3109",
        registrationDate: "2024-04-10",
        stampDutyPaid: "₹ 4,80,000",
        considerationValue: "₹ 96,00,000",
        documentType: "Sale Deed (Registered via TNREGINET 2.0)"
      },
      masterPlanZoning: {
        authority: "CMDA (Chennai Metropolitan Development Authority) / DTCP",
        zoneCategory: "Industrial (Light & Hi-Tech Corridor)",
        permissibleFar: 2.5,
        maxCoveragePercent: 55,
        setbackFront: "12m mandatory buffer against SH-57",
        setbackRear: "6m",
        status: "Fully Compliant with Master Plan 2026"
      },
      buildingPermissions: {
        status: "Sanctioned",
        planApprovalNo: "CMDA/BP/2024/0912",
        sanctionedHeightMeters: 18,
        setbackViolations: false,
        sanctionedDate: "2024-06-20",
        validTill: "2027-06-19"
      },
      encumbrance: {
        hasMortgage: true,
        lenderName: "Indian Overseas Bank, Sriperumbudur Branch",
        mortgageAmount: "₹ 1,50,00,000",
        chargeType: "Hypothecation & Registered Equitable Mortgage",
        chargeDate: "2024-08-01",
        status: "Active Charge Registered with SRO"
      },
      rrrSummary: {
        rights: [
          "Freehold industrial manufacturing usage right under CMDA 2026 Master Plan",
          "Approved for 3-phase industrial power substation access",
          "Subdivision right approved by DTCP"
        ],
        restrictions: [
          "Mandatory 12m front green buffer along State Highway 57",
          "Zero Liquid Discharge (ZLD) effluent compliance strictly enforced",
          "No residential conversion allowed without state cabinet approval"
        ],
        liabilities: [
          "Active registered mortgage charge of ₹ 1.50 Cr with Indian Overseas Bank",
          "Annual industrial property tax assessment of ₹ 34,000 to Mambakkam Village Panchayat"
        ]
      }
    },
    additionalLayers: {
      utilities: {
        waterSupplyLine: "SIPCOT Industrial Water Feeder Pipeline (300mm ductile iron)",
        waterConnectionId: "SIPCOT-WTR-8812",
        powerSubstationDistance: "350m from TANGEDCO 33/11kV Substation",
        drainageNetwork: "SIPCOT Common Industrial Effluent & Storm Drain Connected",
        telecomFiber: "Underground Dual Duct (BSNL & Airtel Enterprise)"
      },
      propertyTax: {
        propertyTaxId: "PID-TN-SPB-9941",
        assessmentYear: "2025-26",
        annualDemand: 34000,
        amountPaid: 34000,
        duesAmount: 0,
        paymentStatus: "Paid & Up to Date",
        receiptNo: "REC-TN-2025-4401"
      },
      valuation: {
        circleRatePerSqFt: 3200,
        guidanceValueTotal: "₹ 1,74,24,000",
        marketEstimateRange: "₹ 1.95 Cr - 2.20 Cr",
        lastRevisionDate: "2024-04-01"
      },
      restrictionZones: {
        isEcoSensitive: false,
        lakeBufferDistanceMeters: 450,
        isWithin30mBuffer: false,
        crzZone: "None (Inland 38km from Coast)",
        highTensionLineOverlap: false,
        heritageBuffer: false
      }
    },
    aiGeospatial: {
      satelliteChangeDetection: {
        lastSatellitePassDate: "2026-08-10",
        historicalReferenceDate: "2024-01-15",
        anomalyDetected: false,
        anomalyType: "Zoning & Footprint Conformant",
        confidenceScorePercent: 98,
        detectedFootprintChangeSqM: 0,
        aiRecommendation: "AI verified: Boundary edges align 100% with cadastral survey and CMDA sanctioned industrial building layout."
      }
    },
    departmentalWorkflows: [
      {
        id: "WF-TN-01",
        department: "Revenue (Tamil Nilam)",
        title: "Online Sub-division & Patta Transfer",
        status: "Completed",
        applicant: "Senthil Kumar V",
        initiatedAt: "2024-03-01",
        completedAt: "2024-03-15",
        remarks: "Auto-synced via TNREGINET registered sale deed #3109/2024",
        txHash: "0x7a83b194f1837a28e991cd4a8731b99210948ac0192837482910384729103847"
      },
      {
        id: "WF-TN-02",
        department: "Town Planning (CMDA)",
        title: "Industrial Building Sanction & NOC",
        status: "Approved",
        applicant: "Senthil Kumar V",
        initiatedAt: "2024-05-10",
        completedAt: "2024-06-20",
        remarks: "Master Plan 2026 Industrial classification verified with 12m SH-57 setback",
        txHash: "0x5c90e21938ab0192847120394857102938475610293847561029384756102938"
      },
      {
        id: "WF-TN-03",
        department: "Registration (TNREGINET)",
        title: "Mortgage Charge Registration (IOB)",
        status: "Recorded",
        applicant: "Indian Overseas Bank",
        initiatedAt: "2024-07-28",
        completedAt: "2024-08-01",
        remarks: "Equitable mortgage lien registered and flagged on Land Stack Encumbrance Layer",
        txHash: "0x3d91029384756102938475610293847561029384756102938475610293847561"
      }
    ],
    authoritativeRecords: {
      rtcNumber: "PATTA-KPM-5510",
      rtcLastUpdated: "2024-03-15",
      mutationNumber: "TN-MUT-2024-819",
      mutationStatus: "Approved & Patta Issued",
      registrationReference: "DOC-2024-SPB-3109",
      registrationDate: "2024-04-10",
      encumbranceStatus: "Active bank mortgage registered (Indian Overseas Bank ₹ 1.5 Cr)",
      encumbranceCertificateNo: "EC-TN-2024-SPB-8812",
      surveySketchRef: "CS-TN-KPM-048",
      khataStatus: "Patta Verified in Tamil Nilam",
      disputeStatus: "No court stay or civil litigation"
    },
    sourceAvailability: {
      rtc: sourceAvailability("Tamil Nilam / Department of Land Administration, TN", "2026-08-20T08:00:00.000Z"),
      mutation: sourceAvailability("Revenue Department, Tamil Nadu", "2026-08-20T08:00:00.000Z"),
      registration: sourceAvailability("TNREGINET SRO Sriperumbudur", "2026-08-20T08:00:00.000Z"),
      encumbrance: sourceAvailability("TNREGINET Encumbrance Gateway", "2026-08-20T08:00:00.000Z"),
      survey: sourceAvailability("Survey and Settlement Department, Chennai", "2026-08-20T08:00:00.000Z")
    },
    verificationHint: {
      status: "verified",
      summary: "Tamil Nadu pilot parcel: Tamil Nilam Patta, TNREGINET deed, CMDA Master Plan, and IOB Mortgage charge are fully synchronized in Land Stack DPI."
    },
    blockchain: {
      parcelKey: "TN|Kanchipuram|Sriperumbudur|Sunguvarchatram|Mambakkam|248/3|B",
      network: "Sepolia-ready",
      anchorStatus: "demo-ready",
      contractAddress: "0x39a1c890f84a1e94829103847561029384756102",
      lastAnchorTxHash: "0x7a83b194f1837a28e991cd4a8731b99210948ac0192837482910384729103847",
      lastAnchoredAt: "2024-08-01T14:30:00.000Z"
    },
    qrToken: "scan-tn-kpm-0001",
    demoNotes:
      "Department of Land Resources (DoLR) Pilot Location (Tamil Nadu): Demonstrates Tamil Nilam, TNREGINET, CMDA zoning, active industrial mortgage, and CORS survey harmonization."
  },

  // 2. CHANDIGARH UT PILOT PARCEL (Urban UT Land Administration)
  {
    parcelId: "CHD-UT-0001",
    ulpin: "04010100200814",
    surveyNumber: "SCO 84-85",
    hissaNumber: "Block C",
    khataNumber: "CHD-EST-1704",
    propertyId: "MCC-PID-SEC17-884",
    state: "Chandigarh (UT)",
    district: "Chandigarh",
    taluk: "Chandigarh Urban",
    hobli: "City Centre",
    village: "Sector 17",
    areaInAcres: 0.18,
    landClassification: "Urban Commercial Freehold",
    landUse: "Commercial Retail Arcade & Corporate Offices",
    stateProfile: {
      systemName: "Chandigarh Estate Office & e-Registrar",
      rorLabel: "Urban Property Record (UPR) / Jamabandi",
      surveyLabel: "Sector, Block & SCO Plot Number",
      localUnit: "Square Yards (870 Sq. Yds / 35 Marla)"
    },
    geoJson: {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [76.7821, 30.7398],
            [76.7845, 30.7398],
            [76.7845, 30.7381],
            [76.7821, 30.7381],
            [76.7821, 30.7398]
          ]
        ]
      },
      properties: {
        label: "Sector 17-C SCO 84-85 (Chandigarh UT Land Stack Pilot)",
        zoningColor: "#f59e0b"
      }
    },
    currentOwners: [
      {
        name: "Gurpreet Singh Dhillon",
        relation: "S/o Balwant Singh Dhillon",
        sharePercent: 60,
        identifierMasked: "XXXX5512"
      },
      {
        name: "Simran Kaur Dhillon",
        relation: "W/o Gurpreet Singh Dhillon",
        sharePercent: 40,
        identifierMasked: "XXXX7709"
      }
    ],
    baseLayer: {
      cadastralSheetNo: "CS-CHD-SEC17-02",
      vertexCount: 4,
      coordinatePrecision: "Urban Geodetic CORS (±2cm)",
      localAreaUnit: "870 Sq. Yards (0.18 Acres)",
      crs: "EPSG:4326 / WGS84",
      villageGridRef: "Sector-17-Grid-C-04",
      vertices: [
        { pt: 1, lat: 30.7398, lng: 76.7821, marker: "Corbusier Pillar C-17-A" },
        { pt: 2, lat: 30.7398, lng: 76.7845, marker: "Corbusier Pillar C-17-B" },
        { pt: 3, lat: 30.7381, lng: 76.7845, marker: "Arcade Baseline D-1" },
        { pt: 4, lat: 30.7381, lng: 76.7821, marker: "Arcade Baseline D-2" }
      ]
    },
    essentialLayers: {
      ror: {
        rorNumber: "UPR-CHD-SEC17-084",
        issueDate: "2023-11-20",
        holderName: "Gurpreet Singh Dhillon & Simran Kaur Dhillon",
        subDivisionStatus: "Urban Freehold Commercial Deed Validated",
        landTaxDemandYear: "2025-26",
        revenueCourtDispute: false
      },
      registration: {
        sroOffice: "Sub-Registrar UT Chandigarh",
        deedNumber: "REG-CHD-2023-1992",
        registrationDate: "2023-10-18",
        stampDutyPaid: "₹ 11,20,000",
        considerationValue: "₹ 2,24,00,000",
        documentType: "Conveyance Deed of Freehold Commercial Plot"
      },
      masterPlanZoning: {
        authority: "Department of Urban Planning, Chandigarh Administration",
        zoneCategory: "Commercial Central Business District (CBD)",
        permissibleFar: 2.0,
        maxCoveragePercent: 70,
        heritageRestrictions: "Le Corbusier Sector 17 Visual Charter - Facade & Arcade preservation strictly mandated",
        status: "Conforms to Chandigarh Master Plan 2031"
      },
      buildingPermissions: {
        status: "Sanctioned (Heritage NOC Compliant)",
        planApprovalNo: "CHD-MC-BP-8819",
        sanctionedHeightMeters: 14.5,
        setbackViolations: false,
        sanctionedDate: "2023-12-04",
        validTill: "2028-12-03"
      },
      encumbrance: {
        hasMortgage: false,
        lenderName: "None",
        mortgageAmount: "₹ 0",
        chargeType: "None",
        status: "Clean Title / Free from Encumbrance (Zero Liens)"
      },
      rrrSummary: {
        rights: [
          "Commercial retail operations, corporate offices, and restaurant licensing permitted",
          "Underground basement storage & private parking allocation authorized"
        ],
        restrictions: [
          "Modification of external exposed-concrete facade strictly prohibited under Chandigarh Heritage Bye-laws",
          "No vertical extension allowed above 14.5m height restriction"
        ],
        liabilities: [
          "Annual commercial property tax assessment of ₹ 72,000 to Municipal Corporation Chandigarh (MCC)",
          "Mandatory fire & safety audit renewal every 3 years"
        ]
      }
    },
    additionalLayers: {
      utilities: {
        waterSupplyLine: "24x7 High Pressure Filtered Water Supply (MCC 200mm Main)",
        waterConnectionId: "MCC-WTR-SEC17-91",
        powerSubstationDistance: "80m from Underground 11kV Compact Substation",
        drainageNetwork: "Dual Storm & Wastewater Separation Network (Zero Waterlogging)",
        telecomFiber: "Underground Multi-Operator Telecom Utility Duct"
      },
      propertyTax: {
        propertyTaxId: "MCC-PID-SEC17-884",
        assessmentYear: "2025-26",
        annualDemand: 72000,
        amountPaid: 72000,
        duesAmount: 0,
        paymentStatus: "Paid in Advance",
        receiptNo: "MCC-TAX-2025-081"
      },
      valuation: {
        circleRatePerSqFt: 18500,
        guidanceValueTotal: "₹ 14,48,55,000",
        marketEstimateRange: "₹ 16.0 Cr - 18.5 Cr",
        lastRevisionDate: "2025-01-01"
      },
      restrictionZones: {
        isEcoSensitive: false,
        lakeBufferDistanceMeters: 3200,
        isWithin30mBuffer: false,
        heritageZone: "Corbusier Heritage Protection Zone (Buffer 0m - Inner Core)",
        crzZone: "None",
        highTensionLineOverlap: false
      }
    },
    aiGeospatial: {
      satelliteChangeDetection: {
        lastSatellitePassDate: "2026-08-20",
        historicalReferenceDate: "2024-02-12",
        anomalyDetected: false,
        anomalyType: "Zero Heritage/Footprint Violation",
        confidenceScorePercent: 99,
        detectedFootprintChangeSqM: 0,
        aiRecommendation: "AI verified: Exterior structural footprint strictly aligns with Corbusier sector grid and approved MCC heritage elevation."
      }
    },
    departmentalWorkflows: [
      {
        id: "WF-CHD-01",
        department: "Estate Office UT Chandigarh",
        title: "Freehold Ownership Regularization",
        status: "Completed",
        applicant: "Gurpreet Singh Dhillon",
        initiatedAt: "2023-10-25",
        completedAt: "2023-11-20",
        remarks: "All estate office conversion charges paid and NDC issued",
        txHash: "0x892a019485710293847561029384756102938475610293847561029384756102"
      },
      {
        id: "WF-CHD-02",
        department: "Municipal Corporation Chandigarh (MCC)",
        title: "Commercial Property Tax ID (PID) Onboarding",
        status: "Completed",
        applicant: "Gurpreet Singh Dhillon",
        initiatedAt: "2023-12-10",
        completedAt: "2023-12-18",
        remarks: "Digital PID mapped to ULPIN in Land Stack DPI",
        txHash: "0x2341908273645192837465192837465192837465192837465192837465192837"
      }
    ],
    authoritativeRecords: {
      rtcNumber: "UPR-CHD-SEC17-084",
      rtcLastUpdated: "2023-11-20",
      mutationNumber: "MUT-CHD-EST-902",
      mutationStatus: "Approved & Transferred in Estate Register",
      registrationReference: "REG-CHD-2023-1992",
      registrationDate: "2023-10-18",
      encumbranceStatus: "Clear title, zero active bank liens or attachments",
      encumbranceCertificateNo: "NEC-CHD-2024-019",
      surveySketchRef: "CS-CHD-SEC17-02",
      khataStatus: "MCC e-Tax Linked",
      disputeStatus: "Clear of disputes"
    },
    sourceAvailability: {
      rtc: sourceAvailability("Estate Office, Chandigarh Administration", "2026-08-20T08:00:00.000Z"),
      mutation: sourceAvailability("Land & Estate Branch, UT Chandigarh", "2026-08-20T08:00:00.000Z"),
      registration: sourceAvailability("Sub-Registrar Office, Sector 17, Chandigarh", "2026-08-20T08:00:00.000Z"),
      encumbrance: sourceAvailability("Revenue & Property Registry, UT", "2026-08-20T08:00:00.000Z"),
      survey: sourceAvailability("Urban Planning Department, Chandigarh", "2026-08-20T08:00:00.000Z")
    },
    verificationHint: {
      status: "verified",
      summary: "Chandigarh UT pilot: Urban Property Register, MCC property tax, building height NOC, and Corbusier visual heritage compliance verified in Land Stack DPI."
    },
    blockchain: {
      parcelKey: "CHD|Chandigarh|Chandigarh Urban|City Centre|Sector 17|SCO 84-85|Block C",
      network: "Sepolia-ready",
      anchorStatus: "demo-ready",
      contractAddress: "0x39a1c890f84a1e94829103847561029384756102",
      lastAnchorTxHash: "0x892a019485710293847561029384756102938475610293847561029384756102",
      lastAnchoredAt: "2023-11-20T11:15:00.000Z"
    },
    qrToken: "scan-chd-ut-0001",
    demoNotes:
      "Department of Land Resources (DoLR) Pilot Location (Chandigarh UT): Demonstrates high-value urban land administration, commercial property registers, heritage zoning constraints, and municipal tax harmonization."
  },

  // 3. KARNATAKA PILOT PARCEL 1 (Bengaluru Urban - Peri-urban conversion with AI Encroachment Alert)
  {
    parcelId: "KAR-BLRU-0001",
    ulpin: "29140200300119",
    surveyNumber: "123/4",
    hissaNumber: "A",
    khataNumber: "KHATA-BEU-24019",
    propertyId: "PID-BEU-AVA-9001",
    state: "Karnataka",
    district: "Bengaluru Urban",
    taluk: "Bengaluru East",
    hobli: "Bidarahalli",
    village: "Avalahalli",
    areaInAcres: 2.35,
    landClassification: "Dry Agricultural Land (Conversion In-Progress)",
    landUse: "Agricultural parcel with residential group housing conversion applied",
    stateProfile: {
      systemName: "Bhoomi (Revenue) & Kaveri 2.0 (Registration)",
      rorLabel: "RTC / Pahani",
      surveyLabel: "Survey No. & Hissa",
      localUnit: "Acres & Guntas (2 Acres 14 Guntas)"
    },
    geoJson: {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [77.6981, 13.0714],
            [77.7018, 13.0714],
            [77.7018, 13.0688],
            [77.6981, 13.0688],
            [77.6981, 13.0714]
          ]
        ]
      },
      properties: {
        label: "Avalahalli Survey 123/4A (Karnataka Land Stack Pilot)",
        zoningColor: "#22c55e"
      }
    },
    currentOwners: [
      {
        name: "Lakshmamma N",
        relation: "D/o Narayanappa",
        sharePercent: 50,
        identifierMasked: "XXXX2341"
      },
      {
        name: "Raghavendra N",
        relation: "S/o Narayanappa",
        sharePercent: 50,
        identifierMasked: "XXXX7782"
      }
    ],
    baseLayer: {
      cadastralSheetNo: "CS-KAR-BLRU-AVA-12",
      vertexCount: 4,
      coordinatePrecision: "DGPS Survey (±10cm)",
      localAreaUnit: "2 Acres 14 Guntas",
      crs: "EPSG:4326 / WGS84",
      villageGridRef: "Grid-AVA-EAST-02",
      vertices: [
        { pt: 1, lat: 13.0714, lng: 77.6981, marker: "Boundary Stone N-W" },
        { pt: 2, lat: 13.0714, lng: 77.7018, marker: "Boundary Stone N-E" },
        { pt: 3, lat: 13.0688, lng: 77.7018, marker: "Boundary Stone S-E" },
        { pt: 4, lat: 13.0688, lng: 77.6981, marker: "Boundary Stone S-W" }
      ]
    },
    essentialLayers: {
      ror: {
        rorNumber: "RTC-BEU-2024-00119",
        issueDate: "2024-07-08",
        holderName: "Lakshmamma N & Raghavendra N",
        subDivisionStatus: "Sanctioned 11E sketch on record",
        landTaxDemandYear: "2025-26",
        revenueCourtDispute: false
      },
      registration: {
        sroOffice: "SRO K.R. Puram / Bengaluru East",
        deedNumber: "KAVERI-BEU-SD-1908/2024",
        registrationDate: "2024-05-22",
        stampDutyPaid: "₹ 8,90,000",
        considerationValue: "₹ 1,78,00,000",
        documentType: "Partition Deed Registered via Kaveri 2.0"
      },
      masterPlanZoning: {
        authority: "BDA Revised Master Plan 2031 / BMRDA",
        zoneCategory: "Residential (Main) R-2 Transition Zone",
        permissibleFar: 2.25,
        maxCoveragePercent: 60,
        setbackFront: "8m",
        status: "Permissible for Group Housing subject to DC Land Conversion Order"
      },
      buildingPermissions: {
        status: "Under Scrutiny",
        planApprovalNo: "BBMP/LP/2024/552",
        sanctionedHeightMeters: 24,
        setbackViolations: false,
        sanctionedDate: "Pending DC Conversion NOC"
      },
      encumbrance: {
        hasMortgage: false,
        lenderName: "None",
        mortgageAmount: "₹ 0",
        chargeType: "None",
        status: "Non-Encumbered / Clear Title"
      },
      rrrSummary: {
        rights: [
          "Agricultural cultivation rights under Karnataka Land Revenue Act 1964",
          "Right to apply for Section 95 Land Conversion for residential layout"
        ],
        restrictions: [
          "Mandatory 30m lake buffer preservation along Avalahalli Tank boundary",
          "No permanent commercial construction permitted until DC Conversion order is formally gazetted"
        ],
        liabilities: [
          "Annual land revenue assessment to Village Accountant",
          "Pending conversion fee payment of ₹ 4.2 Lakhs to Tahsildar Bengaluru East"
        ]
      }
    },
    additionalLayers: {
      utilities: {
        waterSupplyLine: "BWSSB Cauvery Stage V Feeder (Pipeline work under execution)",
        waterConnectionId: "BWSSB-PEND-2026",
        powerSubstationDistance: "600m from BESCOM 66/11kV Avalahalli Substation",
        drainageNetwork: "Open roadside storm drain leading to valley network",
        telecomFiber: "Overhead Optical Fiber (BESCOM Pole Mounted)"
      },
      propertyTax: {
        propertyTaxId: "e-Aasthi-BEU-2024-911",
        assessmentYear: "2025-26",
        annualDemand: 12500,
        amountPaid: 12500,
        duesAmount: 0,
        paymentStatus: "Paid",
        receiptNo: "EA-TAX-2025-0012"
      },
      valuation: {
        circleRatePerSqFt: 4200,
        guidanceValueTotal: "₹ 4,30,00,000",
        marketEstimateRange: "₹ 4.8 Cr - 5.4 Cr",
        lastRevisionDate: "2024-10-01"
      },
      restrictionZones: {
        isEcoSensitive: true,
        lakeBufferDistanceMeters: 48,
        isWithin30mBuffer: false,
        bufferWarning: "Parcel boundary is 48m from Avalahalli lake shoreline; within 75m lake monitoring zone",
        crzZone: "None",
        highTensionLineOverlap: false
      }
    },
    aiGeospatial: {
      satelliteChangeDetection: {
        lastSatellitePassDate: "2026-08-18",
        historicalReferenceDate: "2024-03-01",
        anomalyDetected: true,
        anomalyType: "Potential Encroachment Alert on North-East Edge",
        confidenceScorePercent: 94,
        detectedFootprintChangeSqM: 38.5,
        aiRecommendation:
          "AI Satellite Alert: North-East corner shows unauthorized boundary fencing extending 3.8m toward lake buffer zone. Immediate field inspection by Revenue Inspector recommended."
      }
    },
    departmentalWorkflows: [
      {
        id: "WF-KAR-01",
        department: "Revenue (Bhoomi)",
        title: "Inheritance Mutation MR-42/2024-25",
        status: "Completed",
        applicant: "Lakshmamma N",
        initiatedAt: "2024-07-01",
        completedAt: "2024-07-08",
        remarks: "Sanctioned and reflected in digital RTC",
        txHash: "0x1293847561029384756102938475610293847561029384756102938475610293"
      },
      {
        id: "WF-KAR-02",
        department: "Survey (SSLR / Dishaank)",
        title: "11E Sketch Digital Geo-referencing",
        status: "Approved",
        applicant: "Raghavendra N",
        initiatedAt: "2024-06-15",
        completedAt: "2024-06-25",
        remarks: "DGPS boundary polygon validated in Bhoomi",
        txHash: "0x9812736451928374651928374651928374651928374651928374651928374651"
      },
      {
        id: "WF-KAR-03",
        department: "Town Planning (BDA)",
        title: "Section 95 Land Conversion Scrutiny",
        status: "In-Progress",
        applicant: "Lakshmamma N",
        initiatedAt: "2025-08-01",
        completedAt: null,
        remarks: "Scrutinizing 48m lake buffer setback compliance",
        txHash: "0x4756102938475610293847561029384756102938475610293847561029384756"
      }
    ],
    authoritativeRecords: {
      rtcNumber: "RTC-BEU-2024-00119",
      rtcLastUpdated: "2024-07-08",
      mutationNumber: "MR-42/2024-25",
      mutationStatus: "Sanctioned and reflected in RTC",
      registrationReference: "KAVERI-BEU-SD-1908/2024",
      registrationDate: "2024-05-22",
      encumbranceStatus: "No live encumbrance entries in seeded record",
      encumbranceCertificateNo: "EC-2024-AV-0091",
      surveySketchRef: "SK-BLRU-BID-123-4A",
      khataStatus: "Updated",
      disputeStatus: "No dispute noted in demo feed"
    },
    sourceAvailability: {
      rtc: sourceAvailability("Bhoomi / Revenue Department", "2026-08-15T09:15:00.000Z"),
      mutation: sourceAvailability("Revenue Department", "2026-08-15T09:20:00.000Z"),
      registration: sourceAvailability("Kaveri Registration Demo Adapter", "2026-08-15T09:30:00.000Z"),
      encumbrance: sourceAvailability("Registration Department", "2026-08-15T09:31:00.000Z"),
      survey: sourceAvailability("Survey Settlement and Land Records", "2026-08-15T09:35:00.000Z")
    },
    verificationHint: {
      status: "attention",
      summary: "RTC and Kaveri records are consistent, but AI Satellite Change Detection flagged 38.5 sqm perimeter anomaly near lake buffer."
    },
    blockchain: {
      parcelKey: "KAR|Bengaluru Urban|Bengaluru East|Bidarahalli|Avalahalli|123/4|A",
      network: "Sepolia-ready",
      anchorStatus: "demo-ready",
      contractAddress: "0x39a1c890f84a1e94829103847561029384756102",
      lastAnchorTxHash: "0x1293847561029384756102938475610293847561029384756102938475610293",
      lastAnchoredAt: "2024-07-08T10:00:00.000Z"
    },
    qrToken: "scan-kar-blru-0001",
    demoNotes:
      "Karnataka Land Stack Pilot: Demonstrates Bhoomi RTC, Kaveri deed, Master Plan R-2 zoning, and AI satellite change detection flagging lake buffer encroachment."
  },

  // 4. KARNATAKA PILOT PARCEL 2 (Mysuru - Heritage & Active Agricultural Mortgage)
  {
    parcelId: "KAR-MYS-0002",
    ulpin: "29150100400882",
    surveyNumber: "88/2",
    hissaNumber: "B",
    khataNumber: "KHATA-MYS-1188",
    propertyId: "PID-MYS-YEL-4102",
    state: "Karnataka",
    district: "Mysuru",
    taluk: "Mysuru",
    hobli: "Yelwala",
    village: "Yelwala",
    areaInAcres: 1.8,
    landClassification: "Wet Agricultural Land",
    landUse: "Irrigated coconut plantation and cash crops",
    stateProfile: {
      systemName: "Bhoomi & Kaveri 2.0",
      rorLabel: "RTC / Pahani",
      surveyLabel: "Survey No. & Hissa",
      localUnit: "Acres & Guntas (1 Acre 32 Guntas)"
    },
    geoJson: {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [76.5412, 12.3512],
            [76.5448, 12.3512],
            [76.5448, 12.3485],
            [76.5412, 12.3485],
            [76.5412, 12.3512]
          ]
        ]
      },
      properties: {
        label: "Yelwala Survey 88/2B (Mysuru Land Stack Pilot)",
        zoningColor: "#10b981"
      }
    },
    currentOwners: [
      {
        name: "Shivarudrappa M",
        relation: "S/o Mahadevappa",
        sharePercent: 100,
        identifierMasked: "XXXX6619"
      }
    ],
    baseLayer: {
      cadastralSheetNo: "CS-KAR-MYS-YEL-08",
      vertexCount: 4,
      coordinatePrecision: "Survey Settlement & Land Records (±15cm)",
      localAreaUnit: "1 Acre 32 Guntas",
      crs: "EPSG:4326 / WGS84",
      villageGridRef: "Grid-YEL-WEST-01",
      vertices: [
        { pt: 1, lat: 12.3512, lng: 76.5412, marker: "Stone Monolith Y-1" },
        { pt: 2, lat: 12.3512, lng: 76.5448, marker: "Stone Monolith Y-2" },
        { pt: 3, lat: 12.3485, lng: 76.5448, marker: "Canal Peg Y-3" },
        { pt: 4, lat: 12.3485, lng: 76.5412, marker: "Canal Peg Y-4" }
      ]
    },
    essentialLayers: {
      ror: {
        rorNumber: "RTC-MYS-2024-00441",
        issueDate: "2024-06-12",
        holderName: "Shivarudrappa M",
        subDivisionStatus: "Sanctioned",
        landTaxDemandYear: "2025-26",
        revenueCourtDispute: false
      },
      registration: {
        sroOffice: "SRO Mysuru South",
        deedNumber: "KAVERI-MYS-SD-881/2023",
        registrationDate: "2023-09-14",
        stampDutyPaid: "₹ 3,40,000",
        considerationValue: "₹ 68,00,000",
        documentType: "Sale Deed"
      },
      masterPlanZoning: {
        authority: "MUDA (Mysuru Urban Development Authority)",
        zoneCategory: "Agricultural / Green Belt Conservation",
        permissibleFar: 0.5,
        maxCoveragePercent: 20,
        status: "Designated Green Belt"
      },
      buildingPermissions: {
        status: "Exempt (Agricultural Farmhouse Sanctioned)",
        planApprovalNo: "MUDA/AG/2024/112",
        sanctionedHeightMeters: 6,
        setbackViolations: false
      },
      encumbrance: {
        hasMortgage: true,
        lenderName: "Canara Bank, Yelwala Branch",
        mortgageAmount: "₹ 25,00,000",
        chargeType: "Kisan Credit Card (KCC) Crop Loan Hypothecation",
        status: "Active Bank Charge Recorded in RTC Column 11"
      },
      rrrSummary: {
        rights: [
          "Cultivation of perennial horticultural crops",
          "Canal irrigation water drawal rights under KRS command area"
        ],
        restrictions: [
          "Non-agricultural commercial conversion restricted under Green Belt regulation",
          "Tree felling requires Forest Department transit permit"
        ],
        liabilities: [
          "Active Canara Bank Kisan Credit Card hypothecation of ₹ 25 Lakhs",
          "Annual water cess payable to Cauvery Neeravari Nigam Limited (CNNL)"
        ]
      }
    },
    additionalLayers: {
      utilities: {
        waterSupplyLine: "KRS Right Bank Distributary Canal Dist-4",
        powerSubstationDistance: "1.2km from CHESCOM Yelwala Substation (Agricultural Feeder)",
        drainageNetwork: "Natural agricultural surface contour runoff"
      },
      propertyTax: {
        propertyTaxId: "PID-MYS-YEL-4102",
        assessmentYear: "2025-26",
        annualDemand: 4500,
        amountPaid: 4500,
        duesAmount: 0,
        paymentStatus: "Paid"
      },
      valuation: {
        circleRatePerSqFt: 1800,
        guidanceValueTotal: "₹ 1,41,12,000",
        marketEstimateRange: "₹ 1.6 Cr - 1.8 Cr",
        lastRevisionDate: "2024-08-01"
      },
      restrictionZones: {
        isEcoSensitive: false,
        lakeBufferDistanceMeters: 800,
        isWithin30mBuffer: false,
        canalBufferZone: "10m canal protection zone maintained along south boundary"
      }
    },
    aiGeospatial: {
      satelliteChangeDetection: {
        lastSatellitePassDate: "2026-08-15",
        historicalReferenceDate: "2024-02-01",
        anomalyDetected: false,
        anomalyType: "Normal Crop Canopy",
        confidenceScorePercent: 97,
        detectedFootprintChangeSqM: 0,
        aiRecommendation: "Vegetation index (NDVI) confirms healthy coconut canopy; zero unauthorized construction."
      }
    },
    departmentalWorkflows: [
      {
        id: "WF-MYS-01",
        department: "Revenue & Canara Bank",
        title: "Crop Loan Charge Entry in RTC Column 11",
        status: "Recorded",
        applicant: "Canara Bank Yelwala",
        initiatedAt: "2023-10-02",
        completedAt: "2023-10-08",
        remarks: "KCC Charge of ₹25L recorded in Bhoomi",
        txHash: "0x5678901234567890123456789012345678901234567890123456789012345678"
      }
    ],
    authoritativeRecords: {
      rtcNumber: "RTC-MYS-2024-00441",
      rtcLastUpdated: "2024-06-12",
      mutationNumber: "MR-18/2023-24",
      mutationStatus: "Sanctioned and reflected in RTC",
      registrationReference: "KAVERI-MYS-SD-881/2023",
      registrationDate: "2023-09-14",
      encumbranceStatus: "Active crop loan hypothecation noted (Canara Bank ₹ 25 Lakhs)",
      encumbranceCertificateNo: "EC-2024-YEL-0442",
      surveySketchRef: "SK-MYS-YEL-88-2B",
      khataStatus: "Updated",
      disputeStatus: "No dispute noted"
    },
    sourceAvailability: {
      rtc: sourceAvailability("Bhoomi / Revenue Department", "2026-08-15T09:15:00.000Z"),
      mutation: sourceAvailability("Revenue Department", "2026-08-15T09:20:00.000Z"),
      registration: sourceAvailability("Kaveri Registration Demo Adapter", "2026-08-15T09:30:00.000Z"),
      encumbrance: sourceAvailability("Registration Department", "2026-08-15T09:31:00.000Z"),
      survey: sourceAvailability("Survey Settlement and Land Records", "2026-08-15T09:35:00.000Z")
    },
    verificationHint: {
      status: "verified",
      summary: "RTC, Kaveri deed, and Canara Bank hypothecation are reconciled and up to date in Land Stack DPI."
    },
    blockchain: {
      parcelKey: "KAR|Mysuru|Mysuru|Yelwala|Yelwala|88/2|B",
      network: "Sepolia-ready",
      anchorStatus: "demo-ready",
      contractAddress: "0x39a1c890f84a1e94829103847561029384756102",
      lastAnchorTxHash: "0x5678901234567890123456789012345678901234567890123456789012345678",
      lastAnchoredAt: "2023-10-08T12:00:00.000Z"
    },
    qrToken: "scan-kar-mys-0002",
    demoNotes: "Demonstrates rural agricultural parcel with active bank hypothecation and green belt zoning."
  },

  // 5. KARNATAKA PILOT PARCEL 3 (Belagavi - Survey Boundary Mismatch Case)
  {
    parcelId: "KAR-BGM-0003",
    ulpin: "29010200800310",
    surveyNumber: "45/1",
    hissaNumber: "C",
    khataNumber: "KHATA-BGM-902",
    propertyId: "PID-BGM-KAK-1109",
    state: "Karnataka",
    district: "Belagavi",
    taluk: "Belagavi",
    hobli: "Kakati",
    village: "Kakati",
    areaInAcres: 3.1,
    landClassification: "Dry Agricultural Land",
    landUse: "Dry farming with ongoing boundary dispute",
    stateProfile: {
      systemName: "Bhoomi & Kaveri 2.0",
      rorLabel: "RTC / Pahani",
      surveyLabel: "Survey No. & Hissa",
      localUnit: "Acres & Guntas (3 Acres 04 Guntas)"
    },
    geoJson: {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [74.521, 15.918],
            [74.5255, 15.918],
            [74.5255, 15.914],
            [74.521, 15.914],
            [74.521, 15.918]
          ]
        ]
      },
      properties: {
        label: "Kakati Survey 45/1C (Belagavi Land Stack Pilot)",
        zoningColor: "#ef4444"
      }
    },
    currentOwners: [
      {
        name: "Basavaraj Patil",
        relation: "S/o Shrishail Patil",
        sharePercent: 100,
        identifierMasked: "XXXX1190"
      }
    ],
    baseLayer: {
      cadastralSheetNo: "CS-KAR-BGM-KAK-03",
      vertexCount: 4,
      coordinatePrecision: "Survey Discrepancy Flagged (±1.4m)",
      localAreaUnit: "3 Acres 04 Guntas",
      crs: "EPSG:4326 / WGS84",
      villageGridRef: "Grid-KAK-NORTH-08",
      vertices: [
        { pt: 1, lat: 15.918, lng: 74.521, marker: "Disputed Boundary Peg B-1" },
        { pt: 2, lat: 15.918, lng: 74.5255, marker: "Stone Monolith B-2" },
        { pt: 3, lat: 15.914, lng: 74.5255, marker: "Stone Monolith B-3" },
        { pt: 4, lat: 15.914, lng: 74.521, marker: "Disputed Boundary Peg B-4" }
      ]
    },
    essentialLayers: {
      ror: {
        rorNumber: "RTC-BGM-2024-00918",
        issueDate: "2024-02-14",
        holderName: "Basavaraj Patil",
        subDivisionStatus: "Objection Pending before Assistant Commissioner",
        landTaxDemandYear: "2025-26",
        revenueCourtDispute: true
      },
      registration: {
        sroOffice: "SRO Belagavi Rural",
        deedNumber: "KAVERI-BGM-SD-441/2022",
        registrationDate: "2022-11-19",
        stampDutyPaid: "₹ 2,80,000",
        considerationValue: "₹ 56,00,000",
        documentType: "Sale Deed"
      },
      masterPlanZoning: {
        authority: "BUDA (Belagavi Urban Development Authority)",
        zoneCategory: "Agricultural Perimeter",
        permissibleFar: 0.5,
        maxCoveragePercent: 25,
        status: "Agricultural Zone"
      },
      buildingPermissions: {
        status: "Frozen (Revenue Dispute in AC Court)",
        planApprovalNo: "None",
        sanctionedHeightMeters: 0,
        setbackViolations: true
      },
      encumbrance: {
        hasMortgage: false,
        lenderName: "None",
        mortgageAmount: "₹ 0",
        status: "Revenue Court Stay Active (Case #RA-114/2023)"
      },
      rrrSummary: {
        rights: ["Agricultural cultivation pending final boundary demarcation"],
        restrictions: ["Transaction freeze: No alienation or registration permitted during active stay", "Subdivision prohibited"],
        liabilities: ["Pending litigation costs before Assistant Commissioner Court Belagavi"]
      }
    },
    additionalLayers: {
      utilities: {
        waterSupplyLine: "None (Borewell dependent)",
        powerSubstationDistance: "2.5km from HESCOM Kakati Substation",
        drainageNetwork: "Natural drainage"
      },
      propertyTax: {
        propertyTaxId: "PID-BGM-KAK-1109",
        assessmentYear: "2025-26",
        annualDemand: 3200,
        amountPaid: 0,
        duesAmount: 3200,
        paymentStatus: "Overdue"
      },
      valuation: {
        circleRatePerSqFt: 1200,
        guidanceValueTotal: "₹ 1,62,04,800",
        marketEstimateRange: "₹ 1.7 Cr - 1.9 Cr",
        lastRevisionDate: "2024-05-01"
      },
      restrictionZones: {
        isEcoSensitive: false,
        lakeBufferDistanceMeters: 1400,
        isWithin30mBuffer: false,
        disputeFlag: "Boundary overlap dispute with adjacent Survey 45/2"
      }
    },
    aiGeospatial: {
      satelliteChangeDetection: {
        lastSatellitePassDate: "2026-08-11",
        historicalReferenceDate: "2023-11-01",
        anomalyDetected: true,
        anomalyType: "Boundary Overlap Conflict (0.24 Acres)",
        confidenceScorePercent: 91,
        detectedFootprintChangeSqM: 971,
        aiRecommendation: "Cadastral vector overlay reveals 971 sqm polygon overlap with Survey 45/2. Resurvey via electronic total station (ETS) mandated."
      }
    },
    departmentalWorkflows: [
      {
        id: "WF-BGM-01",
        department: "Revenue Court (Assistant Commissioner)",
        title: "Boundary Dispute Case RA-114/2023",
        status: "Stay Active",
        applicant: "Adjacent Owner (Mallikarjun)",
        initiatedAt: "2023-12-05",
        completedAt: null,
        remarks: "Interim injunction staying mutation and registration",
        txHash: "0x1122334455667788990011223344556677889900112233445566778899001122"
      }
    ],
    authoritativeRecords: {
      rtcNumber: "RTC-BGM-2024-00918",
      rtcLastUpdated: "2024-02-14",
      mutationNumber: "MR-31/2022-23",
      mutationStatus: "Challenged in AC Court",
      registrationReference: "KAVERI-BGM-SD-441/2022",
      registrationDate: "2022-11-19",
      encumbranceStatus: "Litigation stay noted",
      encumbranceCertificateNo: "EC-2024-KAK-0012",
      surveySketchRef: "SK-BGM-KAK-45-1C",
      khataStatus: "Under Review",
      disputeStatus: "Active civil appeal in Assistant Commissioner Court"
    },
    sourceAvailability: {
      rtc: sourceAvailability("Bhoomi / Revenue Department", "2026-08-15T09:15:00.000Z"),
      mutation: sourceAvailability("Revenue Department", "2026-08-15T09:20:00.000Z"),
      registration: sourceAvailability("Kaveri Registration Demo Adapter", "2026-08-15T09:30:00.000Z"),
      encumbrance: sourceAvailability("Registration Department", "2026-08-15T09:31:00.000Z"),
      survey: sourceAvailability("Survey Settlement and Land Records", "2026-08-15T09:35:00.000Z")
    },
    verificationHint: {
      status: "mismatch",
      summary: "Boundary dispute flag: 971 sqm boundary overlap with Survey 45/2 identified in Land Stack GIS layer."
    },
    blockchain: {
      parcelKey: "KAR|Belagavi|Belagavi|Kakati|Kakati|45/1|C",
      network: "Sepolia-ready",
      anchorStatus: "demo-ready",
      contractAddress: "0x39a1c890f84a1e94829103847561029384756102",
      lastAnchorTxHash: "0x1122334455667788990011223344556677889900112233445566778899001122",
      lastAnchoredAt: "2023-12-05T09:00:00.000Z"
    },
    qrToken: "scan-kar-bgm-0003",
    demoNotes: "Demonstrates automated conflict detection: boundary overlap between cadastral maps and physical possession."
  }
];

export const demoDocuments = [
  // Tamil Nadu Documents
  {
    parcelId: "TN-KPM-0001",
    documentType: "PATTA_CHITTA",
    title: "Official Patta / Chitta Extract",
    fileName: "patta-kpm-5510.pdf",
    storageType: "demo",
    storageUri: "ipfs://demo/tn-kpm-0001/patta",
    sha256Hash: "6c459810fba08821948571029384756102938475610293847561029384756101",
    hashAnchored: true,
    blockchainTxHash: "0x7a83b194f1837a28e991cd4a8731b99210948ac0192837482910384729103847",
    verificationStatus: "matched",
    metadata: {
      issuingAuthority: "Revenue & Land Administration, Tamil Nadu",
      issueDate: "2024-03-15",
      recordReference: "PATTA-KPM-5510",
      authoritative: false,
      integrationMode: "demo"
    }
  },
  {
    parcelId: "TN-KPM-0001",
    documentType: "REGISTERED_DEED",
    title: "Registered Industrial Sale Deed",
    fileName: "tnreginet-sale-deed-3109.pdf",
    storageType: "demo",
    storageUri: "ipfs://demo/tn-kpm-0001/sale-deed",
    sha256Hash: "8b19283746519283746519283746519283746519283746519283746519283742",
    hashAnchored: true,
    blockchainTxHash: "0x5c90e21938ab0192847120394857102938475610293847561029384756102938",
    verificationStatus: "matched",
    metadata: {
      issuingAuthority: "TNREGINET / SRO Sriperumbudur",
      issueDate: "2024-04-10",
      recordReference: "DOC-2024-SPB-3109",
      authoritative: false,
      integrationMode: "demo"
    }
  },
  {
    parcelId: "TN-KPM-0001",
    documentType: "ENCUMBRANCE_CERTIFICATE",
    title: "IOB Bank Mortgage Charge Note",
    fileName: "iob-mortgage-memo.pdf",
    storageType: "demo",
    storageUri: "ipfs://demo/tn-kpm-0001/mortgage",
    sha256Hash: "3f90192837465192837465192837465192837465192837465192837465192833",
    hashAnchored: true,
    blockchainTxHash: "0x3d91029384756102938475610293847561029384756102938475610293847561",
    verificationStatus: "matched",
    metadata: {
      issuingAuthority: "Indian Overseas Bank & SRO Sriperumbudur",
      issueDate: "2024-08-01",
      recordReference: "EC-TN-2024-SPB-8812",
      authoritative: false,
      integrationMode: "demo"
    }
  },

  // Chandigarh Documents
  {
    parcelId: "CHD-UT-0001",
    documentType: "UPR_RECORD",
    title: "Urban Property Record (UPR) Deed",
    fileName: "chd-estate-sco-84-85.pdf",
    storageType: "demo",
    storageUri: "ipfs://demo/chd-ut-0001/upr",
    sha256Hash: "1928374651928374651928374651928374651928374651928374651928374654",
    hashAnchored: true,
    blockchainTxHash: "0x892a019485710293847561029384756102938475610293847561029384756102",
    verificationStatus: "matched",
    metadata: {
      issuingAuthority: "Estate Office, Chandigarh Administration",
      issueDate: "2023-11-20",
      recordReference: "UPR-CHD-SEC17-084",
      authoritative: false,
      integrationMode: "demo"
    }
  },
  {
    parcelId: "CHD-UT-0001",
    documentType: "HERITAGE_NOC",
    title: "Corbusier Heritage Visual Charter NOC",
    fileName: "chd-heritage-noc-8819.pdf",
    storageType: "demo",
    storageUri: "ipfs://demo/chd-ut-0001/heritage-noc",
    sha256Hash: "9283746519283746519283746519283746519283746519283746519283746515",
    hashAnchored: true,
    blockchainTxHash: "0x2341908273645192837465192837465192837465192837465192837465192837",
    verificationStatus: "matched",
    metadata: {
      issuingAuthority: "Department of Urban Planning, Chandigarh",
      issueDate: "2023-12-04",
      recordReference: "CHD-MC-BP-8819",
      authoritative: false,
      integrationMode: "demo"
    }
  },

  // Karnataka Documents
  {
    parcelId: "KAR-BLRU-0001",
    documentType: "RTC",
    title: "Bhoomi Digital RTC Record",
    fileName: "rtc-avalahalli-123-4a.pdf",
    storageType: "demo",
    storageUri: "ipfs://demo/kar-blru-0001/rtc",
    sha256Hash: "3f79a957b9890a9cf112a95c37021469e32ef748b6c4eb89547d21b369c01001",
    hashAnchored: true,
    blockchainTxHash: "0x9d11019283746519283746519283746519283746519283746519283746519283",
    verificationStatus: "matched",
    metadata: {
      issuingAuthority: "Revenue Department, Karnataka",
      issueDate: "2024-07-08",
      recordReference: "RTC-BEU-2024-00119",
      authoritative: false,
      integrationMode: "demo"
    }
  },
  {
    parcelId: "KAR-BLRU-0001",
    documentType: "REGISTERED_DEED",
    title: "Registered Partition Deed",
    fileName: "partition-deed-1908-2024.pdf",
    storageType: "demo",
    storageUri: "ipfs://demo/kar-blru-0001/deed",
    sha256Hash: "b851cdff81bc37b52125bb15291f973302bc112520bb291a18295b9d3e8a1002",
    hashAnchored: true,
    blockchainTxHash: "0x1293847561029384756102938475610293847561029384756102938475610293",
    verificationStatus: "matched",
    metadata: {
      issuingAuthority: "Registration Department, Karnataka",
      issueDate: "2024-05-22",
      recordReference: "KAVERI-BEU-SD-1908/2024",
      authoritative: false,
      integrationMode: "demo"
    }
  },
  {
    parcelId: "KAR-MYS-0002",
    documentType: "RTC",
    title: "Bhoomi Digital RTC Record",
    fileName: "rtc-yelwala-88-2b.pdf",
    storageType: "demo",
    storageUri: "ipfs://demo/kar-mys-0002/rtc",
    sha256Hash: "6c20847385918274651928374651928374651928374651928374651928374657",
    hashAnchored: true,
    blockchainTxHash: "0x5678901234567890123456789012345678901234567890123456789012345678",
    verificationStatus: "matched",
    metadata: {
      issuingAuthority: "Revenue Department, Karnataka",
      issueDate: "2024-06-12",
      recordReference: "RTC-MYS-2024-00441",
      authoritative: false,
      integrationMode: "demo"
    }
  },
  {
    parcelId: "KAR-BGM-0003",
    documentType: "COURT_ORDER",
    title: "Mutation Objection & Stay Order Note",
    fileName: "mutation-objection-note.pdf",
    storageType: "demo",
    storageUri: "ipfs://demo/kar-bgm-0003/court-note",
    sha256Hash: "4930ed5a572e38087fa07875f94966e9927ec5e165cd512602d5c0ddadba3003",
    hashAnchored: false,
    blockchainTxHash: "",
    verificationStatus: "pending",
    metadata: {
      issuingAuthority: "Assistant Commissioner Revenue Court, Belagavi",
      issueDate: "2023-12-05",
      recordReference: "OBJ-MR-09/2023-24",
      authoritative: false,
      integrationMode: "demo"
    }
  }
];

export const demoOwnershipEvents = [
  {
    parcelId: "TN-KPM-0001",
    eventDate: "2024-04-10",
    eventType: "SALE_DEED_REGISTERED",
    summary: "Sale Deed Registered at SRO Sriperumbudur in favour of Senthil Kumar V for ₹ 96 Lakhs. Patta updated via auto-mutation in Tamil Nilam.",
    owners: [
      {
        name: "Senthil Kumar V",
        relation: "S/o Varadarajan",
        sharePercent: 100,
        identifierMasked: "XXXX9182"
      }
    ],
    registrationNumber: "DOC-2024-SPB-3109",
    sourceAuthority: { department: "TNREGINET / Revenue", sro: "Sriperumbudur" },
    blockchainTxHash: "0x5c90e21938ab0192847120394857102938475610293847561029384756102938",
    anchorMode: "demo"
  },
  {
    parcelId: "TN-KPM-0001",
    eventDate: "2024-08-01",
    eventType: "ENCUMBRANCE_UPDATED",
    summary: "Equitable mortgage of ₹ 1.50 Cr created in favour of Indian Overseas Bank for industrial facility financing.",
    owners: [
      {
        name: "Senthil Kumar V",
        relation: "S/o Varadarajan",
        sharePercent: 100,
        identifierMasked: "XXXX9182"
      }
    ],
    documentReference: "EC-TN-2024-SPB-8812",
    sourceAuthority: { department: "Registration Department & IOB Bank" },
    blockchainTxHash: "0x3d91029384756102938475610293847561029384756102938475610293847561",
    anchorMode: "demo"
  },
  {
    parcelId: "CHD-UT-0001",
    eventDate: "2023-10-18",
    eventType: "SALE_DEED_REGISTERED",
    summary: "Sub-Registrar UT Chandigarh registered commercial freehold deed for SCO 84-85 Sector 17-C.",
    owners: [
      {
        name: "Gurpreet Singh Dhillon",
        relation: "S/o Balwant Singh Dhillon",
        sharePercent: 60,
        identifierMasked: "XXXX5512"
      },
      {
        name: "Simran Kaur Dhillon",
        relation: "W/o Gurpreet Singh Dhillon",
        sharePercent: 40,
        identifierMasked: "XXXX7709"
      }
    ],
    registrationNumber: "REG-CHD-2023-1992",
    sourceAuthority: { department: "Sub-Registrar UT Chandigarh" },
    blockchainTxHash: "0x892a019485710293847561029384756102938475610293847561029384756102",
    anchorMode: "demo"
  },
  {
    parcelId: "KAR-BLRU-0001",
    eventDate: "2024-05-22",
    eventType: "SALE_DEED_REGISTERED",
    summary: "Registered partition between Lakshmamma N and Raghavendra N.",
    owners: [
      {
        name: "Lakshmamma N",
        relation: "D/o Narayanappa",
        sharePercent: 50,
        identifierMasked: "XXXX2341"
      },
      {
        name: "Raghavendra N",
        relation: "S/o Narayanappa",
        sharePercent: 50,
        identifierMasked: "XXXX7782"
      }
    ],
    registrationNumber: "KAVERI-BEU-SD-1908/2024",
    sourceAuthority: { department: "Kaveri Registration" },
    blockchainTxHash: "0x1293847561029384756102938475610293847561029384756102938475610293",
    anchorMode: "demo"
  },
  {
    parcelId: "KAR-BLRU-0001",
    eventDate: "2024-07-08",
    eventType: "MUTATION_SANCTIONED",
    summary: "Inheritance Mutation MR-42/2024-25 sanctioned and reflected in digital RTC.",
    owners: [
      {
        name: "Lakshmamma N",
        relation: "D/o Narayanappa",
        sharePercent: 50,
        identifierMasked: "XXXX2341"
      },
      {
        name: "Raghavendra N",
        relation: "S/o Narayanappa",
        sharePercent: 50,
        identifierMasked: "XXXX7782"
      }
    ],
    mutationNumber: "MR-42/2024-25",
    sourceAuthority: { department: "Bhoomi Revenue" },
    blockchainTxHash: "0x9d11019283746519283746519283746519283746519283746519283746519283",
    anchorMode: "demo"
  },
  {
    parcelId: "KAR-MYS-0002",
    eventDate: "2023-10-08",
    eventType: "ENCUMBRANCE_UPDATED",
    summary: "Kisan Credit Card hypothecation charge entered in RTC Column 11 for ₹ 25 Lakhs.",
    owners: [
      {
        name: "Shivarudrappa M",
        relation: "S/o Mahadevappa",
        sharePercent: 100,
        identifierMasked: "XXXX6619"
      }
    ],
    documentReference: "EC-2024-YEL-0442",
    sourceAuthority: { department: "Revenue Department & Canara Bank" },
    blockchainTxHash: "0x5678901234567890123456789012345678901234567890123456789012345678",
    anchorMode: "demo"
  }
];

export const demoUsers = [
  {
    name: "National DPI Administrator",
    email: "admin@landstack.gov.in",
    role: "admin",
    department: "Department of Land Resources (DoLR), MoRD",
    passwordHash: "",
    lastLoginAt: "2026-08-20T09:45:00.000Z"
  },
  {
    name: "Tamil Nadu Revenue Officer",
    email: "tehsildar@tamilnilam.tn.gov.in",
    role: "verifier",
    department: "Revenue & Disaster Management, Tamil Nadu",
    passwordHash: "",
    lastLoginAt: "2026-08-20T10:10:00.000Z"
  },
  {
    name: "Chandigarh Estate Officer",
    email: "estate@chd.gov.in",
    role: "verifier",
    department: "Estate Office, Chandigarh Administration",
    passwordHash: "",
    lastLoginAt: "2026-08-20T10:15:00.000Z"
  }
];
