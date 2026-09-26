import { BookOpen, CheckCircle, Database, FileCode, Layers, ShieldCheck, Terminal, Workflow } from "lucide-react";

const StandardTechnicalDocPage = () => {
  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <section className="overflow-hidden rounded-[2.5rem] border border-white/70 bg-[linear-gradient(135deg,_#1f2937_0%,_#111827_50%,_#064e3b_100%)] p-8 text-white shadow-panel">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-300">
          <BookOpen size={14} />
          DoLR Architecture Specification 2026
        </div>
        <h2 className="mt-4 text-3xl font-extrabold sm:text-4xl">
          Standard Technical Document (STD)
        </h2>
        <p className="mt-3 max-w-3xl text-sm text-gray-300 sm:text-base">
          Formal technical specification for Land Stack: National Integrated GIS-Based Digital Public Infrastructure (DPI)
          for Land Governance, covering API protocols, OGC spatial standards, unified schemas, and security frameworks.
        </p>

        <div className="mt-6 flex flex-wrap gap-3 text-xs">
          <span className="rounded-full bg-emerald-500/20 px-3 py-1 font-semibold text-emerald-300 border border-emerald-500/30">
            DPI Standard Compliant
          </span>
          <span className="rounded-full bg-blue-500/20 px-3 py-1 font-semibold text-blue-300 border border-blue-500/30">
            OGC WFS / GeoJSON
          </span>
          <span className="rounded-full bg-amber-500/20 px-3 py-1 font-semibold text-amber-300 border border-amber-500/30">
            14-Digit ULPIN Key
          </span>
        </div>
      </section>

      {/* Grid of Standard Sections */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* 1. The 3-Tier Spatial Architecture */}
        <div className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-panel">
          <div className="mb-4 flex items-center gap-3 text-amber-800">
            <Layers size={22} />
            <h3 className="text-xl font-bold text-earth-900">1. Three-Tier Spatial Layer Standard</h3>
          </div>
          <p className="text-xs text-earth-600 mb-4">
            Specification for organizing all land records, governance decisions, and municipal services into 3 standardized spatial layers:
          </p>

          <div className="space-y-3 text-xs">
            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3">
              <p className="font-bold text-amber-950">Layer 1: Base Cadastral & ULPIN Layer</p>
              <p className="text-earth-700 mt-1">
                Georeferenced cadastral boundaries, vertex coordinates in EPSG:4326/WGS84, unique 14-digit ULPIN/Bhu-Aadhaar key, and CORS-aligned boundary dimensions.
              </p>
            </div>

            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3">
              <p className="font-bold text-blue-950">Layer 2: Essential Governance & RRR Layer</p>
              <p className="text-earth-700 mt-1">
                Record of Rights (RoR/Patta/Jamabandi), SRO deed registration references, Master Plan zoning polygons, sanctioned building permissions, and live encumbrance liens.
              </p>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
              <p className="font-bold text-emerald-950">Layer 3: Additional / Use-Case Layer</p>
              <p className="text-earth-700 mt-1">
                Municipal property taxation (PID), underground utility conduits (water, 11kV electricity, storm drainage), circle rates/guidance values, and environmental buffer restrictions (30m lake buffer, CRZ).
              </p>
            </div>
          </div>
        </div>

        {/* 2. Unified Interoperable API Standards */}
        <div className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-panel">
          <div className="mb-4 flex items-center gap-3 text-blue-800">
            <Terminal size={22} />
            <h3 className="text-xl font-bold text-earth-900">2. Open API & Interoperability Standards</h3>
          </div>
          <p className="text-xs text-earth-600 mb-4">
            RESTful and OGC-compliant endpoints ensuring real-time data sync across Revenue, Registration, Planning, and Municipal agencies:
          </p>

          <div className="space-y-2.5 font-mono text-[11px]">
            <div className="rounded-xl bg-gray-900 p-3 text-gray-200">
              <span className="text-emerald-400 font-bold">GET</span> /api/v1/landstack/parcels
              <p className="text-gray-400 font-sans text-xs mt-1">Query parcel by ULPIN, State, District, or GeoJSON bounding box.</p>
            </div>

            <div className="rounded-xl bg-gray-900 p-3 text-gray-200">
              <span className="text-emerald-400 font-bold">GET</span> /api/v1/landstack/parcels/:ulpin/layers
              <p className="text-gray-400 font-sans text-xs mt-1">Returns multi-tier GeoJSON with RRR, zoning, and utility features.</p>
            </div>

            <div className="rounded-xl bg-gray-900 p-3 text-gray-200">
              <span className="text-blue-400 font-bold">POST</span> /api/v1/landstack/parcels/:ulpin/workflow
              <p className="text-gray-400 font-sans text-xs mt-1">Auto-triggers cross-departmental actions (e.g. SRO deed triggering e-Mutation).</p>
            </div>

            <div className="rounded-xl bg-gray-900 p-3 text-gray-200">
              <span className="text-amber-400 font-bold">POST</span> /api/v1/landstack/verify/document-hash
              <p className="text-gray-400 font-sans text-xs mt-1">Validates client SHA-256 fingerprint against immutable blockchain anchor.</p>
            </div>
          </div>
        </div>

        {/* 3. Multi-State Data Schema Standards */}
        <div className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-panel">
          <div className="mb-4 flex items-center gap-3 text-emerald-800">
            <Database size={22} />
            <h3 className="text-xl font-bold text-earth-900">3. Multi-State Canonical Data Schema</h3>
          </div>
          <p className="text-xs text-earth-600 mb-4">
            Handles state-level diversity by mapping regional terminology to national Land Stack DPI primitives:
          </p>

          <div className="overflow-x-auto text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b text-earth-500 font-semibold">
                  <th className="pb-2">State Pilot</th>
                  <th className="pb-2">Local RoR Term</th>
                  <th className="pb-2">Registration Engine</th>
                  <th className="pb-2">Area Units</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-earth-100 text-earth-800 font-medium">
                <tr>
                  <td className="py-2 font-bold text-blue-900">Tamil Nadu</td>
                  <td className="py-2">Patta / Chitta</td>
                  <td className="py-2">TNREGINET 2.0</td>
                  <td className="py-2">Grounds & Cents</td>
                </tr>
                <tr>
                  <td className="py-2 font-bold text-amber-900">Chandigarh (UT)</td>
                  <td className="py-2">UPR / Jamabandi</td>
                  <td className="py-2">UT e-Registrar</td>
                  <td className="py-2">Sq. Yards & Marla</td>
                </tr>
                <tr>
                  <td className="py-2 font-bold text-emerald-900">Karnataka</td>
                  <td className="py-2">RTC / Pahani</td>
                  <td className="py-2">Kaveri 2.0</td>
                  <td className="py-2">Acres & Guntas</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Security, RBAC & Blockchain Audit */}
        <div className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-panel">
          <div className="mb-4 flex items-center gap-3 text-rose-800">
            <ShieldCheck size={22} />
            <h3 className="text-xl font-bold text-earth-900">4. Security & Cryptographic Audit</h3>
          </div>
          <p className="text-xs text-earth-600 mb-4">
            Tamper-evident governance architecture ensuring zero unauthorized unilateral record modification:
          </p>

          <div className="space-y-3 text-xs text-earth-800">
            <div className="flex items-start gap-2.5">
              <CheckCircle size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-earth-950">Role-Based Access Control (RBAC):</strong>
                <p className="text-earth-600 text-[11px]">Strict departmental separation: Revenue Officers, Town Planners, Sub-Registrars, and Citizens.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-earth-950">Zero Full Document Storage On-Chain:</strong>
                <p className="text-earth-600 text-[11px]">Large PDF documents remain in IPFS/secure storage; only their cryptographic SHA-256 hashes are anchored.</p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-earth-950">Ethereum Sepolia Audit Anchor:</strong>
                <p className="text-earth-600 text-[11px]">Smart contract (<code>LandRecordAudit.sol</code>) registers immutable state changes and prevents back-dated tampering.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StandardTechnicalDocPage;
