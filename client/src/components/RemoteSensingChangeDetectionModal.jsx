import { X } from "lucide-react";

const RemoteSensingChangeDetectionModal = ({ parcel, onClose }) => {
  if (!parcel) return null;

  const change = parcel.unifiedRecord?.modules?.changeDetection?.data;
  const imagery = change?.sourceImagery;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-detection-title"
        className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] border border-white/60 bg-white p-6 shadow-2xl md:p-8"
      >
        <div className="mb-5 flex items-start justify-between gap-4 border-b pb-4">
          <div>
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-950">
              Simulated sample analysis
            </span>
            <h2 id="change-detection-title" className="mt-2 text-xl font-black text-earth-950">
              Remote Sensing Change Detection
            </h2>
            <p className="mt-1 text-sm text-earth-700">
              {parcel.parcelId} · ULPIN {parcel.ulpin || "Not assigned"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close change details"
            className="rounded-full p-2 text-earth-500 hover:bg-earth-100 hover:text-earth-900"
          >
            <X size={18} />
          </button>
        </div>

        <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-950">
          Prototype demonstration only. No real satellite imagery or remote-sensing provider is connected. Values below are not authoritative intelligence.
        </p>

        {change?.status === "change-detected" ? (
          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-4">
              <dt className="text-xs font-semibold uppercase text-slate-600">Detected change</dt>
              <dd className="mt-1 font-semibold text-slate-950">{change.detectedChange || "Classification unavailable"}</dd>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <dt className="text-xs font-semibold uppercase text-slate-600">Detection / recorded pass date</dt>
              <dd className="mt-1 font-semibold text-slate-950">{change.detectionDate || "Not available"}</dd>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <dt className="text-xs font-semibold uppercase text-slate-600">Sample confidence</dt>
              <dd className="mt-1 font-semibold text-slate-950">
                {change.confidencePercent != null ? `${change.confidencePercent}%` : "Not available"}
              </dd>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <dt className="text-xs font-semibold uppercase text-slate-600">Recorded change area</dt>
              <dd className="mt-1 font-semibold text-slate-950">
                {change.changeAreaSqM != null ? `${change.changeAreaSqM} m²` : "Not available"}
              </dd>
            </div>
            {change.referenceDate && (
              <div className="rounded-xl border border-slate-200 p-4">
                <dt className="text-xs font-semibold uppercase text-slate-600">Reference date</dt>
                <dd className="mt-1 font-semibold text-slate-950">{change.referenceDate}</dd>
              </div>
            )}
            {imagery && (
              <div className="rounded-xl border border-slate-200 p-4 sm:col-span-2">
                <dt className="text-xs font-semibold uppercase text-slate-600">Recorded source imagery metadata</dt>
                <dd className="mt-2 space-y-1 text-sm text-slate-800">
                  {Object.entries(imagery).map(([key, value]) => (
                    <p key={key}>
                      <span className="font-semibold">{key}:</span>{" "}
                      {Array.isArray(value) ? value.join(", ") : String(value)}
                    </p>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        ) : (
          <p className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            {change?.status === "no-change-recorded"
              ? "No change is recorded in the available sample analysis."
              : "No change-detection sample is available for this parcel."}
          </p>
        )}

        <p className="mt-4 text-xs text-slate-600">
          This sample is associated with the parcel and does not pinpoint an exact change location. Any real-world concern requires independent verification.
        </p>
      </section>
    </div>
  );
};

export default RemoteSensingChangeDetectionModal;
