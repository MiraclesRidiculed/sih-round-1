const sourceAvailability = (department, lastSyncedAt) => ({
  department,
  integrationMode: "demo",
  authoritative: false,
  lastSyncedAt
});

export const demoParcels = [
  {
    parcelId: "KAR-BLRU-0001",
    ulpin: "DEMO-ULPIN-0001",
    surveyNumber: "123/4",
    hissaNumber: "A",
    khataNumber: "KHATA-BEU-24019",
    propertyId: "PID-BEU-AVA-9001",
    district: "Bengaluru Urban",
    taluk: "Bengaluru East",
    hobli: "Bidarahalli",
    village: "Avalahalli",
    areaInAcres: 2.35,
    landClassification: "Dry agricultural land",
    landUse: "Agricultural parcel with conversion application noted",
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
        label: "Avalahalli Survey 123/4A"
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
      status: "verified",
      summary: "RTC, mutation, ownership history, and document hashes are internally consistent in seeded data."
    },
    blockchain: {
      parcelKey: "KAR|Bengaluru Urban|Bengaluru East|Bidarahalli|Avalahalli|123/4|A",
      network: "Sepolia-ready",
      anchorStatus: "demo-ready",
      contractAddress: "",
      lastAnchorTxHash: "",
      lastAnchoredAt: null
    },
    qrToken: "scan-kar-blru-0001",
    demoNotes:
      "Seeded Karnataka parcel representing a clean and internally consistent verification case."
  },
  {
    parcelId: "KAR-MYS-0002",
    ulpin: "",
    surveyNumber: "88/2",
    hissaNumber: "B",
    khataNumber: "KHATA-MYS-1188",
    propertyId: "PID-MYS-YEL-4102",
    district: "Mysuru",
    taluk: "Mysuru",
    hobli: "Yelwala",
    village: "Hinkal",
    areaInAcres: 1.82,
    landClassification: "Wet agricultural land",
    landUse: "Cultivated agricultural parcel",
    geoJson: {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [76.6055, 12.3394],
            [76.6086, 12.3394],
            [76.6086, 12.3372],
            [76.6055, 12.3372],
            [76.6055, 12.3394]
          ]
        ]
      },
      properties: {
        label: "Hinkal Survey 88/2B"
      }
    },
    currentOwners: [
      {
        name: "Savithriamma M",
        relation: "W/o Mahadevappa",
        sharePercent: 100,
        identifierMasked: "XXXX4129"
      }
    ],
    authoritativeRecords: {
      rtcNumber: "RTC-MYS-2025-1188",
      rtcLastUpdated: "2025-02-11",
      mutationNumber: "MR-11/2025-26",
      mutationStatus: "Pending reflection after recent registration",
      registrationReference: "KAVERI-MYS-SD-431/2025",
      registrationDate: "2025-01-23",
      encumbranceStatus: "Agricultural crop loan entry active",
      encumbranceCertificateNo: "EC-2025-HK-021",
      surveySketchRef: "SK-MYS-YEL-88-2B",
      khataStatus: "Legacy khata retained",
      disputeStatus: "No court dispute in demo feed"
    },
    sourceAvailability: {
      rtc: sourceAvailability("Bhoomi / Revenue Department", "2026-08-12T10:00:00.000Z"),
      mutation: sourceAvailability("Revenue Department", "2026-08-12T10:03:00.000Z"),
      registration: sourceAvailability("Kaveri Registration Demo Adapter", "2026-08-12T10:10:00.000Z"),
      encumbrance: sourceAvailability("Registration Department", "2026-08-12T10:12:00.000Z"),
      survey: sourceAvailability("Survey Settlement and Land Records", "2026-08-12T10:15:00.000Z")
    },
    verificationHint: {
      status: "attention",
      summary: "Registration has updated faster than RTC and one supporting document is still awaiting chain anchoring."
    },
    blockchain: {
      parcelKey: "KAR|Mysuru|Mysuru|Yelwala|Hinkal|88/2|B",
      network: "Sepolia-ready",
      anchorStatus: "partially-anchored-demo",
      contractAddress: "",
      lastAnchorTxHash: "",
      lastAnchoredAt: null
    },
    qrToken: "scan-kar-mys-0002",
    demoNotes:
      "Seeded Karnataka parcel representing a realistic attention case with a pending mutation reflection and active encumbrance."
  },
  {
    parcelId: "KAR-BGM-0003",
    ulpin: "DEMO-ULPIN-0003",
    surveyNumber: "41/7",
    hissaNumber: "C",
    khataNumber: "KHATA-BGM-771",
    propertyId: "PID-BGM-HUK-7710",
    district: "Belagavi",
    taluk: "Hukkeri",
    hobli: "Sankeshwar",
    village: "Yamakanmardi",
    areaInAcres: 3.1,
    landClassification: "Dry land",
    landUse: "Agricultural parcel with disputed transfer note",
    geoJson: {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [74.5183, 16.2565],
            [74.5221, 16.2565],
            [74.5221, 16.2539],
            [74.5183, 16.2539],
            [74.5183, 16.2565]
          ]
        ]
      },
      properties: {
        label: "Yamakanmardi Survey 41/7C"
      }
    },
    currentOwners: [
      {
        name: "Mallappa G Patil",
        relation: "S/o Gurappa Patil",
        sharePercent: 100,
        identifierMasked: "XXXX9044"
      }
    ],
    authoritativeRecords: {
      rtcNumber: "RTC-BGM-2023-771",
      rtcLastUpdated: "2023-11-18",
      mutationNumber: "MR-09/2024-25",
      mutationStatus: "Pending and objected",
      registrationReference: "KAVERI-HUK-SD-992/2024",
      registrationDate: "2024-09-02",
      encumbranceStatus: "Recent sale deed present but RTC not aligned",
      encumbranceCertificateNo: "EC-2024-YM-114",
      surveySketchRef: "SK-BGM-HUK-41-7C",
      khataStatus: "Not updated",
      disputeStatus: "Objection noted in mutation remarks"
    },
    sourceAvailability: {
      rtc: sourceAvailability("Bhoomi / Revenue Department", "2026-08-10T08:00:00.000Z"),
      mutation: sourceAvailability("Revenue Department", "2026-08-10T08:05:00.000Z"),
      registration: sourceAvailability("Kaveri Registration Demo Adapter", "2026-08-10T08:12:00.000Z"),
      encumbrance: sourceAvailability("Registration Department", "2026-08-10T08:13:00.000Z"),
      survey: sourceAvailability("Survey Settlement and Land Records", "2026-08-10T08:20:00.000Z")
    },
    verificationHint: {
      status: "mismatch",
      summary: "Latest registration and mutation trail do not align with the RTC holder reflected in current parcel state."
    },
    blockchain: {
      parcelKey: "KAR|Belagavi|Hukkeri|Sankeshwar|Yamakanmardi|41/7|C",
      network: "Sepolia-ready",
      anchorStatus: "mismatch-demo",
      contractAddress: "",
      lastAnchorTxHash: "",
      lastAnchoredAt: null
    },
    qrToken: "scan-kar-bgm-0003",
    demoNotes:
      "Seeded Karnataka parcel representing a mismatch case with pending objection and lagging RTC reflection."
  }
];

export const demoOwnershipEvents = [
  {
    parcelId: "KAR-BLRU-0001",
    eventDate: "2010-06-18",
    eventType: "INHERITANCE",
    owners: [
      { name: "Lakshmamma N", relation: "D/o Narayanappa", sharePercent: 50, identifierMasked: "XXXX2341" },
      { name: "Raghavendra N", relation: "S/o Narayanappa", sharePercent: 50, identifierMasked: "XXXX7782" }
    ],
    sourceAuthority: {
      department: "Revenue Department",
      recordType: "Mutation inheritance entry",
      authoritative: false,
      integrationMode: "demo",
      referenceNumber: "MR-129/2010-11"
    },
    summary: "Inheritance entry divided the parcel equally between Lakshmamma N and Raghavendra N.",
    mutationNumber: "MR-129/2010-11",
    registrationNumber: "",
    documentReference: "MUT-BLRU-0001",
    blockchainTxHash: "",
    anchorMode: "demo"
  },
  {
    parcelId: "KAR-BLRU-0001",
    eventDate: "2024-05-22",
    eventType: "SALE_DEED_REGISTERED",
    owners: [
      { name: "Lakshmamma N", relation: "D/o Narayanappa", sharePercent: 50, identifierMasked: "XXXX2341" },
      { name: "Raghavendra N", relation: "S/o Narayanappa", sharePercent: 50, identifierMasked: "XXXX7782" }
    ],
    sourceAuthority: {
      department: "Registration Department",
      recordType: "Sale deed confirmation",
      authoritative: false,
      integrationMode: "demo",
      referenceNumber: "KAVERI-BEU-SD-1908/2024"
    },
    summary: "Sale deed metadata confirms the same current owners and parcel boundaries for the seeded parcel.",
    mutationNumber: "MR-42/2024-25",
    registrationNumber: "KAVERI-BEU-SD-1908/2024",
    documentReference: "SALE-BLRU-0001",
    blockchainTxHash: "",
    anchorMode: "demo"
  },
  {
    parcelId: "KAR-MYS-0002",
    eventDate: "2018-09-14",
    eventType: "INHERITANCE",
    owners: [
      { name: "Savithriamma M", relation: "W/o Mahadevappa", sharePercent: 100, identifierMasked: "XXXX4129" }
    ],
    sourceAuthority: {
      department: "Revenue Department",
      recordType: "RTC inheritance reflection",
      authoritative: false,
      integrationMode: "demo",
      referenceNumber: "MR-88/2018-19"
    },
    summary: "Parcel reflected in the seeded RTC under Savithriamma M after inheritance.",
    mutationNumber: "MR-88/2018-19",
    registrationNumber: "",
    documentReference: "RTC-MYS-0002",
    blockchainTxHash: "",
    anchorMode: "demo"
  },
  {
    parcelId: "KAR-MYS-0002",
    eventDate: "2025-01-23",
    eventType: "SALE_DEED_REGISTERED",
    owners: [
      { name: "Savithriamma M", relation: "W/o Mahadevappa", sharePercent: 100, identifierMasked: "XXXX4129" }
    ],
    sourceAuthority: {
      department: "Registration Department",
      recordType: "Registered deed",
      authoritative: false,
      integrationMode: "demo",
      referenceNumber: "KAVERI-MYS-SD-431/2025"
    },
    summary: "Registered deed is available in demo data, but the mutation reflection remains pending in RTC notes.",
    mutationNumber: "MR-11/2025-26",
    registrationNumber: "KAVERI-MYS-SD-431/2025",
    documentReference: "SALE-MYS-0002",
    blockchainTxHash: "",
    anchorMode: "pending"
  },
  {
    parcelId: "KAR-MYS-0002",
    eventDate: "2025-02-02",
    eventType: "ENCUMBRANCE_UPDATED",
    owners: [
      { name: "Savithriamma M", relation: "W/o Mahadevappa", sharePercent: 100, identifierMasked: "XXXX4129" }
    ],
    sourceAuthority: {
      department: "Registration Department",
      recordType: "Encumbrance certificate",
      authoritative: false,
      integrationMode: "demo",
      referenceNumber: "EC-2025-HK-021"
    },
    summary: "Crop loan entry appears in the seeded encumbrance certificate summary.",
    mutationNumber: "",
    registrationNumber: "",
    documentReference: "EC-MYS-0002",
    blockchainTxHash: "",
    anchorMode: "demo"
  },
  {
    parcelId: "KAR-BGM-0003",
    eventDate: "2023-11-18",
    eventType: "RTC_ENTRY",
    owners: [
      { name: "Mallappa G Patil", relation: "S/o Gurappa Patil", sharePercent: 100, identifierMasked: "XXXX9044" }
    ],
    sourceAuthority: {
      department: "Revenue Department",
      recordType: "RTC current holder entry",
      authoritative: false,
      integrationMode: "demo",
      referenceNumber: "RTC-BGM-2023-771"
    },
    summary: "Current RTC still shows Mallappa G Patil as holder in seeded data.",
    mutationNumber: "",
    registrationNumber: "",
    documentReference: "RTC-BGM-0003",
    blockchainTxHash: "",
    anchorMode: "demo"
  },
  {
    parcelId: "KAR-BGM-0003",
    eventDate: "2024-09-02",
    eventType: "SALE_DEED_REGISTERED",
    owners: [
      { name: "Prakash S Khot", relation: "S/o Shankar Khot", sharePercent: 100, identifierMasked: "XXXX1184" }
    ],
    sourceAuthority: {
      department: "Registration Department",
      recordType: "Registered sale deed",
      authoritative: false,
      integrationMode: "demo",
      referenceNumber: "KAVERI-HUK-SD-992/2024"
    },
    summary: "Registered deed points to a different transferee, but mutation objection has blocked full reflection in RTC.",
    mutationNumber: "MR-09/2024-25",
    registrationNumber: "KAVERI-HUK-SD-992/2024",
    documentReference: "SALE-BGM-0003",
    blockchainTxHash: "",
    anchorMode: "demo"
  },
  {
    parcelId: "KAR-BGM-0003",
    eventDate: "2024-10-10",
    eventType: "COURT_NOTE",
    owners: [
      { name: "Mallappa G Patil", relation: "S/o Gurappa Patil", sharePercent: 100, identifierMasked: "XXXX9044" }
    ],
    sourceAuthority: {
      department: "Revenue Department",
      recordType: "Mutation objection note",
      authoritative: false,
      integrationMode: "demo",
      referenceNumber: "OBJ-MR-09/2024-25"
    },
    summary: "Mutation objection note indicates the registered transfer is contested in demo data.",
    mutationNumber: "MR-09/2024-25",
    registrationNumber: "",
    documentReference: "COURT-BGM-0003",
    blockchainTxHash: "",
    anchorMode: "demo"
  }
];

export const demoDocuments = [
  {
    parcelId: "KAR-BLRU-0001",
    documentType: "RTC",
    title: "RTC Extract - Avalahalli 123/4A",
    fileName: "rtc-avalahalli-123-4A.pdf",
    storageType: "demo",
    storageUri: "ipfs://demo/kar-blru-0001/rtc",
    sha256Hash: "3b2c0b886cf2749d3aa1bbef8b1c7c2dbf7b8f65d1ea57c279b15e8f9e321001",
    hashAnchored: true,
    blockchainTxHash: "0x7e97998091f8a0d8111b0da5d1e34233bb17b73737d6f0c3477d3c0297fa0001",
    verificationStatus: "matched",
    metadata: {
      issuingAuthority: "Revenue Department",
      issueDate: "2024-07-08",
      recordReference: "RTC-BEU-2024-00119",
      authoritative: false,
      integrationMode: "demo"
    }
  },
  {
    parcelId: "KAR-BLRU-0001",
    documentType: "MUTATION_ORDER",
    title: "Mutation Order - MR-42/2024-25",
    fileName: "mutation-order-mr-42-2024-25.pdf",
    storageType: "demo",
    storageUri: "ipfs://demo/kar-blru-0001/mutation",
    sha256Hash: "5f17ee06cad5b995ca1778c276daf7d6721a63a7d73a6cb739665289fd541002",
    hashAnchored: true,
    blockchainTxHash: "0x7e97998091f8a0d8111b0da5d1e34233bb17b73737d6f0c3477d3c0297fa0002",
    verificationStatus: "matched",
    metadata: {
      issuingAuthority: "Revenue Department",
      issueDate: "2024-06-01",
      recordReference: "MR-42/2024-25",
      authoritative: false,
      integrationMode: "demo"
    }
  },
  {
    parcelId: "KAR-BLRU-0001",
    documentType: "SALE_DEED",
    title: "Registered Sale Deed Metadata",
    fileName: "sale-deed-kaveri-1908-2024.pdf",
    storageType: "demo",
    storageUri: "ipfs://demo/kar-blru-0001/sale-deed",
    sha256Hash: "8839f71e7f078d8fd10ec5de4a555be72d8d6cbf9d8f7990c6a3bfed4ddf1003",
    hashAnchored: true,
    blockchainTxHash: "0x7e97998091f8a0d8111b0da5d1e34233bb17b73737d6f0c3477d3c0297fa0003",
    verificationStatus: "matched",
    metadata: {
      issuingAuthority: "Registration Department",
      issueDate: "2024-05-22",
      recordReference: "KAVERI-BEU-SD-1908/2024",
      authoritative: false,
      integrationMode: "demo"
    }
  },
  {
    parcelId: "KAR-BLRU-0001",
    documentType: "ENCUMBRANCE_CERTIFICATE",
    title: "Encumbrance Certificate Summary",
    fileName: "ec-avalahalli-ec-2024-av-0091.pdf",
    storageType: "demo",
    storageUri: "ipfs://demo/kar-blru-0001/ec",
    sha256Hash: "8ca9f935a65192baf2c1db1ce53a94484bc269c89e295f0f4c4209f9c8831004",
    hashAnchored: true,
    blockchainTxHash: "0x7e97998091f8a0d8111b0da5d1e34233bb17b73737d6f0c3477d3c0297fa0004",
    verificationStatus: "matched",
    metadata: {
      issuingAuthority: "Registration Department",
      issueDate: "2024-07-09",
      recordReference: "EC-2024-AV-0091",
      authoritative: false,
      integrationMode: "demo"
    }
  },
  {
    parcelId: "KAR-BLRU-0001",
    documentType: "SURVEY_SKETCH",
    title: "Survey Sketch - 123/4A",
    fileName: "survey-sketch-123-4A.pdf",
    storageType: "demo",
    storageUri: "ipfs://demo/kar-blru-0001/survey-sketch",
    sha256Hash: "a6915d5f59aa97da0aef3f4a9835e04d0bb9dbeef1a88930f26b14e2058b1005",
    hashAnchored: true,
    blockchainTxHash: "0x7e97998091f8a0d8111b0da5d1e34233bb17b73737d6f0c3477d3c0297fa0005",
    verificationStatus: "matched",
    metadata: {
      issuingAuthority: "Survey Settlement and Land Records",
      issueDate: "2024-04-17",
      recordReference: "SK-BLRU-BID-123-4A",
      authoritative: false,
      integrationMode: "demo"
    }
  },
  {
    parcelId: "KAR-MYS-0002",
    documentType: "RTC",
    title: "RTC Extract - Hinkal 88/2B",
    fileName: "rtc-hinkal-88-2B.pdf",
    storageType: "demo",
    storageUri: "ipfs://demo/kar-mys-0002/rtc",
    sha256Hash: "e1a05f37bc0f3d701343a4f1625f97a130118bce66d03df09b67c15c27ba2001",
    hashAnchored: true,
    blockchainTxHash: "0x6152b857a4a8efb57e51cad79ca9fcb9edb7ed11bbec66338cd91d58b9d52001",
    verificationStatus: "matched",
    metadata: {
      issuingAuthority: "Revenue Department",
      issueDate: "2025-02-11",
      recordReference: "RTC-MYS-2025-1188",
      authoritative: false,
      integrationMode: "demo"
    }
  },
  {
    parcelId: "KAR-MYS-0002",
    documentType: "SALE_DEED",
    title: "Registered Sale Deed Metadata",
    fileName: "sale-deed-mysuru-431-2025.pdf",
    storageType: "demo",
    storageUri: "ipfs://demo/kar-mys-0002/sale-deed",
    sha256Hash: "1ab74a07ca8e9800f5a6d2a2b87dc390bd8a6981ddc7e548e63cb7fdc8a02002",
    hashAnchored: false,
    blockchainTxHash: "",
    verificationStatus: "not-anchored",
    metadata: {
      issuingAuthority: "Registration Department",
      issueDate: "2025-01-23",
      recordReference: "KAVERI-MYS-SD-431/2025",
      authoritative: false,
      integrationMode: "demo"
    }
  },
  {
    parcelId: "KAR-MYS-0002",
    documentType: "ENCUMBRANCE_CERTIFICATE",
    title: "Encumbrance Certificate - Crop Loan",
    fileName: "ec-hinkal-crop-loan.pdf",
    storageType: "demo",
    storageUri: "ipfs://demo/kar-mys-0002/ec",
    sha256Hash: "4feae8a4f11ee8f6d570ef4b8c8d5d1d7358cc1eaf3745abf46a4b2d6be22003",
    hashAnchored: true,
    blockchainTxHash: "0x6152b857a4a8efb57e51cad79ca9fcb9edb7ed11bbec66338cd91d58b9d52003",
    verificationStatus: "matched",
    metadata: {
      issuingAuthority: "Registration Department",
      issueDate: "2025-02-02",
      recordReference: "EC-2025-HK-021",
      authoritative: false,
      integrationMode: "demo"
    }
  },
  {
    parcelId: "KAR-MYS-0002",
    documentType: "SURVEY_SKETCH",
    title: "Survey Sketch - 88/2B",
    fileName: "survey-sketch-88-2B.pdf",
    storageType: "demo",
    storageUri: "ipfs://demo/kar-mys-0002/survey-sketch",
    sha256Hash: "a5e1935993c3951267bf48f4407f0c1cb0dce4bc8f7b5fdcf0120f4c15f22004",
    hashAnchored: true,
    blockchainTxHash: "0x6152b857a4a8efb57e51cad79ca9fcb9edb7ed11bbec66338cd91d58b9d52004",
    verificationStatus: "matched",
    metadata: {
      issuingAuthority: "Survey Settlement and Land Records",
      issueDate: "2024-12-28",
      recordReference: "SK-MYS-YEL-88-2B",
      authoritative: false,
      integrationMode: "demo"
    }
  },
  {
    parcelId: "KAR-BGM-0003",
    documentType: "RTC",
    title: "RTC Extract - Yamakanmardi 41/7C",
    fileName: "rtc-yamakanmardi-41-7C.pdf",
    storageType: "demo",
    storageUri: "ipfs://demo/kar-bgm-0003/rtc",
    sha256Hash: "7c89e8a8d3c4db814b4eaa7843fc1d861e80fa964a4807edb654b9210fcb3001",
    hashAnchored: true,
    blockchainTxHash: "0x8c20eea0f1bc091bb2fd0fa7ed19a9948bb1c7ca8b24fca539194d9eb5f83001",
    verificationStatus: "matched",
    metadata: {
      issuingAuthority: "Revenue Department",
      issueDate: "2023-11-18",
      recordReference: "RTC-BGM-2023-771",
      authoritative: false,
      integrationMode: "demo"
    }
  },
  {
    parcelId: "KAR-BGM-0003",
    documentType: "SALE_DEED",
    title: "Registered Sale Deed Metadata",
    fileName: "sale-deed-hukkeri-992-2024.pdf",
    storageType: "demo",
    storageUri: "ipfs://demo/kar-bgm-0003/sale-deed",
    sha256Hash: "26190f91595b6474db9a4d6faf0e9486cf69446d0ef9c3f74c6d2d26a3c43002",
    hashAnchored: true,
    blockchainTxHash: "0x8c20eea0f1bc091bb2fd0fa7ed19a9948bb1c7ca8b24fca539194d9eb5f83002",
    verificationStatus: "matched",
    metadata: {
      issuingAuthority: "Registration Department",
      issueDate: "2024-09-02",
      recordReference: "KAVERI-HUK-SD-992/2024",
      authoritative: false,
      integrationMode: "demo"
    }
  },
  {
    parcelId: "KAR-BGM-0003",
    documentType: "COURT_ORDER",
    title: "Mutation Objection Note",
    fileName: "mutation-objection-note.pdf",
    storageType: "demo",
    storageUri: "ipfs://demo/kar-bgm-0003/court-note",
    sha256Hash: "4930ed5a572e38087fa07875f94966e9927ec5e165cd512602d5c0ddadba3003",
    hashAnchored: false,
    blockchainTxHash: "",
    verificationStatus: "pending",
    metadata: {
      issuingAuthority: "Revenue Department",
      issueDate: "2024-10-10",
      recordReference: "OBJ-MR-09/2024-25",
      authoritative: false,
      integrationMode: "demo"
    }
  },
  {
    parcelId: "KAR-BGM-0003",
    documentType: "ENCUMBRANCE_CERTIFICATE",
    title: "Encumbrance Certificate Summary",
    fileName: "ec-yamakanmardi-114.pdf",
    storageType: "demo",
    storageUri: "ipfs://demo/kar-bgm-0003/ec",
    sha256Hash: "a965d8cbf53d9eb41bd1b7b8cfcb895d49f0230135302c8e71ecc7cd28ca3004",
    hashAnchored: true,
    blockchainTxHash: "0x8c20eea0f1bc091bb2fd0fa7ed19a9948bb1c7ca8b24fca539194d9eb5f83004",
    verificationStatus: "matched",
    metadata: {
      issuingAuthority: "Registration Department",
      issueDate: "2024-09-05",
      recordReference: "EC-2024-YM-114",
      authoritative: false,
      integrationMode: "demo"
    }
  }
];

export const demoUsers = [
  {
    name: "Karnataka Demo Verifier",
    email: "verifier@karlandchain.demo",
    role: "verifier",
    department: "Land Verification Cell",
    passwordHash: "",
    lastLoginAt: "2026-08-20T10:10:00.000Z"
  },
  {
    name: "Karnataka Demo Admin",
    email: "admin@karlandchain.demo",
    role: "admin",
    department: "Platform Operations",
    passwordHash: "",
    lastLoginAt: "2026-08-20T09:45:00.000Z"
  }
];

