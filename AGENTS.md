# AGENTS.md — Engineering Guide & Persistent Context

## 1. Project Overview & SIH26014 Context
**Land Stack** is an integrated GIS-based Digital Public Infrastructure (DPI) for Land Governance developed for the **Department of Land Resources (DoLR), Ministry of Rural Development, Government of India**, directly addressing **Smart India Hackathon problem statement SIH26014 ("Integrated GIS-Based Digital Public Infrastructure for Land Governance")**.

### Core Purpose
In India, land is a State subject (*Seventh Schedule, List II, Entry 18*), leading to fragmented, siloed state systems (e.g., *Bhoomi* and *Kaveri* in Karnataka, *Tamil Nilam* and *TNREGINET* in Tamil Nadu, *UPR* in Chandigarh). Furthermore, >66% of civil litigations involve land boundary and ownership disputes. 

Land Stack establishes a federated, interoperable national Digital Public Infrastructure connecting:
1. **Cadastral Maps & 14-Digit Bhu-Aadhaar (ULPIN)**
2. **Record of Rights (RoR / Patta / Chitta / RTC)**
3. **Deed Registration & Sub-Registrar Offices (SRO)**
4. **Revenue Court Case Management System (RCCMS)**
5. **Town Planning & Master Plan Zoning**
6. **Core Banking Liens & Encumbrances**
7. **AI Satellite Change & Encroachment Detection**
8. **Tamper-Evident Sepolia Blockchain Audit Layer**

---

## 2. Technology Stack

### Frontend (`client/`)
* **Framework:** React 18 (`react`, `react-dom`) + Vite 5 (`@vitejs/plugin-react`)
* **Routing:** `react-router-dom` v6
* **Styling:** Tailwind CSS 3.4 + PostCSS + Autoprefixer (Glassmorphic Government DPI design system)
* **GIS Mapping:** `leaflet` 1.9.4 + `react-leaflet` 4.2.1 (supports Esri World Imagery Satellite basemap, cadastral polygon overlays, CORS vertex markers, utility lines)
* **Icons:** `lucide-react`
* **HTTP Client:** `axios`
* **QR Codes:** `react-qr-code`, `@yudiel/react-qr-scanner`
* **Real-time Streaming:** Native browser `EventSource` connected to Node.js Server-Sent Events (`/api/stream`)

### Backend (`server/`)
* **Runtime:** Node.js (ES Modules, `"type": "module"`)
* **Framework:** Express 4.19
* **Database:** MongoDB 7+ via Mongoose 8.6
* **Real-time Event Gateway:** In-memory Node.js `EventEmitter` broadcasting via native Server-Sent Events (SSE) on `GET /api/stream`
* **Logging & CORS:** `morgan`, `cors`
* **Blockchain/Web3:** `ethers` v6 interacting with Ethereum Sepolia smart contracts or demo-mode deterministic hashing

### Smart Contracts (`contracts/`)
* **Environment:** Hardhat
* **Language:** Solidity `^0.8.24` (`LandRecordAudit.sol`)
* **Network:** Ethereum Sepolia testnet

---

## 3. Repository Structure

```
sih/
├── AGENTS.md                                # Persistent architectural context & agent rules
├── README.md                                # Public documentation & pilot state overview
├── docker-compose.yml                       # Local MongoDB service container configuration
├── package.json                             # Monorepo root with npm workspaces ("client", "server", "contracts")
├── client/                                  # React + Vite frontend application
│   ├── index.html                           # Single page HTML entry
│   ├── vite.config.js                       # Vite configuration with proxy for /api -> :4000
│   └── src/
│       ├── App.jsx                          # Main router setup & lazy routes
│       ├── main.jsx                         # React DOM mount point
│       ├── index.css                        # Tailwind directives & glass-panel styling
│       ├── api/
│       │   └── client.js                    # Axios client instance & REST API call wrappers
│       ├── context/
│       │   ├── AuthContext.jsx              # Role-based auth provider & demo account switcher
│       │   ├── LiveEventContext.jsx         # SSE (/api/stream) client hook & toast dispatch
│       │   └── LanguageContext.jsx          # Multilingual dictionary (EN, HI, KN, TA)
│       ├── layouts/
│       │   └── AppLayout.jsx                # Government banner, navigation, live telemetry pill, language/role toggles
│       ├── pages/
│       │   ├── HomePage.jsx                 # Pilot state explorer, search engine, metrics, parcel listing
│       │   ├── ParcelDetailPage.jsx         # 3-tier layer viewer, tabs (Overview, Legal/RCCMS, AI, 3D, Audit)
│       │   ├── PublicVerifyPage.jsx         # Public QR verification landing page
│       │   ├── QrScanPage.jsx               # In-browser QR code scanner & hash verification
│       │   └── StandardTechnicalDocPage.jsx # Formal DoLR 2026 API specification & schemas
│       ├── components/
│       │   ├── ParcelMap.jsx                # Leaflet GIS canvas (3 layers, CORS pins, AI radar, subdivision tool)
│       │   ├── ParcelList.jsx               # Responsive multi-state parcel cards
│       │   ├── PropertyCardModal.jsx        # Printable Bhu-Aadhaar official certificate
│       │   ├── ServiceRequestModal.jsx      # Citizen cross-departmental workflow modal
│       │   ├── LiveDemoDock.jsx             # Collapsible floating jury demonstration dock (1-click simulations)
│       │   ├── BiTemporalSatelliteModal.jsx # Before (2024) vs After (2026) satellite comparison slider
│       │   ├── CadastralSubdivisionModal.jsx# Surveyor 11E subdivision sketch & child ULPIN generator
│       │   ├── SchemaHarmonizerModal.jsx    # Multi-state to National canonical OGC/JSON-LD viewer
│       │   ├── ThreeDCadastreModal.jsx      # 3D vertical strata preview for urban multi-storey units
│       │   ├── StatusPill.jsx               # Color-coded verification & court-stay status badges
│       │   ├── DocumentPanel.jsx            # Document hashes & IPFS reference viewer
│       │   ├── OwnershipTimeline.jsx        # Historical mutation & deed chronological chain
│       │   └── VerificationPanel.jsx        # Consistency cross-check report against state databases
│       └── utils/
│           ├── format.js                    # Currency, acreage, date, and hash formatters
│           └── i18n.js                      # Language translations (English, Hindi, Kannada, Tamil)
├── server/                                  # Express REST API & SSE Real-time Gateway
│   ├── .env                                 # Server environment configuration
│   └── src/
│       ├── index.js                         # Server entry point & DB connection
│       ├── config/
│       │   ├── db.js                        # Mongoose MongoDB connection
│       │   └── env.js                       # Environment variable parser
│       ├── events/
│       │   └── eventBus.js                  # Node.js EventEmitter for SSE real-time broadcast
│       ├── middleware/
│       │   ├── authMiddleware.js            # Simulated token/role-based route guard
│       │   └── errorHandler.js              # Centralized error handler
│       ├── models/
│       │   ├── Parcel.js                    # Core parcel schema with 3 spatial layers, RCCMS, AI, 3D
│       │   ├── User.js                      # User schema with 6 specialized government & citizen roles
│       │   ├── DocumentRecord.js            # Document metadata & SHA-256 cryptographic hashes
│       │   ├── OwnershipEvent.js            # Mutation and deed events
│       │   ├── DisputeRecord.js             # Revenue court case & stay order schema
│       │   └── VerificationScan.js          # QR code scan history
│       ├── routes/
│       │   ├── authRoutes.js                # Login, demo switch, and current session
│       │   ├── streamRoutes.js              # GET /api/stream (SSE) & POST /api/stream/simulate
│       │   ├── parcelRoutes.js              # Parcel listing, detail, subdivision, and workflow actions
│       │   ├── courtRoutes.js               # RCCMS stay order & dispute management
│       │   ├── dashboardRoutes.js           # Consolidated platform statistics & pilot summaries
│       │   └── verificationRoutes.js        # Hash verification & Sepolia blockchain anchoring
│       ├── controllers/
│       │   ├── authController.js            # Authentication logic & session generation
│       │   ├── streamController.js          # SSE connection manager & broadcast helpers
│       │   ├── parcelController.js          # Parcel CRUD, boundary subdivision, workflows
│       │   ├── courtController.js           # RCCMS injunction issue/revoke & anti-fraud locks
│       │   └── dashboardController.js       # KPI metrics aggregation
│       └── data/
│           └── demoParcels.js               # Multi-state seed data (TN, CHD, KAR)
└── contracts/                               # Sepolia Smart Contract & Deployment
    ├── contracts/LandRecordAudit.sol        # Solidity immutable audit trail contract
    └── hardhat.config.js                   # Hardhat network & compiler configuration
```

---

## 4. Existing Features to Preserve

1. **Multi-State Pilot Parity:**
   * **Tamil Nadu Pilot:** Sriperumbudur (`TN-KPM-0001` • ULPIN: `33030400100482`, Patta/Chitta, TNREGINET deed, CMDA Master Plan 2026, active IOB bank mortgage).
   * **Chandigarh UT Pilot:** Sector 17-C CBD (`CHD-UT-0001` • ULPIN: `04010100200814`, Freehold commercial UPR, Le Corbusier heritage zone).
   * **Karnataka State Integration:** Bengaluru Urban (`KAR-BLRU-0001`), Mysuru (`KAR-MYS-0002`), Belagavi (`KAR-BGM-0003` with active boundary dispute and AC court stay).
2. **The 3 Spatial Layers Standard:**
   * **Layer 1 (Base Cadastral):** Georeferenced boundaries, 14-digit ULPIN, CORS GNSS sub-meter coordinates, vertex coordinates in `EPSG:4326`.
   * **Layer 2 (Essential Governance & RRR):** RoR (Patta/RTC/UPR), SRO deed references, Master Plan zoning polygons, sanctioned building permissions, active bank mortgage liens.
   * **Layer 3 (Use-Case & Extended Services):** Municipal property taxation (PID), underground utility conduits (water feeders, 11kV grid), circle rates / guidance values, environmental restrictions (30m lake buffer lines).
3. **Official DPI Bhu-Aadhaar Property Cards:**
   * Printable, standard-compliant certificate containing administrative hierarchy, cadastral identity, RRR matrix, boundary vertex coordinates, verification QR code, and Sepolia transaction hash.
4. **Standard Technical Document (STD) Page (`/std`):**
   * DoLR architecture specifications, open API standards, canonical data dictionaries, and cryptographic audit proofs.
5. **Sepolia Cryptographic Audit Layer:**
   * SHA-256 document hashing and off-chain storage references with tamper-evident blockchain transaction IDs.

---

## 5. Role-Based Access Control (RBAC) Architecture

The application enforces a dual-level (frontend UI + backend API middleware) authorization system supporting 6 specialized government and institutional personas:

| Role ID | Persona Name | Key Permissions | Restrictions |
|---|---|---|---|
| `admin` | **National Administrator / DoLR Officer** | Full platform visibility, inspect audit trails, manage simulation dock, view all state gateways. | None |
| `revenue_officer` | **Revenue Officer (Tehsildar / VAO)** | Approve e-Mutation requests, review 11E survey sketches, inspect AI satellite anomalies, scrutinize RoR. | Cannot issue court stay orders or modify judicial decrees. |
| `surveyor` | **Revenue Surveyor** | Access survey canvas, capture simulated CORS GNSS coordinates, draw subdivision lines, generate 11E sketches. | **Cannot self-approve** their own survey sketch. Cannot override transaction locks. |
| `sro` | **Sub-Registrar (SRO)** | Initiate deed registrations, conduct pre-registration encumbrance/court checks, generate index-II extracts. | **Hard-blocked** from registering deeds on parcels under active court stays, dispute injunctions, or bank liens. |
| `bank` | **Bank / Financial Institution (Finacle)** | Create equitable mortgage charges, enter Column 11 hypothecation charges, inspect clear titles. | Cannot alter cadastral geometry, approve mutations, or lift court injunctions. |
| `court` | **Revenue Court / RCCMS Officer** | Issue interim stay orders, manage litigation metadata, place/revoke legal transaction locks. | Cannot alter cadastral boundaries or ownership shares directly. |
| `citizen` | **Citizen / Public User** | Search parcels across India, inspect 3-tier layers, download Bhu-Aadhaar Property Cards, submit service requests. | Read-only with workflow initiation privileges. |

### Backend Route Guard Middleware (`authMiddleware.js`)
Sensitive mutation endpoints inspect the `x-user-role` header (or simulated session token) and validate role permissions:
* `requireRole(["revenue_officer", "admin"])` for approving mutations and survey sketches.
* `requireRole(["surveyor", "admin"])` for submitting subdivision proposals.
* `requireRole(["court", "admin"])` for issuing/revoking injunctions and legal transaction locks.
* `requireRole(["bank", "admin"])` for adding/releasing mortgage liens.
* `requireRole(["sro", "admin"])` for deed registration (with mandatory check against active injunctions).

---

## 6. Real-Time Event Gateway Architecture (`/api/stream`)

* **Technology:** Native Node.js `EventEmitter` combined with HTTP Server-Sent Events (`text/event-stream`). No bulky Redis/Kafka brokers required.
* **Endpoint:** `GET /api/stream`
* **Heartbeat:** Pings every 25 seconds to keep long-lived HTTP connections active.
* **Supported Events:**
  - `DEED_REGISTERED`: SRO registers a deed; automatically alerts Revenue for mutation.
  - `MUTATION_INITIATED`: Revenue department opens a mutation task.
  - `MUTATION_COMPLETED`: Mutation approved; updates RoR and owner list live on all screens.
  - `LIEN_CREATED`: Bank registers an equitable mortgage charge.
  - `LIEN_RELEASED`: Bank releases mortgage lien.
  - `COURT_INJUNCTION_ISSUED`: Injunction issued; parcel turns red and locks immediately.
  - `COURT_INJUNCTION_REMOVED`: Court lifts stay order; unlocks parcel.
  - `GNSS_POINT_RECEIVED`: CORS rover streams coordinate telemetry to the map.
  - `SURVEY_COMPLETED`: Field survey finished.
  - `SUBDIVISION_CREATED`: Surveyor submits an 11E demarcation split.
  - `AI_CHANGE_DETECTED`: Remote sensing satellite pass flags unauthorized construction.
  - `TRANSACTION_BLOCKED`: Anti-fraud engine prevents illegal sale under Section 52 Transfer of Property Act.

---

## 7. Development & Agent Safety Rules

1. **Inspect Before Changing:** Always view or grep existing code before editing. Do not guess file structure or exports.
2. **Never Break Existing Features:** Bhu-Aadhaar Property Cards, Leaflet map overlays, Sepolia verification, and multi-state seed parcels must remain functional at all times.
3. **Keep It Locally Runnable & Self-Contained:** Avoid introducing Redis, external message queues, paid proprietary APIs, or heavy 3D game engines.
4. **Progressive Disclosure UI:** Do not clutter the main landing page with every single control. Use clean tabs (`Overview`, `Legal / RCCMS`, `AI Satellite Radar`, `3D Strata`, `Audit Trail`), modals, and a collapsible floating demonstration dock.
5. **Honest Simulation Labeling:** All mock services (CORS GNSS rover, AI change detection, bank Finacle gateway, Sepolia testnet hash) must be clearly labeled as demonstration public infrastructure adapters.
6. **Double-Layer Authorization:** Implement checks both in the React UI (disabled buttons / role badges) and in Express controllers (HTTP 401/403 with descriptive error payloads).

---

## 8. How to Run the Project

### Prerequisites
* Node.js v18+ (tested on v22.19.0)
* MongoDB running locally on port 27017 (`mongodb://127.0.0.1:27017/karnataka_landchain`)

### Commands
```bash
# 1. Install all dependencies across monorepo workspaces
npm install

# 2. Seed multi-state demo parcels & initial users
npm run seed

# 3. Start both backend (:4000) and frontend (:5173) concurrently
npm run dev

# 4. Optional: Run tests / build client bundle
npm run build
```
* **Frontend Web Application:** `http://localhost:5173`
* **Backend API Gateway:** `http://localhost:4000/api`
* **Real-time SSE Stream:** `http://localhost:4000/api/stream`
* **Architecture Standard (STD):** `http://localhost:5173/std`
