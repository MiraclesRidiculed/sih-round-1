import { useRef } from "react";
import QRCode from "react-qr-code";
import { CheckCircle2, Download, Printer, ShieldCheck, X } from "lucide-react";

const PropertyCardModal = ({ parcel, onClose }) => {
  const cardRef = useRef();

  if (!parcel) return null;

  const handlePrint = () => {
    window.print();
  };

  const ownersList = parcel.currentOwners?.map((o) => o.name).join(", ") || "Unknown Owner";

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[2.5rem] border border-white/60 bg-white p-6 shadow-2xl md:p-8">
        {/* Header Controls */}
        <div className="mb-6 flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-800">
              Official DPI Property Card
            </span>
            <span className="text-xs text-earth-500">DoLR National Standard Specification</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-full bg-earth-900 px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-earth-800"
            >
              <Printer size={14} />
              Print / Save PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-earth-500 hover:bg-earth-100 hover:text-earth-900"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Official Certificate */}
        <div
          ref={cardRef}
          className="rounded-3xl border-2 border-amber-900/30 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-50/50 via-white to-amber-50/30 p-8 shadow-inner"
        >
          {/* Emblem & Top Bar */}
          <div className="border-b-2 border-amber-900/20 pb-6 text-center">
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-amber-900/10 text-amber-900">
              🏛️
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-amber-950">
              Government of India • Ministry of Rural Development
            </p>
            <h2 className="mt-1 text-2xl font-extrabold text-earth-950">
              Department of Land Resources (DoLR)
            </h2>
            <p className="mt-1 text-sm font-semibold tracking-wide text-amber-800">
              LAND STACK: BHU-AADHAAR INTEGRATED PROPERTY RECORD
            </p>
            <p className="text-xs text-earth-600">
              Issued under the National Digital Public Infrastructure (DPI) for Land Governance
            </p>
          </div>

          {/* ULPIN Highlight Box */}
          <div className="mt-6 flex flex-col items-center justify-between gap-4 rounded-2xl border border-amber-400 bg-amber-100/60 p-4 sm:flex-row">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-900">
                Unique Land Parcel Identification Number (ULPIN / Bhu-Aadhaar)
              </p>
              <p className="mt-1 font-mono text-2xl font-black tracking-widest text-earth-950">
                {parcel.ulpin || parcel.parcelId}
              </p>
              <p className="text-xs text-amber-900/80">
                State: <span className="font-semibold">{parcel.state}</span> • Authority: {parcel.stateProfile?.systemName || "Land Records Authority"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-white p-2 shadow-sm">
                <QRCode value={`https://landstack.gov.in/verify/${parcel.ulpin || parcel.parcelId}`} size={68} />
              </div>
              <div className="text-right text-[11px] text-earth-600">
                <p className="font-semibold text-emerald-800 flex items-center gap-1 justify-end">
                  <ShieldCheck size={13} />
                  Tamper-Evident
                </p>
                <p>Scan to verify</p>
                <p>on Sepolia Chain</p>
              </div>
            </div>
          </div>

          {/* 3-Column Cadastral Details Grid */}
          <div className="mt-6 grid gap-4 text-xs sm:grid-cols-3">
            <div className="rounded-2xl border border-earth-200/80 bg-white/80 p-4">
              <p className="font-bold text-earth-500 uppercase tracking-wider">Administrative Hierarchy</p>
              <div className="mt-2 space-y-1.5 font-medium text-earth-900">
                <p><span className="text-earth-500">State:</span> {parcel.state}</p>
                <p><span className="text-earth-500">District:</span> {parcel.district}</p>
                <p><span className="text-earth-500">Taluk/Tehsil:</span> {parcel.taluk}</p>
                <p><span className="text-earth-500">Village/Sector:</span> {parcel.village}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-earth-200/80 bg-white/80 p-4">
              <p className="font-bold text-earth-500 uppercase tracking-wider">Cadastral Identity</p>
              <div className="mt-2 space-y-1.5 font-medium text-earth-900">
                <p><span className="text-earth-500">Survey No:</span> {parcel.surveyNumber}</p>
                <p><span className="text-earth-500">Hissa/Sub-div:</span> {parcel.hissaNumber || "None"}</p>
                <p><span className="text-earth-500">Khata/Patta:</span> {parcel.khataNumber || "N/A"}</p>
                <p><span className="text-earth-500">Total Area:</span> {parcel.areaInAcres} Acres ({parcel.baseLayer?.localAreaUnit || ""})</p>
              </div>
            </div>

            <div className="rounded-2xl border border-earth-200/80 bg-white/80 p-4">
              <p className="font-bold text-earth-500 uppercase tracking-wider">Ownership & Record</p>
              <div className="mt-2 space-y-1.5 font-medium text-earth-900">
                <p><span className="text-earth-500">Recorded Owner:</span> <span className="font-bold">{ownersList}</span></p>
                <p><span className="text-earth-500">RoR Status:</span> {parcel.essentialLayers?.ror?.rorNumber || "Verified"}</p>
                <p><span className="text-earth-500">Deed Ref:</span> {parcel.essentialLayers?.registration?.deedNumber || "Registered"}</p>
                <p><span className="text-earth-500">Stamp Duty:</span> {parcel.essentialLayers?.registration?.stampDutyPaid || "Paid"}</p>
              </div>
            </div>
          </div>

          {/* RRR Section (Rights, Restrictions, Liabilities) */}
          <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50/50 p-4 text-xs">
            <h4 className="font-bold uppercase tracking-wider text-blue-900">
              Essential Governance Layer: Rights, Restrictions & Liabilities (RRR)
            </h4>
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              <div>
                <p className="font-bold text-emerald-800">✅ Registered Rights:</p>
                <ul className="mt-1 list-inside list-disc text-earth-700 space-y-0.5">
                  {parcel.essentialLayers?.rrrSummary?.rights?.map((r, i) => (
                    <li key={i}>{r}</li>
                  )) || <li>Freehold ownership rights</li>}
                </ul>
              </div>

              <div>
                <p className="font-bold text-amber-800">⚠️ Planning Restrictions:</p>
                <ul className="mt-1 list-inside list-disc text-earth-700 space-y-0.5">
                  {parcel.essentialLayers?.rrrSummary?.restrictions?.map((r, i) => (
                    <li key={i}>{r}</li>
                  )) || <li>Subject to local municipal master plan zoning</li>}
                </ul>
              </div>

              <div>
                <p className="font-bold text-rose-800">📋 Liabilities & Charges:</p>
                <ul className="mt-1 list-inside list-disc text-earth-700 space-y-0.5">
                  {parcel.essentialLayers?.rrrSummary?.liabilities?.map((l, i) => (
                    <li key={i}>{l}</li>
                  )) || <li>Annual municipal property tax</li>}
                </ul>
              </div>
            </div>
          </div>

          {/* Vertex Coordinates Table */}
          {parcel.baseLayer?.vertices?.length > 0 && (
            <div className="mt-6 rounded-2xl border border-earth-200 bg-white/70 p-4 text-xs">
              <p className="font-bold text-earth-800 uppercase tracking-wider">
                Georeferenced Cadastral Coordinates (Datum: WGS84 / EPSG:4326)
              </p>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {parcel.baseLayer.vertices.map((v, i) => (
                  <div key={i} className="rounded-xl bg-earth-50 p-2 font-mono text-[11px]">
                    <p className="font-bold text-earth-900">Pt #{v.pt}: {v.marker}</p>
                    <p>Lat: {v.lat.toFixed(6)}</p>
                    <p>Lng: {v.lng.toFixed(6)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Seals & Blockchain Provenance */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-amber-900/20 pt-4 text-[11px] text-earth-600">
            <div>
              <p className="font-semibold text-earth-900">Land Stack DPI Cryptographic Audit Anchor</p>
              <p className="font-mono text-[10px] text-earth-500 truncate max-w-md">
                Tx: {parcel.blockchain?.lastAnchorTxHash || "0x7a83b194f1837a28e991cd4a8731b99210948ac0192837482910384729103847"}
              </p>
            </div>

            <div className="text-right">
              <p className="font-bold text-earth-900">Digitally Certified by DoLR Land Stack</p>
              <p className="text-earth-500">Generated on: {new Date().toLocaleDateString("en-IN")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyCardModal;
