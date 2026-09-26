# Land Stack | National Integrated GIS-Based Digital Public Infrastructure (DPI) for Land Governance

**Department of Land Resources (DoLR), Ministry of Rural Development, Government of India**

An integrated GIS-based Digital Public Infrastructure (DPI) platform bringing together all land-related datasets, workflows, and services into a single interoperable framework. Built upon georeferenced cadastral maps and linked with 14-digit Bhu-Aadhaar (ULPIN), Record of Rights (RoR), Master Plan Zoning, and cross-departmental workflows.

---

## 🏛️ Pilot Locations Covered

Following the official Department of Land Resources (DoLR) launch on **31 December 2025**, Land Stack is piloted across diverse urban and rural contexts:

1. **Tamil Nadu Pilot (Industrial & Peri-Urban Growth Corridor):**
   - Location: Kanchipuram / Sriperumbudur (`TN-KPM-0001` • ULPIN: `33030400100482`)
   - Systems: *Tamil Nilam* (Patta/Chitta) & *TNREGINET 2.0* (Registration)
   - Integration: CMDA Master Plan 2026 industrial zoning, active bank mortgage charge, CORS GNSS sub-meter cadastre.
2. **Chandigarh UT Pilot (Urban Land Administration & Freehold Commercial):**
   - Location: Sector 17-C Central Business District (`CHD-UT-0001` • ULPIN: `04010100200814`)
   - Systems: *Chandigarh Estate Office* & *Municipal Corporation (MCC)*
   - Integration: Le Corbusier heritage visual charter, urban commercial property register (UPR), digital PID.
3. **Karnataka State Integration (Agricultural-to-Urban Conversion & Conflict Resolution):**
   - Locations: Bengaluru Urban (`KAR-BLRU-0001`), Mysuru (`KAR-MYS-0002`), Belagavi (`KAR-BGM-0003`)
   - Systems: *Bhoomi* (RTC), *Kaveri 2.0* (Deeds), *SSLR Dishaank* (Survey), *e-Aasthi* (Property Tax)
   - Integration: 30m lake buffer monitoring, Section 95 land conversion, active Kisan Credit Card crop hypothecation, automated survey boundary overlap conflict detection.

---

## 🗺️ The Three Spatial Layers Architecture

Land Stack organizes all land governance information into 3 standardized spatial layers:

* **Layer 1: Base Cadastral & ULPIN Layer (Foundational):**
  - Georeferenced cadastral boundaries with vertex coordinates in `EPSG:4326` (WGS84).
  - 14-digit Bhu-Aadhaar (ULPIN) generated from boundary coordinates.
  - Interactive satellite imagery (Esri World Imagery) vs Cadastral Topo basemaps.
* **Layer 2: Essential Governance & RRR Layer (Rights, Restrictions & Liabilities):**
  - Record of Rights (RoR / Patta / Chitta / Jamabandi / RTC).
  - SRO Registered Deeds, stamp duty receipts, and consideration values.
  - Master Plan Zoning (Residential, Commercial CBD, Industrial, Green Belt).
  - Building Plan Sanctions & FAR compliance.
  - Encumbrance & Mortgage records.
  - Comprehensive Rights, Restrictions & Liabilities (RRR) legal summary matrix.
* **Layer 3: Additional / Use-Case Layer (Extended Services):**
  - Municipal Property Taxation (Digital PID, demand vs paid status).
  - Utility infrastructure networks (Water supply feeder pipelines, 11kV electricity grid, underground telecom ducts).
  - Circle Rate / Guidance Value valuation references.
  - Environmental & Hazard restriction zones (30m mandatory lake buffer lines, CRZ, forest perimeters).

---

## 🤖 AI/ML Geospatial Satellite Change Detection Radar

* **Bi-temporal Satellite Analysis:** Compares baseline imagery against current satellite passes.
* **Encroachment & Setback Detection:** Automatically flags unauthorized constructions or boundary shifts exceeding approved building plans.
* **Confidence Scoring:** Generates confidence percentages (e.g., 94% on Avalahalli parcel) and actionable recommendations for Revenue Inspectors.

---

## ⛓️ Tamper-Evident Sepolia Blockchain Audit Layer

* **Legal Integrity:** Authoritative state revenue and registration records remain the statutory source of truth.
* **Cryptographic Provenance:** Ethereum Sepolia smart contract (`LandRecordAudit.sol`) and client-side SHA-256 document hashing guarantee that historical deeds, mutation orders, and survey sketches cannot be altered retroactively.

---

## 👥 Multi-Role Administrative & Citizen Portals (RBAC)

Switch between 4 personas via the top-right role selector:
* 👤 **Citizen Portal:** Search parcels across India, inspect 3-tier layers, download official **Bhu-Aadhaar Property Cards**, and submit online service requests (e-Mutation, Zoning NOC, NEC).
* 📜 **Revenue Department (Tehsildar / VAO):** Scrutinize RoR, review pending inheritance/sale mutations, and approve survey sketches.
* 📐 **Town Planning Authority:** Audit Master Plan zoning compliance, issue building sanctions, and verify setback/lake buffer clearances.
* 🖋️ **Sub-Registrar (SRO):** Perform pre-registration encumbrance checks and prevent unlawful transfers.

---

## 🚀 Quick Start

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Seed Multi-State Land Stack Parcels:**
   ```bash
   npm run seed
   ```

3. **Start the Platform:**
   ```bash
   npm run dev
   ```

4. **Access Endpoints:**
   - **Frontend Web Portal:** [http://localhost:5173](http://localhost:5173)
   - **Backend API:** [http://localhost:4000/api](http://localhost:4000/api)
   - **Standard Technical Document (STD):** [http://localhost:5173/std](http://localhost:5173/std) or see [Land_Stack_Standard_Technical_Document.md](Land_Stack_Standard_Technical_Document.md)
