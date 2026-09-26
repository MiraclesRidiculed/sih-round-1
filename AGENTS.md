# AGENTS.md — Engineering Guide & Persistent Context

## 1. Project Overview & SIH26014 Context
**Land Stack** is an integrated GIS-based Digital Public Infrastructure (DPI) for Land Governance developed for the **Department of Land Resources (DoLR), Ministry of Rural Development, Government of India**, directly addressing **Smart India Hackathon problem statement SIH26014 ("Integrated GIS-Based Digital Public Infrastructure for Land Governance")**.

### Core Purpose & Constitutional Context
In India, land is constitutionally a State subject (*Seventh Schedule, List II, Entry 18*), leading to fragmented, siloed state systems (e.g., *Bhoomi* and *Kaveri* in Karnataka, *Tamil Nilam* and *TNREGINET* in Tamil Nadu, *UPR* in Chandigarh, *Dharani* in Telangana). Furthermore, >66% of civil litigations involve land boundary and ownership disputes. 

Land Stack establishes a federated, interoperable national Digital Public Infrastructure (analogous to UPI or ABDM) that respects state autonomy while connecting:
1. **Cadastral Maps & 14-Digit Bhu-Aadhaar (ULPIN)**
2. **Record of Rights (RoR / Patta / Chitta / RTC)**
3. **Deed Registration & Sub-Registrar Offices (SRO)**
4. **Revenue Court Case Management System (RCCMS)**
5. **Town Planning & Master Plan Zoning**
6. **Core Banking Liens & Encumbrances (Finacle / CERSAI)**
7. **Remote Sensing Satellite Change Detection**
8. **Tamper-Evident Sepolia Blockchain Audit Layer**

---

## 2. Current Development State & Active Git Branch

* **Target Active Branch:** `national-dpi-security-refactor`
* **STRICT RULE:** NEVER commit or push directly to `main` or `GIS-edit-1`. Work exclusively on `national-dpi-security-refactor`.
* **Current Working Tree:** All changes for Steps 1 through 4 are staged/active on `national-dpi-security-refactor`.
* **Prerequisites:** MongoDB running locally on port 27017 (`mongodb://127.0.0.1:27017/karnataka_landchain`), Node.js v22+.

---

## 3. Implementation Progress Checklist

### ✅ STEP 1: Repository Audit & Baseline Verification (COMPLETED)
- Verified npm monorepo workspaces (`client`, `server`, `contracts`).
- Verified baseline build (`npm run build` succeeds with 0 errors).
- Clean branch checkout to `national-dpi-security-refactor`.

### ✅ STEP 2: Backend Authentication Foundation (COMPLETED)
- Installed dependencies in server: `bcryptjs` (^3.0.3) and `jsonwebtoken` (^9.0.3).
- Added `JWT_SECRET` and `JWT_EXPIRES_IN=7d` to `server/.env` and `server/src/config/env.js`.
- Upgraded `server/src/models/User.js`:
  - `pre("save")` hook for automated bcrypt hashing with 10 salt rounds.
  - Double-hashing prevention (checks for `$2a$` or `$2b$` prefix).
  - `comparePassword(candidatePassword)` instance method.
  - `toJSON()` method to strip `passwordHash` from API outputs.
- Created `server/src/utils/jwt.js`: `generateToken(user)` and `verifyToken(token)`.
- Overhauled `server/src/middleware/authMiddleware.js`:
  - `authenticateToken`: verifies a signed JWT from the HttpOnly session cookie (or an explicit Bearer token), requires an active database session, and returns HTTP 401 on missing/invalid/expired/revoked tokens.
  - `requireRole(allowedRoles)`: strictly verifies RBAC permissions; returns HTTP 401 if unauthenticated and HTTP 403 (`ACCESS_RESTRICTED`) if role lacks required privilege.
- Upgraded `server/src/controllers/authController.js` & `server/src/routes/authRoutes.js`:
  - `POST /api/auth/login`: verifies password against MongoDB bcrypt hash, updates `lastLoginAt`, and sets Secure/SameSite HttpOnly session and CSRF cookies; the JWT is not returned to JavaScript.
  - `POST /api/auth/logout`: revokes the active database session and clears both cookies.
  - `GET /api/auth/me`: protected via `authenticateToken`.
  - `POST /api/auth/switch-role`: replaces the HttpOnly session only for non-production demo evaluation; disabled in production.
- Automated Test Suite: `node server/src/scripts/testAuth.js` (9/9 tests passed).

### ✅ STEP 3: Secure Demo Personas & Idempotent Seeding (COMPLETED)
- Standardized all 7 official institutional personas in `server/src/data/demoParcels.js` and `authMiddleware.js`:
  1. `admin` — Dr. Rameshwar Sharma, IAS (DoLR National Platform Administrator)
  2. `revenue_officer` — K. Annadurai, DRO (Tehsildar / Village Administrative Officer)
  3. `surveyor` — P. Vignesh, LIS (Directorate of Survey & Land Records)
  4. `sro` — Meenakshi Sundaram (Sub-Registrar / Registration & Stamps Department)
  5. `court` — Hon. Justice B. Patil (Revenue Court / RCCMS Judicial Officer)
  6. `bank` — Vikram Malhotra (Financial Institution / Core Banking)
  7. `citizen` — Ananya Narayanan (Public Landholder / Applicant)
- Demo persona passwords are deterministically derived per account from `DEMO_SEED_PASSWORD`; configure at least 32 bytes of private secret material before seeding. Demo accounts are not seeded in production.
- Upgraded `server/src/scripts/seedDemoData.js` to be **100% idempotent and non-destructive** using Mongoose upserts (`findOneAndUpdate` with `{ upsert: true }`). Running the seed script multiple times does not duplicate records or drop unrelated collections.
- Automated Test Suite: `node server/src/scripts/verifyPersonas.js` verified all 7 users, bcrypt hashes, and HTTP login.

### ✅ STEP 4: Frontend Login Portal (COMPLETED)
- Created `client/src/pages/LoginPage.jsx`:
  - Calm, formal Government of India / JanParichay DPI styling.
  - Deep navy (`#0B2545`), ash slate (`#334155`), white/slate cards, restrained amber/saffron accents.
  - Zero neon, zero glowing borders, zero gaming terminology.
  - Full username and password inputs with toggle.
  - **Institutional Account Selector:** Click a persona to pre-fill its email; enter the individually provisioned password.
- Updated `client/src/App.jsx`: registered `/login` route.
- Updated `client/src/api/client.js`: sends cookies with API requests and attaches a double-submit CSRF token to state-changing requests.
- Updated `client/src/context/AuthContext.jsx`: restores the server-validated cookie session, clears legacy local JWTs, and keeps only an offline profile cache for offline-only use.
- Updated `client/src/layouts/AppLayout.jsx`: navigation displays active official session with role badge and `Sign Out` button, or `Official Login` when unauthenticated.
- Verified in browser via automated subagent (`login_flow_test`): tested invalid password (error banner), demo persona selection, real login, redirect to `/`, header session status, and logout.
- Verified build: `npm run build` succeeds with 0 errors (1,718 modules).

---

## 4. Remaining Steps & Immediate Next Step

When resuming, execute the remaining steps in the following order:

### 🔜 STEP 5: Quiet, Authoritative UI Overhaul & De-cluttering
- **Goal:** Eliminate visual noise, sensationalized hype terms, and invasive screen distractions.
- **Actions:**
  1. Retire the floating bottom-right dock (`client/src/components/LiveDemoDock.jsx`).
  2. Move simulation and inter-agency triggers into a dedicated, authenticated **Department Operations Console** (`/operations`) accessible via the navigation header for authorized officials (`admin`, `revenue_officer`, `sro`, etc.).
  3. Purge sensationalized terms across all components:
     - Replace *"Radar Sweep"* / *"Orbital AI"* $\rightarrow$ *"Remote Sensing Change Detection"*.
     - Replace *"Hard-Blocked"* / *"Instant Freeze"* $\rightarrow$ *"Statutory Transfer Restriction (Sec 52 Transfer of Property Act)"*.
     - Replace *"Quantum Ledger"* $\rightarrow$ *"Tamper-Evident Cryptographic Audit Trail"*.
  4. Standardize cards and tables on calm slate/navy borders and remove pulsating animations.
  5. Test and verify build.

### 🔜 STEP 6: National Federated DPI Architecture & Canonical Schema Harmonizer
- **Goal:** Formalize the multi-state federation model honoring State subject rights (*Entry 18, List II*).
- **Actions:**
  1. Expand the Canonical Schema Harmonizer (`client/src/components/SchemaHarmonizerModal.jsx` and backend adapters) to demonstrate seamless translation between state systems (*Bhoomi*, *Tamil Nilam*, *UPR*, *Dharani*) into the National **ISO 19152 LADM** standard.
  2. Implement an inter-state encumbrance lookup showing how a national bank or central agency queries clear title across state borders without displacing state databases.

### 🔜 STEP 7: Deep Statutory Features
- **Goal:** Complete deep functional workflows that differentiate Land Stack.
- **Actions:**
  1. **Full RCCMS Dispute Lifecycle:** Support case filing $\rightarrow$ notice $\rightarrow$ interim injunction (stay order) $\rightarrow$ final decree/vacation, with automatic Section 52 statutory locks on SRO deed registration.
  2. **Geometric Cadastral Subdivision (Form 11E):** True polygon coordinate midpoint splitting algorithm calculating valid child GeoJSON polygons, recomputed acreage, and issuing deterministic child ULPINs.
  3. **PWA Offline Field Survey Mode:** Add `manifest.json` and service worker caching in `client/public/` with a password-unlocked, AES-GCM-encrypted IndexedDB survey sync queue.

### 🔜 STEP 8: Verification & Branch Commit
- Run full suite tests (`testAuth.js`, `verifyPersonas.js`, `npm run build`).
- Commit all changes:
  ```bash
  git add -A
  git commit -m "feat(dpi): implement federated national architecture, jwt rbac security, and quiet govtech ui"
  git push -u origin national-dpi-security-refactor
  ```
- **STRICT:** Do not push to `main` or `GIS-edit-1`.

---

## 5. Technology Stack Summary

### Frontend (`client/`)
* **Framework:** React 18.3.1 + Vite 8.3.1
* **Routing:** `react-router-dom` 7.18.4
* **Styling:** Tailwind CSS 3.4.10 (Authoritative Government DPI theme: `#0B2545`, `#334155`, `#F8F6EF`)
* **GIS Mapping:** `leaflet` 1.9.4 + `react-leaflet` 4.2.1
* **Icons:** `lucide-react` 0.439.0
* **HTTP Client:** `axios` 1.7.4 with HttpOnly session cookies and double-submit CSRF protection
* **QR Codes:** `react-qr-code`, `@yudiel/react-qr-scanner`
* **Real-time Streaming:** Authenticated fetch stream on `/api/stream`

### Backend (`server/`)
* **Runtime:** Node.js v22 (ES Modules, `"type": "module"`)
* **Framework:** Express 4.19.2
* **Database:** MongoDB 7+ via Mongoose 8.6.2
* **Authentication:** `bcryptjs` 3.0.3, `jsonwebtoken` 9.0.3, revocable MongoDB sessions, login throttling
* **Real-time Event Gateway:** In-memory Node.js `EventEmitter` broadcasting via native SSE (`GET /api/stream`)
* **Logging & CORS:** `morgan`, `cors`
* **Web3/Audit:** `ethers` 6.13.2

---

## 6. Official Institutional Personas & Credentials

| Role ID | Persona Name | Official Designation | Department | Email |
|---|---|---|---|---|---|
| `admin` | Dr. Rameshwar Sharma, IAS | DoLR National Platform Administrator | Department of Land Resources (DoLR), MoRD | `admin@landstack.gov.in` |
| `revenue_officer` | K. Annadurai, DRO | Tehsildar / Village Administrative Officer | Revenue & Disaster Management Department | `tehsildar@tamilnilam.tn.gov.in` |
| `surveyor` | P. Vignesh, LIS | Directorate of Survey & Land Records | Survey Settlement & Land Records (SSLR) | `surveyor@surveyofindia.gov.in` |
| `sro` | Meenakshi Sundaram | Sub-Registrar / Registration & Stamps Department | Registration & Stamps Department | `sro.sriperumbudur@tnreginet.gov.in` |
| `court` | Hon. Justice B. Patil | Revenue Court / RCCMS Judicial Officer | Revenue Court Case Management System (RCCMS) | `rccms.bench@judiciary.gov.in` |
| `bank` | Vikram Malhotra | Financial Institution / Core Banking | Indian Overseas Bank / Core Banking (Finacle) | `mortgages@iob.bank.in` |
| `citizen` | Ananya Narayanan | Public Landholder / Applicant | Public User | `ananya.citizen@gmail.com` |

---

## 7. How to Run & Verify

```bash
# 1. Install workspace dependencies
npm install

# 2. Run idempotent database seed
npm run seed

# 3. Run backend authentication & persona test suites
node server/src/scripts/testAuth.js
node server/src/scripts/verifyPersonas.js

# 4. Start backend (:4000) and frontend (:5173) concurrently
npm run dev

# 5. Production client build check
npm run build
```

* **Frontend Web Application:** `http://localhost:5173`
* **Official Login Portal:** `http://localhost:5173/login`
* **Backend API Gateway:** `http://localhost:4000/api`
* **Real-time SSE Stream:** `http://localhost:4000/api/stream`
* **Architecture Standard (STD):** `http://localhost:5173/std`
