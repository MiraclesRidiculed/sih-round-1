import { AlertCircle, ArrowRight, Building2, CheckCircle2, Gavel, Layers, Lock, MapPinned, Scissors, ShieldAlert, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { formatArea, ownerLine } from "../utils/format";
import StatusPill from "./StatusPill";

const getStateBadge = (state) => {
  if (state === "Tamil Nadu") {
    return <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-bold text-blue-900 border border-blue-200">🌾 Tamil Nadu Pilot</span>;
  }
  if (state?.includes("Chandigarh")) {
    return <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-bold text-amber-900 border border-amber-200">🏙️ Chandigarh UT Pilot</span>;
  }
  return <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-900 border border-emerald-200">🌳 Karnataka State</span>;
};

const ParcelList = ({ parcels = [], title }) => (
  <section className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-2xl font-black text-earth-950">{title}</h2>
        <p className="text-xs text-earth-600">Unified Cadastral Layer Integration across India</p>
      </div>
      <span className="rounded-full bg-earth-200/60 px-3 py-1 text-xs font-semibold text-earth-800">
        {parcels.length} georeferenced parcel(s)
      </span>
    </div>

    <div className="grid gap-5 lg:grid-cols-2">
      {parcels.map((parcel) => {
        const hasAiAlert = Boolean(parcel.aiGeospatial?.satelliteChangeDetection?.anomalyDetected);
        const hasMortgage = Boolean(parcel.essentialLayers?.encumbrance?.hasMortgage);
        const isCourtLocked = Boolean(parcel.disputeRecord?.transactionLock || parcel.essentialLayers?.ror?.revenueCourtDispute);
        const hasSubdivision = Boolean(parcel.subdivisionData?.isSubdivided);
        const has3D = Boolean(parcel.verticalStrata?.hasVerticalUnits);

        return (
          <Link
            key={parcel.parcelId}
            to={`/parcels/${parcel.parcelId}`}
            className={`group relative overflow-hidden rounded-[2.2rem] border bg-white/85 p-6 shadow-panel transition hover:-translate-y-1 hover:shadow-xl ${
              isCourtLocked
                ? "border-red-300 hover:border-red-400 bg-red-50/20"
                : "border-white/70 hover:border-earth-300"
            }`}
          >
            {/* Top State Badge & Status */}
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  {getStateBadge(parcel.state)}
                  <span className="text-xs font-semibold text-earth-600 flex items-center gap-1">
                    <MapPinned size={13} />
                    {parcel.village}, {parcel.district}
                  </span>
                </div>
                <h3 className="text-xl font-extrabold text-earth-950 pt-1">{parcel.parcelId}</h3>
              </div>

              <div className="flex flex-col items-end gap-1.5">
                <StatusPill status={parcel.verificationHint?.status}>
                  {parcel.verificationHint?.status || "attention"}
                </StatusPill>
                {isCourtLocked && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-0.5 text-[10px] font-black text-white shadow-xs">
                    <Lock size={10} />
                    Court Stay Active
                  </span>
                )}
                {hasAiAlert && !isCourtLocked && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800">
                    <Zap size={10} />
                    AI Alert
                  </span>
                )}
              </div>
            </div>

            {/* Cadastral Details Grid */}
            <div className="mt-4 grid gap-3 text-xs text-earth-700 sm:grid-cols-2">
              <div className="rounded-xl bg-earth-50/80 p-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-earth-500">ULPIN (Bhu-Aadhaar)</p>
                <p className="mt-0.5 font-mono text-sm font-bold tracking-wider text-earth-900">
                  {parcel.ulpin || "Pending Generation"}
                </p>
              </div>

              <div className="rounded-xl bg-earth-50/80 p-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-earth-500">Extent & Local Unit</p>
                <p className="mt-0.5 font-bold text-earth-900">
                  {formatArea(parcel.areaInAcres)} ({parcel.baseLayer?.localAreaUnit || `${parcel.areaInAcres} Acres`})
                </p>
              </div>

              <div className="sm:col-span-2 rounded-xl bg-earth-50/80 p-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-earth-500">Owners & Title</p>
                <p className="mt-0.5 font-semibold text-earth-900">{ownerLine(parcel.currentOwners)}</p>
              </div>
            </div>

            {/* Feature Pills */}
            <div className="mt-4 flex flex-wrap gap-1.5 text-[11px]">
              <span className="rounded-md bg-amber-50 px-2 py-0.5 font-medium text-amber-900 border border-amber-200/60">
                L1: Survey {parcel.surveyNumber}{parcel.hissaNumber ? `/${parcel.hissaNumber}` : ""}
              </span>
              <span className="rounded-md bg-blue-50 px-2 py-0.5 font-medium text-blue-900 border border-blue-200/60">
                L2: {parcel.essentialLayers?.masterPlanZoning?.zoneCategory || parcel.landUse || "Zoning"}
              </span>
              <span className="rounded-md bg-emerald-50 px-2 py-0.5 font-medium text-emerald-900 border border-emerald-200/60">
                L3: {hasMortgage ? "⚠️ Bank Mortgage" : "✅ Clear Title"}
              </span>
              {hasSubdivision && (
                <span className="rounded-md bg-purple-50 px-2 py-0.5 font-bold text-purple-900 border border-purple-200 flex items-center gap-1">
                  <Scissors size={10} />
                  11E Split
                </span>
              )}
              {has3D && (
                <span className="rounded-md bg-purple-50 px-2 py-0.5 font-bold text-purple-900 border border-purple-200 flex items-center gap-1">
                  <Building2 size={10} />
                  3D Strata
                </span>
              )}
            </div>

            {/* Summary & Open Action */}
            <div className="mt-4 flex items-center justify-between border-t border-earth-100 pt-3 text-xs">
              <p className="max-w-md text-earth-600 line-clamp-1">
                {isCourtLocked
                  ? `Court Stay Active: ${parcel.disputeRecord?.caseNumber || "Section 52 Injunction"}`
                  : parcel.verificationHint?.summary}
              </p>
              <span className="inline-flex items-center gap-1.5 font-bold text-earth-900 transition group-hover:translate-x-1 shrink-0 ml-2">
                Inspect 3 Layers
                <ArrowRight size={14} />
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  </section>
);

export default ParcelList;
