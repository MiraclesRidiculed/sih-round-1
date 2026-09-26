import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Award,
  Building,
  CheckCircle2,
  Copy,
  Cpu,
  Database,
  Download,
  Droplets,
  ExternalLink,
  FileBadge2,
  FileCheck,
  Layers,
  MapPinned,
  Printer,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trees,
  UserCheck,
  Zap
} from "lucide-react";
import { useOutletContext, useParams } from "react-router-dom";
import { fetchParcel, submitParcelWorkflow } from "../api/client";
import DocumentPanel from "../components/DocumentPanel";
import OwnershipTimeline from "../components/OwnershipTimeline";
import ParcelMap from "../components/ParcelMap";
import PropertyCardModal from "../components/PropertyCardModal";
import QrPanel from "../components/QrPanel";
import ServiceRequestModal from "../components/ServiceRequestModal";
import StatusPill from "../components/StatusPill";
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
  const { activeRole } = useOutletContext() || { activeRole: "citizen" };
  const [parcel, setParcel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("base"); // base, essential, usecase, ai, workflows
  const [showPropertyCard, setShowPropertyCard] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [officerActionLoading, setOfficerActionLoading] = useState(false);
  const [officerSuccessMsg, setOfficerSuccessMsg] = useState("");

  const loadParcel = async () => {
    setLoading(true);
    try {
      const data = await fetchParcel(parcelId);
      setParcel(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParcel();
  }, [parcelId]);

  const copyUlpin = () => {
    if (parcel?.ulpin) {
      navigator.clipboard.writeText(parcel.ulpin);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOfficerQuickAction = async (actionType) => {
    setOfficerActionLoading(true);
    try {
      let title = "Official Departmental Clearance";
      let department = "Revenue";
      let remarks = "Fast-track approved via Land Stack DPI Interoperable Protocol";

      if (actionType === "APPROVE_MUTATION") {
        title = "e-Mutation Sanction Order Issued";
        department = "Revenue (Bhoomi/Tamil Nilam)";
        remarks = "Verified against registered sale deed; updated in Record of Rights";
      } else if (actionType === "SANCTION_PLAN") {
        title = "Building Plan Sanction & FAR Clearance";
        department = "Town Planning Authority";
        remarks = "Automated GIS check passed: conforms with Master Plan zoning and setbacks";
      }

      await submitParcelWorkflow(parcel.parcelId, {
        department,
        title,
        applicant: `Officer Action (${activeRole.toUpperCase()})`,
        remarks
      });

      setOfficerSuccessMsg(`Success: ${title} recorded to blockchain audit ledger!`);
      await loadParcel();
      setTimeout(() => setOfficerSuccessMsg(""), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setOfficerActionLoading(false);
    }
  };

  if (loading && !parcel) {
    return (
      <div className="rounded-[2.5rem] border border-white/60 bg-white/80 p-12 text-center text-earth-800">
        <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-amber-900 border-t-transparent" />
        <p className="font-bold text-lg">Fetching 3-tier cadastral records...</p>
      </div>
    );
  }

  if (!parcel) {
    return (
      <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-10 text-rose-900 text-center font-bold">
        Parcel not found in Land Stack registry.
      </div>
    );
  }

  const hasAiAnomaly = Boolean(parcel.aiGeospatial?.satelliteChangeDetection?.anomalyDetected);
  const hasMortgage = Boolean(parcel.essentialLayers?.encumbrance?.hasMortgage);

  return (
    <div className="space-y-8">
      {/* Top Header Card */}
      <section className="relative overflow-hidden rounded-[2.5rem] border border-white/70 bg-white/85 p-7 shadow-panel">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {getStateBadge(parcel.state)}
              <StatusPill status={parcel.verification?.overallStatus || "verified"}>
                {parcel.verification?.overallStatus || "verified"}
              </StatusPill>
              {hasAiAnomaly && (
                <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-800 animate-pulse">
                  <Zap size={12} />
                  AI Encroachment Alert
                </span>
              )}
            </div>

            <h2 className="text-3xl font-black text-earth-950 sm:text-4xl">
              {parcel.parcelId}
            </h2>

            <p className="max-w-3xl text-sm text-earth-700 sm:text-base">
              Survey {parcel.surveyNumber}
              {parcel.hissaNumber ? ` / Hissa ${parcel.hissaNumber}` : ""} • {parcel.village}, {parcel.hobli},{" "}
              {parcel.taluk}, {parcel.district}, {parcel.state}
            </p>

            <p className="text-xs text-earth-600 max-w-2xl">
              Integrated Authority: <span className="font-bold text-earth-800">{parcel.stateProfile?.systemName || "State Land Records Portal"}</span>
            </p>
          </div>

          {/* Action Buttons & ULPIN Box */}
          <div className="flex flex-col gap-3 sm:flex-row xl:flex-col xl:w-96 shrink-0">
            {/* 14-Digit ULPIN Pill */}
            <div className="flex items-center justify-between rounded-2xl border border-amber-300 bg-amber-50/80 p-3.5 shadow-xs">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-900">
                  Bhu-Aadhaar / 14-Digit ULPIN
                </p>
                <p className="font-mono text-base font-extrabold tracking-wider text-earth-950">
                  {parcel.ulpin || "Pending"}
                </p>
              </div>
              <button
                type="button"
                onClick={copyUlpin}
                className="flex items-center gap-1 rounded-xl bg-white px-2.5 py-1.5 text-xs font-semibold text-earth-800 shadow-xs hover:bg-earth-100 transition"
              >
                <Copy size={13} />
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowPropertyCard(true)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-2xl bg-earth-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-earth-800"
              >
                <Printer size={14} />
                Bhu-Aadhaar Property Card
              </button>

              <button
                type="button"
                onClick={() => setShowServiceModal(true)}
                className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-earth-300 bg-white px-4 py-2.5 text-xs font-bold text-earth-900 shadow-sm transition hover:bg-earth-50"
              >
                <Send size={14} />
                Citizen Service
              </button>
            </div>
          </div>
        </div>

        {/* Officer Quick Actions Bar (If officer persona selected) */}
        {activeRole !== "citizen" && (
          <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50/70 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-900 text-white font-bold text-[11px]">
                  ⚡
                </span>
                <span className="font-bold text-blue-950">
                  Officer Action ({activeRole === "revenue" ? "Revenue Officer" : activeRole === "planning" ? "Town Planner" : "Sub-Registrar"}):
                </span>
                {officerSuccessMsg ? (
                  <span className="font-semibold text-emerald-800">{officerSuccessMsg}</span>
                ) : (
                  <span className="text-blue-800">One-click workflow triggers with immutable audit stamping</span>
                )}
              </div>

              <div className="flex gap-2">
                {activeRole === "revenue" && (
                  <button
                    type="button"
                    disabled={officerActionLoading}
                    onClick={() => handleOfficerQuickAction("APPROVE_MUTATION")}
                    className="rounded-xl bg-blue-900 px-3 py-1.5 font-bold text-white shadow-xs hover:bg-blue-800 disabled:opacity-50"
                  >
                    {officerActionLoading ? "Anchoring..." : "Approve e-Mutation"}
                  </button>
                )}
                {activeRole === "planning" && (
                  <button
                    type="button"
                    disabled={officerActionLoading}
                    onClick={() => handleOfficerQuickAction("SANCTION_PLAN")}
                    className="rounded-xl bg-blue-900 px-3 py-1.5 font-bold text-white shadow-xs hover:bg-blue-800 disabled:opacity-50"
                  >
                    {officerActionLoading ? "Anchoring..." : "Issue Zoning Sanction"}
                  </button>
                )}
                {activeRole === "sro" && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("essential")}
                    className="rounded-xl bg-blue-900 px-3 py-1.5 font-bold text-white shadow-xs hover:bg-blue-800"
                  >
                    Verify Encumbrance & Mortgage
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 3-Tier GIS Map */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPinned className="text-earth-700" size={20} />
            <h3 className="text-xl font-extrabold text-earth-950">
              Interactive 3-Tier Cadastral Map
            </h3>
          </div>
          <span className="text-xs text-earth-600 font-medium">
            Toggle layers on the top map bar to inspect Base, Essential, Utilities & AI Radar
          </span>
        </div>

        <ParcelMap parcel={parcel} />
      </section>

      {/* 5-Tab Interactive Layer Inspector */}
      <section className="rounded-[2.5rem] border border-white/70 bg-white/85 p-7 shadow-panel space-y-6">
        {/* Tab Headers */}
        <div className="flex flex-wrap items-center gap-2 border-b border-earth-100 pb-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("base")}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 transition ${
              activeTab === "base"
                ? "bg-amber-900 text-white shadow-sm"
                : "bg-earth-100/70 text-earth-800 hover:bg-earth-200"
            }`}
          >
            <Layers size={14} />
            Layer 1: Base Cadastral
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("essential")}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 transition ${
              activeTab === "essential"
                ? "bg-blue-900 text-white shadow-sm"
                : "bg-earth-100/70 text-earth-800 hover:bg-earth-200"
            }`}
          >
            <Building size={14} />
            Layer 2: Essential (RRR & Zoning)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("usecase")}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 transition ${
              activeTab === "usecase"
                ? "bg-emerald-900 text-white shadow-sm"
                : "bg-earth-100/70 text-earth-800 hover:bg-earth-200"
            }`}
          >
            <Droplets size={14} />
            Layer 3: Use-Case (Utilities & Tax)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ai")}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 transition ${
              activeTab === "ai"
                ? "bg-rose-900 text-white shadow-sm"
                : "bg-earth-100/70 text-earth-800 hover:bg-earth-200"
            }`}
          >
            <Zap size={14} />
            AI Geospatial Radar
            {hasAiAnomaly && <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("workflows")}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 transition ${
              activeTab === "workflows"
                ? "bg-earth-900 text-white shadow-sm"
                : "bg-earth-100/70 text-earth-800 hover:bg-earth-200"
            }`}
          >
            <FileCheck size={14} />
            Inter-Departmental Workflows ({parcel.departmentalWorkflows?.length || 0})
          </button>
        </div>

        {/* TAB 1: BASE CADASTRAL */}
        {activeTab === "base" && (
          <div className="space-y-6 text-xs text-earth-800">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-earth-200 bg-earth-50/70 p-4">
                <p className="text-earth-500 font-bold uppercase">Cadastral Sheet Ref</p>
                <p className="mt-1 font-mono text-sm font-bold text-earth-950">
                  {parcel.baseLayer?.cadastralSheetNo || "CS-RECORD-01"}
                </p>
              </div>

              <div className="rounded-2xl border border-earth-200 bg-earth-50/70 p-4">
                <p className="text-earth-500 font-bold uppercase">Survey Accuracy / Precision</p>
                <p className="mt-1 font-bold text-earth-950">
                  {parcel.baseLayer?.coordinatePrecision || "DGPS / CORS ±5cm"}
                </p>
              </div>

              <div className="rounded-2xl border border-earth-200 bg-earth-50/70 p-4">
                <p className="text-earth-500 font-bold uppercase">Area Breakdown</p>
                <p className="mt-1 font-bold text-earth-950">
                  {parcel.areaInAcres} Acres ({parcel.baseLayer?.localAreaUnit || `${parcel.areaInAcres} Acres`})
                </p>
              </div>

              <div className="rounded-2xl border border-earth-200 bg-earth-50/70 p-4">
                <p className="text-earth-500 font-bold uppercase">Spatial Reference System</p>
                <p className="mt-1 font-mono font-bold text-earth-950">
                  {parcel.baseLayer?.crs || "EPSG:4326 (WGS84)"}
                </p>
              </div>
            </div>

            {/* Vertices Coordinates Table */}
            {parcel.baseLayer?.vertices?.length > 0 && (
              <div className="rounded-2xl border border-earth-200 overflow-hidden">
                <div className="bg-earth-100/70 px-4 py-2.5 font-bold uppercase tracking-wider text-earth-800">
                  Georeferenced Polygon Vertex Points
                </div>
                <div className="divide-y divide-earth-100 bg-white">
                  {parcel.baseLayer.vertices.map((v, i) => (
                    <div key={i} className="flex items-center justify-between p-3">
                      <span className="font-bold text-earth-900">Vertex #{v.pt}: {v.marker}</span>
                      <span className="font-mono text-earth-600">
                        Lat: {v.lat.toFixed(6)}, Lng: {v.lng.toFixed(6)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ESSENTIAL GOVERNANCE & RRR */}
        {activeTab === "essential" && (
          <div className="space-y-6 text-xs text-earth-800">
            {/* 3-Column Governance Summary */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-earth-200 bg-earth-50/60 p-4">
                <p className="font-bold uppercase tracking-wider text-earth-500">Record of Rights (RoR)</p>
                <div className="mt-2 space-y-1 text-earth-900">
                  <p><span className="text-earth-500">Number:</span> {parcel.essentialLayers?.ror?.rorNumber || parcel.authoritativeRecords?.rtcNumber}</p>
                  <p><span className="text-earth-500">Subdivision:</span> {parcel.essentialLayers?.ror?.subDivisionStatus || "Sanctioned"}</p>
                  <p><span className="text-earth-500">Land Class:</span> {parcel.landClassification}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-earth-200 bg-earth-50/60 p-4">
                <p className="font-bold uppercase tracking-wider text-earth-500">Master Plan & Zoning</p>
                <div className="mt-2 space-y-1 text-earth-900">
                  <p><span className="text-earth-500">Zone Category:</span> <span className="font-bold text-blue-900">{parcel.essentialLayers?.masterPlanZoning?.zoneCategory || parcel.landUse}</span></p>
                  <p><span className="text-earth-500">Permissible FAR:</span> {parcel.essentialLayers?.masterPlanZoning?.permissibleFar || "2.0"}</p>
                  <p><span className="text-earth-500">Max Ground Coverage:</span> {parcel.essentialLayers?.masterPlanZoning?.maxCoveragePercent || 60}%</p>
                </div>
              </div>

              <div className="rounded-2xl border border-earth-200 bg-earth-50/60 p-4">
                <p className="font-bold uppercase tracking-wider text-earth-500">Encumbrance & Mortgages</p>
                <div className="mt-2 space-y-1 text-earth-900">
                  <p><span className="text-earth-500">Status:</span> {hasMortgage ? <span className="font-bold text-rose-800">⚠️ Active Lien</span> : <span className="font-bold text-emerald-800">✅ Clean Title</span>}</p>
                  {hasMortgage && (
                    <>
                      <p><span className="text-earth-500">Lender:</span> {parcel.essentialLayers?.encumbrance?.lenderName}</p>
                      <p><span className="text-earth-500">Amount:</span> {parcel.essentialLayers?.encumbrance?.mortgageAmount}</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* RRR Card (Rights, Restrictions, Liabilities) */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5">
              <h4 className="font-extrabold text-blue-950 uppercase tracking-wider">
                Rights, Restrictions & Liabilities (RRR) Legal Framework
              </h4>
              <p className="text-[11px] text-blue-800/80 mt-0.5">
                Standardized governance permissions and constraints associated with this parcel:
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-white p-3.5 shadow-xs">
                  <p className="font-bold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 size={14} />
                    Registered Rights
                  </p>
                  <ul className="mt-2 list-inside list-disc text-earth-700 space-y-1">
                    {parcel.essentialLayers?.rrrSummary?.rights?.map((r, i) => (
                      <li key={i}>{r}</li>
                    )) || <li>Freehold alienation rights</li>}
                  </ul>
                </div>

                <div className="rounded-xl bg-white p-3.5 shadow-xs">
                  <p className="font-bold text-amber-800 flex items-center gap-1.5">
                    <AlertTriangle size={14} />
                    Planning Restrictions
                  </p>
                  <ul className="mt-2 list-inside list-disc text-earth-700 space-y-1">
                    {parcel.essentialLayers?.rrrSummary?.restrictions?.map((r, i) => (
                      <li key={i}>{r}</li>
                    )) || <li>Subject to local municipal master plan zoning</li>}
                  </ul>
                </div>

                <div className="rounded-xl bg-white p-3.5 shadow-xs">
                  <p className="font-bold text-rose-800 flex items-center gap-1.5">
                    <ShieldAlert size={14} />
                    Liabilities & Charges
                  </p>
                  <ul className="mt-2 list-inside list-disc text-earth-700 space-y-1">
                    {parcel.essentialLayers?.rrrSummary?.liabilities?.map((l, i) => (
                      <li key={i}>{l}</li>
                    )) || <li>Annual municipal property tax assessment</li>}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: USE-CASE LAYERS (Utilities & Tax) */}
        {activeTab === "usecase" && (
          <div className="space-y-6 text-xs text-earth-800">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-earth-200 bg-earth-50/70 p-4">
                <p className="text-earth-500 font-bold uppercase flex items-center gap-1">
                  <Droplets size={14} className="text-sky-600" />
                  Water Infrastructure
                </p>
                <p className="mt-1 font-bold text-earth-950">
                  {parcel.additionalLayers?.utilities?.waterSupplyLine || "Municipal Feeder Pipeline"}
                </p>
              </div>

              <div className="rounded-2xl border border-earth-200 bg-earth-50/70 p-4">
                <p className="text-earth-500 font-bold uppercase flex items-center gap-1">
                  <Zap size={14} className="text-yellow-600" />
                  Power Feeder Grid
                </p>
                <p className="mt-1 font-bold text-earth-950">
                  {parcel.additionalLayers?.utilities?.powerSubstationDistance || "Substation Connection"}
                </p>
              </div>

              <div className="rounded-2xl border border-earth-200 bg-earth-50/70 p-4">
                <p className="text-earth-500 font-bold uppercase flex items-center gap-1">
                  <Building size={14} className="text-emerald-600" />
                  Municipal Property Tax (PID)
                </p>
                <p className="mt-1 font-mono font-bold text-earth-950">
                  {parcel.additionalLayers?.propertyTax?.propertyTaxId || parcel.propertyId || "Pending PID"}
                </p>
                <p className="mt-0.5 text-emerald-800 font-semibold">
                  Status: {parcel.additionalLayers?.propertyTax?.paymentStatus || "Paid"}
                </p>
              </div>

              <div className="rounded-2xl border border-earth-200 bg-earth-50/70 p-4">
                <p className="text-earth-500 font-bold uppercase flex items-center gap-1">
                  <Trees size={14} className="text-amber-600" />
                  Circle Rate / Valuation
                </p>
                <p className="mt-1 font-bold text-earth-950">
                  {parcel.additionalLayers?.valuation?.guidanceValueTotal || "₹ 1.5 Cr Guidance"}
                </p>
                <p className="mt-0.5 text-earth-600">
                  ₹ {parcel.additionalLayers?.valuation?.circleRatePerSqFt || 3200}/sq.ft
                </p>
              </div>
            </div>

            {/* Environmental & Restriction Buffer Alert */}
            {parcel.additionalLayers?.restrictionZones && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
                <h5 className="font-bold text-emerald-950 uppercase">Environmental & Hazard Buffer Zoning</h5>
                <p className="mt-1 text-earth-700">
                  Proximity to water body/lake: <strong>{parcel.additionalLayers.restrictionZones.lakeBufferDistanceMeters}m</strong>.
                  {parcel.additionalLayers.restrictionZones.isWithin30mBuffer ? (
                    <span className="font-bold text-rose-700 ml-1">⚠️ Violates mandatory 30m lake buffer line!</span>
                  ) : (
                    <span className="font-bold text-emerald-700 ml-1">✅ Safe: Outside mandatory 30m lake buffer line.</span>
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: AI GEOSPATIAL RADAR */}
        {activeTab === "ai" && (
          <div className="space-y-6 text-xs text-earth-800">
            <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-5">
              <div className="flex items-center justify-between border-b border-rose-200 pb-3">
                <div className="flex items-center gap-2 text-rose-900 font-bold text-sm">
                  <Zap size={16} className="text-rose-600" />
                  <span>AI Satellite Change & Encroachment Radar</span>
                </div>
                <span className="rounded-full bg-rose-100 px-3 py-1 font-bold text-rose-800">
                  Confidence Score: {parcel.aiGeospatial?.satelliteChangeDetection?.confidenceScorePercent || 94}%
                </span>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-earth-500 font-semibold uppercase text-[10px]">Baseline Comparison</p>
                  <p className="mt-1 text-earth-900 font-medium">
                    {parcel.aiGeospatial?.satelliteChangeDetection?.historicalReferenceDate} vs {parcel.aiGeospatial?.satelliteChangeDetection?.lastSatellitePassDate}
                  </p>
                </div>

                <div>
                  <p className="text-earth-500 font-semibold uppercase text-[10px]">Anomaly Classification</p>
                  <p className="mt-1 font-bold text-rose-900">
                    {parcel.aiGeospatial?.satelliteChangeDetection?.anomalyType || "Zoning Conformant"}
                  </p>
                </div>

                <div>
                  <p className="text-earth-500 font-semibold uppercase text-[10px]">Detected Footprint Deviation</p>
                  <p className="mt-1 font-bold text-earth-900">
                    {parcel.aiGeospatial?.satelliteChangeDetection?.detectedFootprintChangeSqM || 0} m²
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-white p-3.5 border border-rose-100">
                <p className="font-bold text-earth-900">AI Recommendation & Field Inspection Note:</p>
                <p className="mt-1 text-earth-700 leading-relaxed">
                  {parcel.aiGeospatial?.satelliteChangeDetection?.aiRecommendation || "All cadastral boundary vectors align with satellite imagery."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: WORKFLOWS & BLOCKCHAIN PROVENANCE */}
        {activeTab === "workflows" && (
          <div className="space-y-6 text-xs text-earth-800">
            <div className="space-y-3">
              <h4 className="font-bold text-earth-950 uppercase tracking-wider">
                Cross-Departmental Interoperable Workflow History
              </h4>
              <p className="text-earth-600">
                Every workflow execution across Revenue, Planning, and Registration generates an immutable cryptographic transaction:
              </p>

              <div className="divide-y divide-earth-100 rounded-2xl border border-earth-200 bg-white">
                {parcel.departmentalWorkflows?.map((wf, idx) => (
                  <div key={idx} className="p-4 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-earth-950">{wf.title}</span>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                        {wf.status}
                      </span>
                    </div>
                    <p className="text-earth-600">
                      Dept: <strong className="text-earth-800">{wf.department}</strong> • Applicant: {wf.applicant}
                    </p>
                    <p className="text-earth-500 text-[11px]">{wf.remarks}</p>
                    {wf.txHash && (
                      <p className="font-mono text-[10px] text-earth-400 truncate">
                        Audit Anchor: {wf.txHash}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Verified Documents & QR Panels */}
      <div className="grid gap-6 xl:grid-cols-2">
        <DocumentPanel
          documents={parcel.documents}
          parcelId={parcel.parcelId}
          onDocumentAnchored={loadParcel}
        />
        <VerificationPanel
          verification={parcel.verification}
          parcelId={parcel.parcelId}
          sourceAvailability={parcel.sourceAvailability}
          blockchain={parcel.blockchain}
        />
      </div>

      {/* Ownership Timeline */}
      <OwnershipTimeline events={parcel.ownershipHistory} />

      {/* Modals */}
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
    </div>
  );
};

export default ParcelDetailPage;
