import { useState } from "react";
import {
  Activity,
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Database,
  Gavel,
  Landmark,
  Layers,
  MapPin,
  Radio,
  Scissors,
  Sparkles,
  Unlock,
} from "lucide-react";
import {
  createBankLienApi,
  issueCourtInjunctionApi,
  liftCourtInjunctionApi,
  simulateDpiEventApi
} from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useLiveEvents } from "../context/LiveEventContext";

const LiveDemoDock = ({
  currentParcelId = "TN-KPM-0001",
  onOpenSubdivision,
  onOpenSatelliteSlider,
  onOpenSchemaHarmonizer,
  onOpenThreeDCadastre
}) => {
  const { activeRole, switchRole, demoRolePersonas } = useAuth();
  const { gatewayStatus } = useLiveEvents();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("events"); // "events", "survey", "tools"
  const [isExecuting, setIsExecuting] = useState(false);
  const [actionFeedback, setActionFeedback] = useState("");

  const targetParcel = currentParcelId || "TN-KPM-0001";

  const showFeedback = (msg) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(""), 4000);
  };

  // 2. Issue court stay order (RCCMS)
  const handleIssueCourtStay = async () => {
    setIsExecuting(true);
    try {
      await issueCourtInjunctionApi(targetParcel, {
        caseNumber: "OS-2026-HC-992",
        courtName: "High Court of Judicature & Revenue Bench",
        presidingBench: "Division Bench (Land Disputes)",
        injunctionTerms: "Interim injunction restraining all alienation, sale registration, and mutation pending title determination."
      });
      showFeedback(`🏛️ Court Injunction Issued! Transaction lock enforced on ${targetParcel}`);
    } catch (err) {
      showFeedback(err.response?.data?.message || "Court injunction error");
    } finally {
      setIsExecuting(false);
    }
  };

  // 3. Lift Court Injunction
  const handleLiftCourtStay = async () => {
    setIsExecuting(true);
    try {
      await liftCourtInjunctionApi(targetParcel, {
        orderReference: "HC/DISPOSE/2026/012",
        remarks: "Compromise decree recorded; stay vacated."
      });
      showFeedback(`🔓 Injunction vacated! Transaction lock removed on ${targetParcel}`);
    } catch (err) {
      showFeedback(err.response?.data?.message || "Error lifting stay");
    } finally {
      setIsExecuting(false);
    }
  };

  // 4. Bank Mortgage Lien Creation
  const handleCreateBankLien = async () => {
    setIsExecuting(true);
    try {
      await createBankLienApi(targetParcel, {
        lenderName: "State Bank of India (Consortium Lead)",
        mortgageAmount: "₹ 2,75,00,000",
        chargeType: "Equitable Mortgage & Working Capital Charge"
      });
      showFeedback(`🏦 Mortgage charge of ₹ 2.75 Cr registered across Encumbrance Layer`);
    } catch (err) {
      showFeedback(err.response?.data?.message || "Error creating bank lien");
    } finally {
      setIsExecuting(false);
    }
  };

  // 5. CORS GNSS Rover Simulated Pinning
  const handleSimulateGnssSurvey = async () => {
    setIsExecuting(true);
    showFeedback("📡 CORS Rover Pinning Vertex #1 (12.9341°N, 79.9182°E)...");

    try {
      await simulateDpiEventApi("GNSS_POINT_RECEIVED", {
        parcelId: targetParcel,
        pt: 1,
        lat: 12.9341,
        lng: 79.9182,
        rtkAccuracyCm: 3.2,
        roverModel: "Survey of India CORS Base Station Alpha"
      });

      setTimeout(async () => {
        await simulateDpiEventApi("GNSS_POINT_RECEIVED", {
          parcelId: targetParcel,
          pt: 2,
          lat: 12.9341,
          lng: 79.9224,
          rtkAccuracyCm: 2.8,
          roverModel: "Survey of India CORS Base Station Alpha"
        });
        showFeedback("📡 CORS Rover Pinning Vertex #2 (±2.8cm precision)...");
      }, 700);

      setTimeout(async () => {
        await simulateDpiEventApi("SURVEY_COMPLETED", {
          parcelId: targetParcel,
          totalVertices: 4,
          areaAcres: 1.25,
          summary: "CORS GNSS Rover Field Survey completed with ±3cm RTK precision."
        });
        showFeedback("✅ Field GNSS Boundary Survey Completed!");
      }, 1500);
    } catch (err) {
      showFeedback("GNSS simulation error");
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[1800] select-none">
      {!isExpanded ? (
        /* Collapsed Trigger Pill */
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="group flex items-center gap-2.5 rounded-full border border-amber-400 bg-earth-950/90 px-4 py-2.5 text-xs font-black text-amber-300 shadow-2xl backdrop-blur-md transition hover:scale-105 hover:bg-earth-900"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-earth-950">
            <Zap size={13} />
          </span>
          <span>Departmental Operations Console</span>
          <ChevronUp size={15} className="text-gray-400 transition group-hover:text-white" />
        </button>
      ) : (
        /* Expanded Floating Console */
        <div className="w-80 sm:w-96 rounded-3xl border border-white/60 bg-white/95 p-4 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-6 duration-200">
          {/* Top Bar */}
          <div className="flex items-center justify-between border-b pb-2.5">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-900 text-amber-200 text-xs">
                ⚡
              </span>
              <div>
                <h4 className="text-xs font-black text-earth-950 uppercase tracking-wider">
                  Departmental Operations Console
                </h4>
                <p className="text-[10px] text-earth-500">
                  Target: <strong className="font-mono text-earth-800">{targetParcel}</strong>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="rounded-full p-1 text-earth-400 hover:bg-earth-100 hover:text-earth-900"
            >
              <ChevronDown size={18} />
            </button>
          </div>

          {/* Feedback Alert */}
          {actionFeedback && (
            <div className="mt-2.5 rounded-xl border border-amber-300 bg-amber-50 p-2 text-[11px] font-semibold text-amber-900 animate-in fade-in">
              {actionFeedback}
            </div>
          )}

          {/* Dock Tabs */}
          <div className="mt-3 flex rounded-xl bg-earth-100/80 p-0.5 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("events")}
              className={`flex-1 rounded-lg py-1.5 transition ${
                activeTab === "events" ? "bg-earth-900 text-white shadow-xs" : "text-earth-600 hover:text-earth-900"
              }`}
            >
              Inter-Agency
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("survey")}
              className={`flex-1 rounded-lg py-1.5 transition ${
                activeTab === "survey" ? "bg-earth-900 text-white shadow-xs" : "text-earth-600 hover:text-earth-900"
              }`}
            >
              Survey & Split
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("tools")}
              className={`flex-1 rounded-lg py-1.5 transition ${
                activeTab === "tools" ? "bg-earth-900 text-white shadow-xs" : "text-earth-600 hover:text-earth-900"
              }`}
            >
              Advanced Tools
            </button>
          </div>

          {/* TAB 1: INTER-AGENCY EVENTS */}
          {activeTab === "events" && (
            <div className="mt-3 space-y-2 text-xs">
              {/* Court Injunction */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleIssueCourtStay}
                  disabled={isExecuting}
                  className="flex flex-col items-start rounded-2xl border border-red-200 bg-red-50/70 p-2 text-left transition hover:bg-red-100/70 disabled:opacity-50"
                >
                  <span className="font-bold text-red-950 flex items-center gap-1 text-[11px]">
                    <Gavel size={13} className="text-red-700" />
                    Issue Court Stay
                  </span>
                  <span className="text-[9px] text-red-800/80 mt-0.5">Lock transactions</span>
                </button>

                <button
                  type="button"
                  onClick={handleLiftCourtStay}
                  disabled={isExecuting}
                  className="flex flex-col items-start rounded-2xl border border-emerald-200 bg-emerald-50/70 p-2 text-left transition hover:bg-emerald-100/70 disabled:opacity-50"
                >
                  <span className="font-bold text-emerald-950 flex items-center gap-1 text-[11px]">
                    <Unlock size={13} className="text-emerald-700" />
                    Lift Injunction
                  </span>
                  <span className="text-[9px] text-emerald-800/80 mt-0.5">Unlock title</span>
                </button>
              </div>

              {/* Bank Lien */}
              <button
                type="button"
                onClick={handleCreateBankLien}
                disabled={isExecuting}
                className="w-full flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/70 p-2.5 text-left transition hover:bg-emerald-100/70 disabled:opacity-50"
              >
                <div>
                  <p className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <Landmark size={14} className="text-emerald-700" />
                    Simulate Bank Mortgage Lien
                  </p>
                  <p className="text-[10px] text-emerald-800/80 mt-0.5">
                    Finacle Gateway: Registers charge in RoR Col 11
                  </p>
                </div>
                <span className="text-[10px] font-mono bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                  Finacle
                </span>
              </button>
            </div>
          )}

          {/* TAB 2: FIELD SURVEY & SPLIT */}
          {activeTab === "survey" && (
            <div className="mt-3 space-y-2 text-xs">
              <button
                type="button"
                onClick={handleSimulateGnssSurvey}
                disabled={isExecuting}
                className="w-full flex items-center justify-between rounded-2xl border border-purple-200 bg-purple-50/70 p-2.5 text-left transition hover:bg-purple-100/70 disabled:opacity-50"
              >
                <div>
                  <p className="font-bold text-purple-950 flex items-center gap-1.5">
                    <Radio size={14} className="text-purple-700" />
                    Simulate CORS GNSS Rover
                  </p>
                  <p className="text-[10px] text-purple-800/80 mt-0.5">
                    Streams live GPS coordinates (±3cm precision) to map
                  </p>
                </div>
                <span className="text-[10px] font-mono bg-purple-200/80 text-purple-900 px-2 py-0.5 rounded-full font-bold">
                  RTK
                </span>
              </button>

              <button
                type="button"
                onClick={() => onOpenSubdivision?.()}
                className="w-full flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50/70 p-2.5 text-left transition hover:bg-amber-100/70"
              >
                <div>
                  <p className="font-bold text-amber-950 flex items-center gap-1.5">
                    <Scissors size={14} className="text-amber-700" />
                    Open 11E Cadastral Splitter
                  </p>
                  <p className="text-[10px] text-amber-800/80 mt-0.5">
                    Interactive demarcation sketch & child Sub-ULPINs
                  </p>
                </div>
                <span className="text-[10px] font-mono bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                  Surveyor
                </span>
              </button>
            </div>
          )}

          {/* TAB 3: ADVANCED TOOLS */}
          {activeTab === "tools" && (
            <div className="mt-3 space-y-2 text-xs">
              <button
                type="button"
                onClick={() => onOpenSatelliteSlider?.()}
                className="w-full flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50/70 p-2.5 text-left transition hover:bg-rose-100/70"
              >
                <div className="flex items-center gap-2">
                  <span className="text-rose-700 font-bold">🛰️</span>
                  <div>
                    <p className="font-bold text-rose-950">Bi-Temporal Satellite Slider</p>
                    <p className="text-[10px] text-rose-800/80">Compare 2024 and 2026 satellite imagery</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onOpenSchemaHarmonizer?.()}
                className="w-full flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/70 p-2.5 text-left transition hover:bg-emerald-100/70"
              >
                <div className="flex items-center gap-2">
                  <span className="text-emerald-700 font-bold">🗂️</span>
                  <div>
                    <p className="font-bold text-emerald-950">Multi-State Schema Harmonizer</p>
                    <p className="text-[10px] text-emerald-800/80">TN, KAR, CHD ➔ OGC / JSON-LD</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => onOpenThreeDCadastre?.()}
                className="w-full flex items-center justify-between rounded-2xl border border-purple-200 bg-purple-50/70 p-2.5 text-left transition hover:bg-purple-100/70"
              >
                <div className="flex items-center gap-2">
                  <span className="text-purple-700 font-bold">🏢</span>
                  <div>
                    <p className="font-bold text-purple-950">3D Cadastre / Vertical Strata</p>
                    <p className="text-[10px] text-purple-800/80">Urban multi-storey floor units mapping</p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Quick Persona Switcher inside Dock */}
          <div className="mt-3 border-t pt-2.5 flex items-center justify-between text-[11px] text-earth-600">
            <span className="text-[10px] font-bold uppercase text-earth-500">Quick Persona:</span>
            <div className="flex gap-1">
              {[
                { r: "revenue_officer", label: "Rev" },
                { r: "surveyor", label: "Surv" },
                { r: "sro", label: "SRO" },
                { r: "court", label: "Court" },
                { r: "bank", label: "Bank" }
              ].map(({ r, label }) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => switchRole(r)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    activeRole === r ? "bg-earth-900 text-white" : "bg-earth-100 text-earth-700 hover:bg-earth-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveDemoDock;
