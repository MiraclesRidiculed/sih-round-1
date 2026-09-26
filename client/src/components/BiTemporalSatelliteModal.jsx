import { useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronRight, Eye, ShieldAlert, Sparkles, X, Zap } from "lucide-react";
import { recommendAiInspectionApi } from "../api/client";
import { useAuth } from "../context/AuthContext";

const BiTemporalSatelliteModal = ({ parcel, onClose, onActionCompleted }) => {
  const { permissions } = useAuth();
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recommended, setRecommended] = useState(false);

  if (!parcel) return null;

  const anomaly = parcel.aiGeospatial?.satelliteChangeDetection || {
    confidenceScorePercent: 94,
    detectedFootprintChangeSqM: 142,
    anomalyType: "Unauthorized Construction Footprint (Setback & Buffer Violation)",
    aiRecommendation: "Field verification required: Structure encroaches 142 sqm into 30m lake eco-monitoring zone."
  };

  const handleRecommendInspection = async () => {
    setIsSubmitting(true);
    try {
      await recommendAiInspectionApi(parcel.parcelId, {
        inspectionReason: `AI Satellite Bi-temporal Analysis: ${anomaly.detectedFootprintChangeSqM} sq.m unauthorized footprint (${anomaly.confidenceScorePercent}% confidence)`
      });
      setRecommended(true);
      setTimeout(() => {
        onActionCompleted?.();
      }, 1500);
    } catch (err) {
      console.error("Failed to recommend inspection", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
      <div className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[2.5rem] border border-white/60 bg-white p-6 shadow-2xl md:p-8">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-100 text-rose-800 shadow-sm">
              <Zap size={20} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-800">
                  Remote Sensing Change Detection
                </span>
                <span className="text-xs text-earth-500">Bi-Temporal Satellite Comparison (2024 vs 2026)</span>
              </div>
              <h3 className="text-lg font-black text-earth-950 sm:text-xl">
                {parcel.parcelId} • Satellite Change Detection Inspector
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-earth-500 hover:bg-earth-100 hover:text-earth-900"
          >
            <X size={18} />
          </button>
        </div>

        {/* Bi-Temporal Interactive Drag Comparison Slider */}
        <div className="relative h-80 w-full overflow-hidden rounded-3xl border-2 border-earth-300 bg-earth-950 shadow-inner select-none">
          {/* 2026 CURRENT IMAGE (Base Background) */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,_#1f2937_0%,_#111827_70%)] p-6 text-center">
            {/* Simulated Satellite Feature Overlay with Encroachment Box */}
            <div className="relative h-44 w-72 rounded-2xl border border-white/30 bg-emerald-950/40 p-3 shadow-lg">
              <span className="text-[10px] font-bold text-gray-400">Cadastral Boundary 248/3</span>
              {/* Encroaching Red Box */}
              <div className="absolute -top-3 -right-3 h-20 w-24 rounded-lg border border-rose-300 bg-rose-50 p-1 text-center">
                <span className="text-[9px] font-bold uppercase tracking-wider text-rose-300">
                  +142 m² New Construction
                </span>
              </div>
              <div className="mt-8 text-xs font-semibold text-emerald-300">
                Current Pass: 2026 CartoSat-3 / Sentinel-2 Pass
              </div>
            </div>
          </div>

          {/* 2024 BASELINE IMAGE (Clipped on the left) */}
          <div
            className="absolute inset-y-0 left-0 overflow-hidden border-r-2 border-amber-400 bg-[radial-gradient(ellipse_at_center,_#374151_0%,_#1f2937_70%)]"
            style={{ width: `${sliderPosition}%` }}
          >
            <div className="absolute inset-0 flex h-full w-[800px] flex-col items-center justify-center p-6 text-center">
              <div className="relative h-44 w-72 rounded-2xl border border-white/30 bg-emerald-950/40 p-3 shadow-lg">
                <span className="text-[10px] font-bold text-gray-400">Cadastral Boundary 248/3</span>
                {/* Vacant Clear Buffer */}
                <div className="absolute -top-3 -right-3 h-20 w-24 rounded-lg border border-dashed border-emerald-400/60 bg-emerald-900/20 p-1 text-center">
                  <span className="text-[9px] font-medium text-emerald-300">Clear 30m Buffer</span>
                </div>
                <div className="mt-8 text-xs font-semibold text-amber-300">
                  Baseline Pass: 2024 Official Survey Cadastre
                </div>
              </div>
            </div>
          </div>

          {/* Slider Drag Bar Handle */}
          <div
            className="absolute inset-y-0 flex items-center justify-center pointer-events-none"
            style={{ left: `calc(${sliderPosition}% - 14px)` }}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-400 text-earth-950 shadow-xl border-2 border-white text-xs font-black">
              ↔
            </div>
          </div>

          {/* Top Floating Badges */}
          <div className="absolute left-3 top-3 rounded-full bg-amber-500/90 px-3 py-1 text-[11px] font-bold text-earth-950 shadow backdrop-blur">
            📅 2024 Baseline Cadastre
          </div>
          <div className="absolute right-3 top-3 rounded-full bg-rose-600/90 px-3 py-1 text-[11px] font-bold text-white shadow backdrop-blur">
            🛰️ 2026 Current Pass (Alert Active)
          </div>

          {/* Range Input for Dragging */}
          <input
            type="range"
            min="0"
            max="100"
            value={sliderPosition}
            onChange={(e) => setSliderPosition(Number(e.target.value))}
            className="absolute inset-0 h-full w-full opacity-0 cursor-ew-resize"
          />
        </div>

        <p className="mt-2 text-center text-xs text-earth-600">
          👈 Drag slider left and right to inspect the bi-temporal change between 2024 baseline and 2026 satellite pass 👉
        </p>

        {/* AI Analysis Cards Grid */}
        <div className="mt-5 grid gap-4 sm:grid-cols-3 text-xs">
          <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4">
            <span className="font-bold uppercase tracking-wider text-rose-800">Anomaly Classification</span>
            <p className="mt-1 font-bold text-rose-950 text-sm">{anomaly.anomalyType}</p>
            <p className="mt-1 text-rose-900/80">Infringing on designated master plan setback & waterbody perimeter.</p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
            <span className="font-bold uppercase tracking-wider text-amber-800">Confidence & Extent</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-950">{anomaly.confidenceScorePercent}%</span>
              <span className="text-xs text-amber-800 font-semibold">AI Confidence</span>
            </div>
            <p className="mt-1 font-bold text-earth-900">+{anomaly.detectedFootprintChangeSqM} sq.m unauthorized footprint</p>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4">
            <span className="font-bold uppercase tracking-wider text-blue-800">Recommended Action</span>
            <p className="mt-1 font-medium text-earth-900">{anomaly.aiRecommendation}</p>
          </div>
        </div>

        {/* Action Footer */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-t pt-4">
          <div className="text-xs text-earth-600">
            <span className="font-semibold text-earth-800">Legal Notice:</span> Bi-temporal satellite change analysis constitutes an automated surveillance trigger. Physical field demarcation by VAO/Surveyor is required.
          </div>

          {recommended ? (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-4 py-2 text-xs font-bold text-emerald-800">
              <CheckCircle2 size={16} />
              Inspection Task Assigned to VAO
            </div>
          ) : (
            <button
              type="button"
              onClick={handleRecommendInspection}
              disabled={isSubmitting || !permissions.canApproveMutation}
              title={!permissions.canApproveMutation ? "Revenue Officer or Admin role required" : ""}
              className="inline-flex items-center gap-2 rounded-full bg-rose-700 px-5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-rose-800 disabled:opacity-50"
            >
              <ShieldAlert size={15} />
              {isSubmitting ? "Assigning Task..." : "Recommend Revenue Field Inspection"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BiTemporalSatelliteModal;
