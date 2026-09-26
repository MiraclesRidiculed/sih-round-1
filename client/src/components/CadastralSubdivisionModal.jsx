import { useState } from "react";
import { CheckCircle2, Compass, Download, FileText, Layers, Scissors, ShieldAlert, X } from "lucide-react";
import { approveSubdivisionApi, submitSubdivision } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { exportSurveyWorkPackage } from "../utils/offlineSurvey";

const CadastralSubdivisionModal = ({ parcel, onClose, onUpdated }) => {
  const { activeRole, permissions } = useAuth();
  const [splitRatio, setSplitRatio] = useState(0.6); // 60% Part A, 40% Part B
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [approvalMessage, setApprovalMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [subdivisionResult, setSubdivisionResult] = useState(null);

  if (!parcel) return null;

  const totalAcres = Number(parcel.areaInAcres || 1.0);
  const baseUlpin = parcel.ulpin || parcel.parcelId;
  const existingSubdivision = subdivisionResult || (parcel.subdivisionData?.activeSketch ? parcel.subdivisionData : null);
  const partA = existingSubdivision?.subdivisions?.find((part) => part.part === "A");
  const partB = existingSubdivision?.subdivisions?.find((part) => part.part === "B");
  const areaA = partA?.areaInAcres ?? Number((totalAcres * splitRatio).toFixed(2));
  const areaB = partB?.areaInAcres ?? Number((totalAcres * (1 - splitRatio)).toFixed(2));
  const childIdentifierA = partA?.childIdentifier || "Not generated for this legacy subdivision record";
  const childIdentifierB = partB?.childIdentifier || "Not generated for this legacy subdivision record";
  const isApproved = existingSubdivision?.activeSketch?.approvalStatus === "APPROVED";
  const isPending = existingSubdivision?.activeSketch?.approvalStatus === "PENDING_APPROVAL";

  const handleProposeSubdivision = async () => {
    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const result = await submitSubdivision(parcel.parcelId, {
        splitRatio,
        subdivisionReason: "Boundary Partition & Demarcation via CORS GNSS Rover",
        surveyorName: "P. Vignesh, LIS (Head Licensed Surveyor)"
      });

      setSubdivisionResult(result.subdivisionData);

      onUpdated?.();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Failed to submit subdivision proposal");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveSubdivision = async () => {
    if (!permissions.canApproveSubdivision) {
      setErrorMessage("🔒 Access Restricted: Revenue Surveyors cannot self-approve their own 11E sketches. Action reserved for Revenue Officer (Tehsildar).");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const res = await approveSubdivisionApi(parcel.parcelId, {
        approvedBy: "K. Annadurai, DRO & Tehsildar"
      });
      setSubdivisionResult(res.subdivisionData);
      setApprovalMessage(res.message);
      onUpdated?.();
    } catch (err) {
      setErrorMessage(err.response?.data?.message || "Failed to approve subdivision sketch");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportWorkPackage = () => {
    exportSurveyWorkPackage({
      sketchId: existingSubdivision?.sketchId || `SK-11E-${Date.now().toString().slice(-5)}`,
      parcelId: parcel.parcelId,
      parentUlpin: baseUlpin,
      children: existingSubdivision?.subdivisions || [],
      splitLine: existingSubdivision?.activeSketch?.splitLine || null,
      areaA,
      areaB,
      identifierAlgorithm: existingSubdivision?.identifierAlgorithm || "Child identifiers are assigned by the server after geometry validation.",
      crs: "EPSG:4326 (WGS84)",
      surveyor: "P. Vignesh, LIS"
    });
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
      <div className="relative max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[2.5rem] border border-white/60 bg-white p-6 shadow-2xl md:p-8">
        {/* Top Header */}
        <div className="mb-5 flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-900 shadow-sm">
              <Scissors size={20} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-900">
                  Surveyor 11E Canvas
                </span>
                <span className="text-xs text-earth-500">SSLR Cadastral Boundary Bifurcation & Demarcation</span>
              </div>
              <h3 className="text-lg font-black text-earth-950 sm:text-xl">
                {parcel.parcelId} • Cadastral Subdivision & Child Geometry
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

        {errorMessage && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-rose-300 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
            <ShieldAlert size={16} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {approvalMessage && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{approvalMessage}</span>
          </div>
        )}

        {/* 11E Official Survey Sketch Preview */}
        <div className="rounded-3xl border-2 border-dashed border-amber-900/30 bg-amber-50/40 p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-amber-900/20 pb-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-950">
                Department of Survey Settlement and Land Records (SSLR)
              </p>
              <h4 className="text-sm font-extrabold text-earth-900">
                FORM 11E: CADASTRAL SUB-DIVISION SKETCH & FIELD DEMARCATION ORDER
              </h4>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1 font-mono font-semibold text-earth-600 bg-white px-2.5 py-1 rounded-xl border">
                <Compass size={13} className="text-amber-700" />
                North: 0° True North (WGS84)
              </span>
              <span className={`px-2.5 py-1 rounded-xl font-bold border text-[11px] ${
                isApproved
                  ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                  : isPending
                  ? "bg-amber-100 text-amber-900 border-amber-300"
                  : "bg-gray-100 text-gray-700 border-gray-300"
              }`}>
                {isApproved ? "✅ Sanctioned by Tehsildar" : isPending ? "⏳ Pending Revenue Approval" : "Draft Proposal"}
              </span>
            </div>
          </div>

          {/* Interactive Split Diagram */}
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {/* Visual Polygon Cut Representation */}
            <div className="relative flex h-52 flex-col justify-between rounded-2xl border border-amber-300 bg-white p-4 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between text-[11px] text-earth-500 font-semibold border-b pb-1">
                <span>
                  {partA?.geoJson && partB?.geoJson ? "Geometry Area" : "Recorded Extent (preview)"}:{" "}
                  {partA?.geoJson && partB?.geoJson
                    ? Number(existingSubdivision?.parentAreaInAcres ?? totalAcres).toFixed(4)
                    : totalAcres} Acres
                </span>
                <span>Parent ULPIN: {baseUlpin}</span>
              </div>

              {/* Graphical Polygon representation showing vertical or horizontal split */}
              <div className="relative my-2 flex h-32 w-full overflow-hidden rounded-xl border border-earth-400 bg-earth-100">
                {/* Part A */}
                <div
                  className="flex flex-col items-center justify-center bg-blue-100/80 border-r-2 border-dashed border-red-600 transition-all text-center p-2"
                  style={{ width: `${Math.round(splitRatio * 100)}%` }}
                >
                  <span className="font-extrabold text-blue-900 text-xs">Part A ({Math.round(partA?.sharePercent ?? splitRatio * 100)}%)</span>
                  <span className="font-mono text-xs font-bold text-earth-900">{areaA} Acres</span>
                  <span className="font-mono text-[10px] text-blue-800">{parcel.surveyNumber}/1</span>
                </div>

                {/* Part B */}
                <div
                  className="flex flex-col items-center justify-center bg-emerald-100/80 transition-all text-center p-2"
                  style={{ width: `${Math.round((1 - splitRatio) * 100)}%` }}
                >
                  <span className="font-extrabold text-emerald-900 text-xs">Part B ({Math.round(partB?.sharePercent ?? (1 - splitRatio) * 100)}%)</span>
                  <span className="font-mono text-xs font-bold text-earth-900">{areaB} Acres</span>
                  <span className="font-mono text-[10px] text-emerald-800">{parcel.surveyNumber}/2</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-earth-500">
                <span>Demarcation Line: ETS / GNSS Rover</span>
                <span>CRS: EPSG:4326 (±5cm CORS Precision)</span>
              </div>
            </div>

            {/* Child parcel geometry and project identifiers */}
            <div className="space-y-3 text-xs">
              {/* Child Parcel A */}
              <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-3.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-900">Child Parcel Part A</span>
                  <span className="rounded-full bg-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-900">
                    Survey {parcel.surveyNumber}/1
                  </span>
                </div>
                <div className="mt-2 space-y-1 font-mono text-[11px] text-earth-800">
                  <p><span className="text-earth-500 font-sans">Project child ID:</span> <strong>{childIdentifierA}</strong></p>
                  <p><span className="text-earth-500 font-sans">Extent:</span> {areaA} Acres ({Math.round(partA?.sharePercent ?? splitRatio * 100)}% Share)</p>
                  {partA?.geoJson && <p className="text-emerald-800">Validated child Polygon geometry generated</p>}
                  <p><span className="text-earth-500 font-sans">Recorded Holder:</span> {parcel.currentOwners[0]?.name || "Co-Owner A"}</p>
                </div>
              </div>

              {/* Child Parcel B */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-900">Child Parcel Part B</span>
                  <span className="rounded-full bg-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-900">
                    Survey {parcel.surveyNumber}/2
                  </span>
                </div>
                <div className="mt-2 space-y-1 font-mono text-[11px] text-earth-800">
                  <p><span className="text-earth-500 font-sans">Project child ID:</span> <strong>{childIdentifierB}</strong></p>
                  <p><span className="text-earth-500 font-sans">Extent:</span> {areaB} Acres ({Math.round(partB?.sharePercent ?? (1 - splitRatio) * 100)}% Share)</p>
                  {partB?.geoJson && <p className="text-emerald-800">Validated child Polygon geometry generated</p>}
                  <p><span className="text-earth-500 font-sans">Proposed Transferee:</span> Co-Owner B / Transferee</p>
                </div>
              </div>
              <p className="px-1 text-[10px] text-earth-600">
                Child IDs are deterministic project identifiers, not official ULPINs. Areas are calculated from the validated parcel geometry.
              </p>
            </div>
          </div>

          {/* Interactive Split Proportion Slider (if not yet approved) */}
          {!isApproved && (
            <div className="mt-5 rounded-2xl bg-white p-4 shadow-sm border border-earth-200">
              <div className="flex items-center justify-between text-xs font-semibold text-earth-800 mb-2">
                <span>Adjust Demarcation Proportion:</span>
                <span className="font-mono font-bold text-amber-900">
                  {Math.round(splitRatio * 100)}% ({areaA} Acres) : {Math.round((1 - splitRatio) * 100)}% ({areaB} Acres)
                </span>
              </div>
              <input
                type="range"
                min="0.2"
                max="0.8"
                step="0.05"
                value={splitRatio}
                onChange={(e) => {
                  setSubdivisionResult(null);
                  setSplitRatio(Number(e.target.value));
                }}
                className="w-full cursor-pointer accent-amber-600"
              />
              <div className="mt-1 flex justify-between text-[10px] text-earth-500">
                <span>20% Part A / 80% Part B</span>
                <span>50% : 50% Equal Split</span>
                <span>80% Part A / 20% Part B</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls & RBAC Enforcement */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-t pt-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportWorkPackage}
              disabled={!partA?.geoJson || !partB?.geoJson}
              title={!partA?.geoJson || !partB?.geoJson ? "Generate and validate the child geometries before exporting." : ""}
              className="inline-flex items-center gap-1.5 rounded-full border border-earth-300 bg-white px-3.5 py-2 text-xs font-semibold text-earth-800 shadow-xs hover:bg-earth-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download size={14} />
              Export 11E Work Package (Offline JSON)
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Surveyor Submit Proposal */}
            {!isApproved && (
              <button
                type="button"
                onClick={handleProposeSubdivision}
                disabled={isSubmitting || !permissions.canCreateSubdivision}
                title={!permissions.canCreateSubdivision ? "Surveyor or Admin role required" : ""}
                className="inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-5 py-2 text-xs font-bold text-white shadow transition hover:bg-amber-700 disabled:opacity-50"
              >
                <Scissors size={14} />
                {isSubmitting ? "Processing..." : "Generate & Submit 11E Sketch"}
              </button>
            )}

            {/* Revenue Officer Approve Sketch */}
            {isPending && (
              <button
                type="button"
                onClick={handleApproveSubdivision}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-700 px-5 py-2 text-xs font-bold text-white shadow transition hover:bg-emerald-800 disabled:opacity-50"
              >
                <CheckCircle2 size={14} />
                {isSubmitting ? "Sanctioning..." : "Sanction 11E Sketch (Tehsildar)"}
              </button>
            )}

            {isApproved && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-4 py-2 text-xs font-bold text-emerald-800">
                <CheckCircle2 size={14} />
                Subdivision Sanctioned & Activated in RoR
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CadastralSubdivisionModal;
