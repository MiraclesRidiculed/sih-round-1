import { useEffect, useRef, useState } from "react";
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Award,
  Building,
  Building2,
  CheckCircle2,
  Clock,
  Compass,
  Copy,
  Cpu,
  Database,
  Download,
  Droplets,
  ExternalLink,
  Eye,
  FileBadge2,
  FileCheck,
  FileText,
  Gavel,
  Landmark,
  Layers,
  Lock,
  MapPinned,
  Printer,
  Radio,
  Scissors,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trees,
  Unlock,
  UserCheck,
  Zap
} from "lucide-react";
import { useLocation, useParams, useSearchParams } from "react-router-dom";
import {
  fetchParcel,
  issueCourtInjunctionApi,
  liftCourtInjunctionApi,
  submitParcelWorkflow
} from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useLiveEvents } from "../context/LiveEventContext";
import RemoteSensingChangeDetectionModal from "../components/RemoteSensingChangeDetectionModal";
import BlockedTransactionModal from "../components/BlockedTransactionModal";
import CadastralSubdivisionModal from "../components/CadastralSubdivisionModal";
import DocumentPanel from "../components/DocumentPanel";
import OwnershipTimeline from "../components/OwnershipTimeline";
import ParcelInfoPanel from "../components/ParcelInfoPanel";
import ParcelMap from "../components/ParcelMap";
import PropertyCardModal from "../components/PropertyCardModal";
import QrPanel from "../components/QrPanel";
import SchemaHarmonizerModal from "../components/SchemaHarmonizerModal";
import ServiceRequestModal from "../components/ServiceRequestModal";
import StatusPill from "../components/StatusPill";
import ThreeDCadastreModal from "../components/ThreeDCadastreModal";
import VerificationPanel from "../components/VerificationPanel";
import { formatArea, ownerLine } from "../utils/format";

const getStateBadge = (state) => {
  if (state === "Tamil Nadu") {
    return <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-900 border border-blue-200">🌾 Tamil Nadu Pilot</span>;
  }
  if (state?.includes("Chandigarh")) {
    return <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 border border-amber-200">🏙️ Chandigarh UT Pilot</span>;
  }
  return <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-900 border border-emerald-200">🌳 Karnataka State</span>;
};

const ParcelDetailPage = () => {
  const { parcelId } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const mapSearchResult = searchParams.get("mapSearch") === "1";
  const { activeRole, permissions } = useAuth();
  const { t } = useLanguage();
  const { refreshKey } = useLiveEvents();

  const [parcel, setParcel] = useState(null);
  const changeDetection = parcel?.unifiedRecord?.modules?.changeDetection?.data;
  const citizenPanelParcelId = useRef(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // overview, governance, disputes, ai, strata, workflows, audit

  // Modals
  const [showPropertyCard, setShowPropertyCard] = useState(false);
  const [showParcelInfoPanel, setShowParcelInfoPanel] = useState(false);
  const [mapFitRequest, setMapFitRequest] = useState(0);
  const [searchFocusRequest, setSearchFocusRequest] = useState(0);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showSubdivisionModal, setShowSubdivisionModal] = useState(false);
  const [showChangeDetails, setShowChangeDetails] = useState(false);
  const [showSchemaHarmonizer, setShowSchemaHarmonizer] = useState(false);
  const [showThreeDCadastre, setShowThreeDCadastre] = useState(false);
  const [blockedData, setBlockedData] = useState(null);

  const [actionLoading, setActionLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const loadParcel = async () => {
    try {
      const data = await fetchParcel(parcelId);
      setParcel(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParcel();
  }, [parcelId, refreshKey]);

  useEffect(() => {
    const firstCitizenVisit = activeRole === "citizen" && parcel && citizenPanelParcelId.current !== parcelId;
    if ((mapSearchResult || firstCitizenVisit) && parcel) {
      setShowParcelInfoPanel(true);
      if (activeRole === "citizen") citizenPanelParcelId.current = parcelId;
    } else if (!mapSearchResult && activeRole !== "citizen") {
      setShowParcelInfoPanel(false);
    }
  }, [location.key, mapSearchResult, activeRole, parcelId, Boolean(parcel)]);

  const copyUlpin = () => {
    if (parcel?.ulpin) {
      navigator.clipboard.writeText(parcel.ulpin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCourtInjunctionToggle = async (action) => {
    setActionLoading(true);
    try {
      if (action === "ISSUE") {
        await issueCourtInjunctionApi(parcel.parcelId, {
          caseNumber: "RA-114/2023",
          courtName: "Assistant Commissioner Revenue Court",
          presidingBench: "Court of the Assistant Commissioner",
          injunctionTerms: "Interim stay restraining sale, registration, conveyance, mutation and boundary alteration under Section 52 Transfer of Property Act pending resolution of boundary suit."
        });
        setStatusMessage("🏛️ Injunction order issued! Transaction lock active.");
      } else {
        await liftCourtInjunctionApi(parcel.parcelId, {
          orderReference: "DISP-2026-092",
          remarks: "Compromise recorded; stay vacated."
        });
        setStatusMessage("🔓 Injunction vacated! Transactions unlocked.");
      }
      loadParcel();
    } catch (err) {
      setStatusMessage(err.response?.data?.message || "Error modifying court status");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !parcel) {
    return (
      <div className="rounded-[2.5rem] border border-white/60 bg-white/80 p-12 text-center text-earth-800">
        <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-amber-900 border-t-transparent" />
        <p className="font-bold text-lg">Retrieving Land Stack Cadastral Dossier...</p>
        <p className="text-xs text-earth-600 mt-1">Synchronizing 3 Spatial Layers, RCCMS, and Sepolia trail</p>
      </div>
    );
  }

  if (activeRole !== "admin") {
    return (
      <main className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {activeRole === "citizen" ? "Citizen land records" : `${activeRole.replaceAll("_", " ")} parcel workspace`}
            </p>
            <h2 className="mt-1 text-xl font-bold text-[#0B2545]">
              {activeRole === "citizen" ? "Parcel location and record information" : "Parcel location and permitted record information"}
            </h2>
          </div>
          {!showParcelInfoPanel && (
            <button
              type="button"
              onClick={() => {
                setShowParcelInfoPanel(true);
                setSearchFocusRequest((request) => request + 1);
              }}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2545]"
            >
              View Parcel Information
            </button>
          )}
        </div>
        <div className={showParcelInfoPanel ? "grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]" : ""}>
          <ParcelMap
            parcel={parcel}
            height="min(68vh, 680px)"
            fitRequest={mapFitRequest}
            searchFocusRequest={searchFocusRequest}
            restrictedView={activeRole !== "admin"}
            role={activeRole}
          />
          {showParcelInfoPanel && (
            <ParcelInfoPanel
              parcel={parcel}
              citizen={activeRole === "citizen"}
              role={activeRole}
              onRefresh={loadParcel}
              onClose={() => {
                setShowParcelInfoPanel(false);
                setSearchFocusRequest((request) => request + 1);
              }}
              onZoomToParcel={() => setMapFitRequest((request) => request + 1)}
              onSearchAnother={() => setSearchFocusRequest((request) => request + 1)}
            />
          )}
        </div>
      </main>
    );
  }

  const isCourtLocked = Boolean(parcel.disputeRecord?.transactionLock || parcel.essentialLayers?.ror?.revenueCourtDispute);
  const dispute = parcel.disputeRecord || {};
  const hasSubdivision = Boolean(parcel.subdivisionData?.isSubdivided);
  const has3D = Boolean(parcel.verticalStrata?.hasVerticalUnits || parcel.state?.includes("Chandigarh"));

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Status Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            {getStateBadge(parcel.state)}
            <span className="text-xs font-semibold text-earth-600 flex items-center gap-1">
              <MapPinned size={13} />
              {parcel.village}, {parcel.taluk}, {parcel.district}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black text-earth-950">{parcel.parcelId}</h1>

            {/* 14-Digit ULPIN Pill */}
            {parcel.ulpin && (
              <button
                type="button"
                onClick={copyUlpin}
                className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/80 px-3 py-1 font-mono text-xs font-bold text-amber-900 border border-amber-300 transition hover:bg-amber-200"
              >
                <span>ULPIN: {parcel.ulpin}</span>
                <Copy size={11} className={copied ? "text-emerald-700" : "text-amber-700"} />
                {copied && <span className="text-[10px] text-emerald-800 font-sans">Copied!</span>}
              </button>
            )}

            {/* Transaction Lock Alert Badge */}
            {isCourtLocked && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-3 py-1 text-xs font-black text-white shadow-sm">
                <Lock size={12} />
                🚨 Court Stay Active: Section 52 Lis Pendens
              </span>
            )}
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Subdivide Button for Surveyor / Officer */}
          <button
            type="button"
            onClick={() => setShowSubdivisionModal(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-900 shadow-xs hover:bg-amber-100"
          >
            <Scissors size={14} />
            {hasSubdivision ? "View 11E Subdivision" : "Subdivide (11E)"}
          </button>

          {/* Official Property Card Modal */}
          <button
            type="button"
            onClick={() => setShowPropertyCard(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-earth-900 px-4 py-2 text-xs font-bold text-white shadow hover:bg-earth-800"
          >
            <Printer size={14} />
            Bhu-Aadhaar Card
          </button>

          {/* Citizen Services Modal */}
          <button
            type="button"
            onClick={() => setShowServiceModal(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-800"
          >
            <Send size={14} />
            Citizen Request
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className="rounded-2xl border border-blue-300 bg-blue-50 p-3 text-xs font-semibold text-blue-900">
          {statusMessage}
        </div>
      )}

      {/* Main Interactive GIS Canvas */}
      <div className={mapSearchResult && showParcelInfoPanel ? "grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]" : ""}>
        <ParcelMap
          parcel={parcel}
          height="460px"
          fitRequest={mapFitRequest}
          searchFocusRequest={searchFocusRequest}
        />
        {mapSearchResult && showParcelInfoPanel && (
          <ParcelInfoPanel
            parcel={parcel}
            role={activeRole}
            citizen={activeRole === "citizen"}
            onRefresh={loadParcel}
            onClose={() => {
              setShowParcelInfoPanel(false);
              setSearchFocusRequest((request) => request + 1);
            }}
            onZoomToParcel={() => setMapFitRequest((request) => request + 1)}
            onSearchAnother={() => setSearchFocusRequest((request) => request + 1)}
          />
        )}
      </div>

      {/* Progressive Disclosure Tabs Bar */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-earth-100/80 p-1 text-xs font-bold border border-earth-200">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 transition ${
            activeTab === "overview" ? "bg-earth-900 text-white shadow-xs" : "text-earth-700 hover:bg-earth-200"
          }`}
        >
          <Layers size={14} />
          Cadastral Overview
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("governance")}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 transition ${
            activeTab === "governance" ? "bg-earth-900 text-white shadow-xs" : "text-earth-700 hover:bg-earth-200"
          }`}
        >
          <FileText size={14} />
          Essential Governance (RRR)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("disputes")}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 transition ${
            activeTab === "disputes"
              ? "bg-red-700 text-white shadow-xs"
              : isCourtLocked
              ? "bg-red-100 text-red-900 hover:bg-red-200"
              : "text-earth-700 hover:bg-earth-200"
          }`}
        >
          <Gavel size={14} />
          Legal & RCCMS Disputes
          {isCourtLocked && <span className="h-2 w-2 rounded-full bg-red-500" />}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("ai")}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 transition ${
            activeTab === "ai" ? "bg-earth-900 text-white shadow-xs" : "text-earth-700 hover:bg-earth-200"
          }`}
        >
          <Zap size={14} />
          Remote Sensing Change Detection
        </button>

        {has3D && (
          <button
            type="button"
            onClick={() => setActiveTab("strata")}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2 transition ${
              activeTab === "strata" ? "bg-purple-900 text-white shadow-xs" : "text-purple-900 hover:bg-purple-100"
            }`}
          >
            <Building2 size={14} />
            3D Vertical Strata
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab("workflows")}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 transition ${
            activeTab === "workflows" ? "bg-earth-900 text-white shadow-xs" : "text-earth-700 hover:bg-earth-200"
          }`}
        >
          <Clock size={14} />
          Inter-Agency Workflows
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("audit")}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-2 transition ${
            activeTab === "audit" ? "bg-earth-900 text-white shadow-xs" : "text-earth-700 hover:bg-earth-200"
          }`}
        >
          <ShieldCheck size={14} />
          Sepolia Blockchain Audit
        </button>
      </div>

      {/* TAB CONTENT AREAS */}

      {/* 1. OVERVIEW & CADASTRE TAB */}
      {activeTab === "overview" && (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-panel">
            <h3 className="font-bold text-earth-900 text-sm uppercase tracking-wider">Administrative Hierarchy</h3>
            <div className="mt-3 space-y-2 text-xs text-earth-800">
              <p><span className="text-earth-500">State:</span> <strong>{parcel.state}</strong></p>
              <p><span className="text-earth-500">District:</span> {parcel.district}</p>
              <p><span className="text-earth-500">Taluk / Tehsil:</span> {parcel.taluk}</p>
              <p><span className="text-earth-500">Hobli / Firka:</span> {parcel.hobli}</p>
              <p><span className="text-earth-500">Village / Sector:</span> {parcel.village}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-panel">
            <h3 className="font-bold text-earth-900 text-sm uppercase tracking-wider">Cadastral Specifications</h3>
            <div className="mt-3 space-y-2 text-xs text-earth-800">
              <p><span className="text-earth-500">Survey Number:</span> <strong>{parcel.surveyNumber}</strong></p>
              <p><span className="text-earth-500">Hissa / Sub-div:</span> {parcel.hissaNumber || "None"}</p>
              <p><span className="text-earth-500">Khata / Patta:</span> {parcel.khataNumber || "N/A"}</p>
              <p><span className="text-earth-500">Total Extent:</span> <strong>{formatArea(parcel.areaInAcres)}</strong> ({parcel.baseLayer?.localAreaUnit || ""})</p>
              <p><span className="text-earth-500">Precision:</span> GNSS CORS RTK (±5cm)</p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/70 bg-white/85 p-5 shadow-panel">
            <h3 className="font-bold text-earth-900 text-sm uppercase tracking-wider">Rights Holders</h3>
            <div className="mt-3 space-y-2 text-xs text-earth-800">
              {parcel.currentOwners?.map((owner, idx) => (
                <div key={idx} className="rounded-xl bg-earth-50 p-2.5">
                  <p className="font-bold text-earth-950">{owner.name}</p>
                  <p className="text-[11px] text-earth-600">{owner.relation} • {owner.sharePercent}% Share</p>
                  <p className="font-mono text-[10px] text-earth-500">Aadhaar Vault: {owner.identifierMasked}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. ESSENTIAL GOVERNANCE & RRR TAB */}
      {activeTab === "governance" && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl border border-blue-200 bg-blue-50/60 p-5 shadow-sm">
              <h3 className="font-bold text-blue-950 text-sm uppercase tracking-wider">Record of Rights (RoR)</h3>
              <div className="mt-3 space-y-1.5 text-xs text-earth-800">
                <p><span className="text-earth-500">Ref:</span> {parcel.essentialLayers?.ror?.rorNumber || "Patta Verified"}</p>
                <p><span className="text-earth-500">Holder:</span> {parcel.essentialLayers?.ror?.holderName || parcel.currentOwners[0]?.name}</p>
                <p><span className="text-earth-500">Subdivision:</span> {parcel.essentialLayers?.ror?.subDivisionStatus || "Sanctioned"}</p>
                <p><span className="text-earth-500">Demand Year:</span> {parcel.essentialLayers?.ror?.landTaxDemandYear || "2025-26"}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-amber-200 bg-amber-50/60 p-5 shadow-sm">
              <h3 className="font-bold text-amber-950 text-sm uppercase tracking-wider">Master Plan Zoning</h3>
              <div className="mt-3 space-y-1.5 text-xs text-earth-800">
                <p><span className="text-earth-500">Authority:</span> {parcel.essentialLayers?.masterPlanZoning?.authority || "Planning Authority"}</p>
                <p><span className="text-earth-500">Category:</span> <strong>{parcel.essentialLayers?.masterPlanZoning?.zoneCategory}</strong></p>
                <p><span className="text-earth-500">Permissible FAR:</span> {parcel.essentialLayers?.masterPlanZoning?.permissibleFar}</p>
                <p><span className="text-earth-500">Setback:</span> {parcel.essentialLayers?.masterPlanZoning?.setbackFront || "Standard"}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-5 shadow-sm">
              <h3 className="font-bold text-emerald-950 text-sm uppercase tracking-wider">Liabilities & Mortgages</h3>
              <div className="mt-3 space-y-1.5 text-xs text-earth-800">
                <p><span className="text-earth-500">Lien Status:</span> {parcel.essentialLayers?.encumbrance?.hasMortgage ? "⚠️ Active Bank Charge" : "✅ Clear Title"}</p>
                {parcel.essentialLayers?.encumbrance?.hasMortgage && (
                  <>
                    <p><span className="text-earth-500">Lender:</span> {parcel.essentialLayers.encumbrance.lenderName}</p>
                    <p><span className="text-earth-500">Amount:</span> <strong>{parcel.essentialLayers.encumbrance.mortgageAmount}</strong></p>
                  </>
                )}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* 3. LEGAL & RCCMS DISPUTES TAB */}
      {activeTab === "disputes" && (
        <div className="space-y-6">
          {/* Dispute Status Card */}
          <div className={`rounded-3xl border p-6 shadow-sm ${
            isCourtLocked ? "border-red-300 bg-red-50/70" : "border-emerald-200 bg-emerald-50/70"
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-red-200 pb-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white ${
                  isCourtLocked ? "bg-red-600 shadow-md shadow-red-600/20" : "bg-emerald-600"
                }`}>
                  <Gavel size={24} />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-earth-500">
                    Revenue Court Case Management System (RCCMS)
                  </span>
                  <h3 className="text-lg font-black text-earth-950">
                    {isCourtLocked ? "ACTIVE REVENUE COURT INJUNCTION & TRANSACTION LOCK" : "NO ACTIVE LITIGATION / CLEAR STATUTORY TITLE"}
                  </h3>
                </div>
              </div>

              {/* Court Role Controls */}
              <div className="flex items-center gap-2">
                {isCourtLocked ? (
                  <button
                    type="button"
                    onClick={() => handleCourtInjunctionToggle("LIFT")}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1.5 rounded-full bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow hover:bg-emerald-800"
                  >
                    <Unlock size={14} />
                    Vacate Injunction (Court Bench)
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleCourtInjunctionToggle("ISSUE")}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1.5 rounded-full bg-red-700 px-4 py-2 text-xs font-bold text-white shadow hover:bg-red-800"
                  >
                    <Lock size={14} />
                    Issue Interim Injunction (RCCMS)
                  </button>
                )}
              </div>
            </div>

            {/* Injunction Case Details */}
            {isCourtLocked && (
              <div className="mt-5 grid gap-4 text-xs sm:grid-cols-2 md:grid-cols-4">
                <div className="rounded-2xl bg-white p-3.5 border border-red-200">
                  <span className="text-[10px] font-bold text-earth-500 uppercase">Case Number</span>
                  <p className="mt-1 font-mono font-black text-red-950 text-sm">{dispute.caseNumber || "RA-114/2023"}</p>
                </div>

                <div className="rounded-2xl bg-white p-3.5 border border-red-200">
                  <span className="text-[10px] font-bold text-earth-500 uppercase">Issuing Court</span>
                  <p className="mt-1 font-bold text-earth-900">{dispute.courtName || "Belagavi AC Court"}</p>
                </div>

                <div className="rounded-2xl bg-white p-3.5 border border-red-200">
                  <span className="text-[10px] font-bold text-earth-500 uppercase">Presiding Bench</span>
                  <p className="mt-1 font-bold text-earth-900">{dispute.presidingBench || "Assistant Commissioner"}</p>
                </div>

                <div className="rounded-2xl bg-white p-3.5 border border-red-200">
                  <span className="text-[10px] font-bold text-earth-500 uppercase">Next Hearing</span>
                  <p className="mt-1 font-bold text-earth-900">{dispute.nextHearing || "2026-11-12"}</p>
                </div>

                <div className="sm:col-span-2 md:col-span-4 rounded-2xl bg-white p-4 border border-red-200">
                  <span className="text-[10px] font-bold text-earth-500 uppercase">Injunction Terms & Order Summary</span>
                  <p className="mt-1 text-earth-800 italic leading-relaxed">
                    "{dispute.injunctionTerms || "Interim order restraining sale, conveyance, gift, lease, mutation or boundary alteration under Section 52 Transfer of Property Act pending suit."}"
                  </p>
                  <p className="mt-2 text-[10px] font-mono text-red-800">
                    Order Ref: {dispute.orderReference || "AC/BGM/REV/RA-114"} • Blocked Unlawful Registry Attempts: {dispute.blockedAttemptsCount || 0}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. REMOTE SENSING CHANGE DETECTION TAB */}
      {activeTab === "ai" && (
        <div className="space-y-5">
        <div className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-800 text-xl shadow-xs">
                🛰️
              </span>
              <div>
                <h3 className="text-lg font-black text-earth-950">Remote Sensing Change Detection</h3>
                <p className="text-xs text-earth-600">Parcel-associated prototype analysis from local demonstration records</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowChangeDetails(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-rose-700 px-4 py-2 text-xs font-bold text-white shadow hover:bg-rose-800"
            >
              <Eye size={14} />
              View change details
            </button>
          </div>

          <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-950">
            Simulated sample analysis only. No real satellite imagery or remote-sensing provider is connected; this is not authoritative intelligence.
          </p>

          <div className="grid gap-4 sm:grid-cols-3 text-xs">
            <div className="rounded-2xl bg-rose-50 p-4 border border-rose-200">
              <span className="font-bold text-rose-900 uppercase tracking-wider">Detected change</span>
              <p className="mt-1 text-sm font-black text-rose-950">
                {changeDetection?.status === "change-detected"
                  ? changeDetection.detectedChange
                  : changeDetection?.status === "no-change-recorded"
                    ? "No change recorded in sample analysis"
                    : "No sample analysis available"}
              </p>
            </div>

            <div className="rounded-2xl bg-amber-50 p-4 border border-amber-200">
              <span className="font-bold text-amber-900 uppercase tracking-wider">Confidence</span>
              <p className="mt-1 text-2xl font-black text-amber-950">Not calculated</p>
            </div>

            <div className="rounded-2xl bg-blue-50 p-4 border border-blue-200">
              <span className="font-bold text-blue-900 uppercase tracking-wider">Detection / recorded pass date · change area</span>
              <p className="mt-1 text-sm font-black text-blue-950">{changeDetection?.detectionDate || "Not available"} · {changeDetection?.changeAreaSqM != null ? `${changeDetection.changeAreaSqM} m²` : "Area not available"}</p>
            </div>
          </div>
          {changeDetection?.sourceImagery && (
            <p className="text-xs text-earth-700">
              <strong>Recorded imagery metadata:</strong> {Object.entries(changeDetection.sourceImagery)
                .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
                .join(" · ")}
            </p>
          )}
        </div>
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-lg font-bold text-[#0B2545]">Decision-support signals</h3>
              <p className="mt-1 text-xs text-slate-600">
                Deterministic rules over available application records; not a predictive ML model.
              </p>
            </div>
            {parcel.unifiedRecord?.modules?.decisionSupport?.data?.generatedAt && (
              <p className="text-xs text-slate-600">Report time: {parcel.unifiedRecord.modules.decisionSupport.data.generatedAt}</p>
            )}
          </div>
          {parcel.unifiedRecord?.modules?.decisionSupport?.data ? (
            <>
              <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
                Decision support only. Signals may be incomplete or false positives and are not legal, ownership, registration, or enforcement decisions. Confidence is not calculated or validated.
              </p>
              {parcel.unifiedRecord.modules.decisionSupport.data.findings.length ? (
                <ul className="mt-4 space-y-3">
                  {parcel.unifiedRecord.modules.decisionSupport.data.findings.map((finding) => (
                    <li key={finding.code} className="rounded-xl border border-slate-200 p-4">
                      <h4 className="text-sm font-semibold text-slate-900">{finding.detected}</h4>
                      <p className="mt-1 text-xs leading-5 text-slate-700">{finding.explanation}</p>
                      <p className="mt-2 text-xs font-medium text-slate-600">
                        Confidence: not calculated · Recorded: {finding.timestamp}
                      </p>
                      <div className="mt-2 space-y-1 text-xs text-slate-600">
                        {finding.sourceData.map((source, index) => (
                          <p key={`${finding.code}-${source.record}-${index}`}>
                            <span className="font-semibold">{source.record}:</span>{" "}
                            {Object.entries(source.fields)
                              .map(([field, value]) => `${field}=${Array.isArray(value) ? value.join(", ") : value ?? "not recorded"}`)
                              .join(" · ")}
                          </p>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-slate-700">No configured decision-support rules were triggered by the available records.</p>
              )}
              <p className="mt-4 text-xs text-slate-500">
                Source: {parcel.unifiedRecord.modules.decisionSupport.data.algorithm.name} · {parcel.unifiedRecord.modules.decisionSupport.data.generatedAt}
              </p>
            </>
          ) : (
            <p className="mt-4 text-sm text-slate-700">
              Decision-support details are not available for this role or parcel.
            </p>
          )}
        </section>
        </div>
      )}

      {/* 5. 3D VERTICAL STRATA TAB */}
      {activeTab === "strata" && has3D && (
        <div className="rounded-3xl border border-purple-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-[10px] font-bold text-purple-900 uppercase">
                DoLR SIH26011 Research Focus
              </span>
              <h3 className="text-lg font-black text-earth-950 mt-1">
                {parcel.verticalStrata?.buildingName || "Urban Multi-Storey Commercial Strata"}
              </h3>
              <p className="text-xs text-earth-600">3D Sub-ULPINs for apartments and vertical office suites</p>
            </div>

            <button
              type="button"
              onClick={() => setShowThreeDCadastre(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-purple-900 px-4 py-2 text-xs font-bold text-white shadow hover:bg-purple-800"
            >
              <Building2 size={14} />
              Open Interactive 3D Strata Stack
            </button>
          </div>

          <div className="rounded-2xl bg-purple-50 p-4 text-xs text-purple-950 leading-relaxed">
            This parcel contains <strong>{parcel.verticalStrata?.totalFloors || 4} vertical floors</strong> and multiple individual property units mapped upwards from the surface 2D cadastral footprint.
          </div>
        </div>
      )}

      {/* 6. INTER-AGENCY WORKFLOWS TAB */}
      {activeTab === "workflows" && (
        <div className="rounded-3xl border border-white/70 bg-white/85 p-6 shadow-panel">
          <h3 className="font-extrabold text-earth-950 text-base mb-4">Inter-Agency Cross-Departmental Log</h3>
          <div className="space-y-3">
            {parcel.departmentalWorkflows?.map((wf, idx) => (
              <div key={idx} className="rounded-2xl border border-earth-200 bg-earth-50/70 p-4 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-earth-200 px-2.5 py-0.5 text-[10px] font-bold text-earth-900">
                      {wf.department}
                    </span>
                    <h4 className="font-bold text-earth-950">{wf.title}</h4>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                    wf.status?.toLowerCase().includes("blocked")
                      ? "bg-red-100 text-red-900 border border-red-300"
                      : "bg-emerald-100 text-emerald-900"
                  }`}>
                    {wf.status}
                  </span>
                </div>
                <p className="mt-2 text-earth-700">{wf.remarks}</p>
                <div className="mt-2 flex flex-wrap items-center justify-between text-[10px] text-earth-500 font-mono">
                  <span>Applicant: {wf.applicant}</span>
                  <span>Tx: {wf.txHash?.slice(0, 16)}...</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 7. BLOCKCHAIN AUDIT TRAIL TAB */}
      {activeTab === "audit" && (
        <div className="space-y-6">
          <OwnershipTimeline history={parcel.ownershipHistory} />
          <DocumentPanel documents={parcel.documents} parcelId={parcel.parcelId} onAnchored={loadParcel} />
          <VerificationPanel verification={parcel.verification} />
          <QrPanel qr={parcel.qr} />
        </div>
      )}

      {/* MODALS */}
      {showPropertyCard && (
        <PropertyCardModal parcel={parcel} onClose={() => setShowPropertyCard(false)} />
      )}

      {showServiceModal && (
        <ServiceRequestModal
          parcel={parcel}
          onClose={() => setShowServiceModal(false)}
          onSubmitted={loadParcel}
        />
      )}

      {showSubdivisionModal && (
        <CadastralSubdivisionModal
          parcel={parcel}
          onClose={() => setShowSubdivisionModal(false)}
          onUpdated={loadParcel}
        />
      )}

      {showChangeDetails && (
        <RemoteSensingChangeDetectionModal
          parcel={parcel}
          onClose={() => setShowChangeDetails(false)}
        />
      )}

      {showSchemaHarmonizer && (
        <SchemaHarmonizerModal onClose={() => setShowSchemaHarmonizer(false)} />
      )}

      {showThreeDCadastre && (
        <ThreeDCadastreModal parcel={parcel} onClose={() => setShowThreeDCadastre(false)} />
      )}

      {blockedData && (
        <BlockedTransactionModal
          parcel={parcel}
          errorData={blockedData}
          onClose={() => setBlockedData(null)}
        />
      )}

    </div>
  );
};

export default ParcelDetailPage;
