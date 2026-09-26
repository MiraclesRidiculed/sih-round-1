import { useState } from "react";
import { CheckCircle2, FileText, Send, X } from "lucide-react";
import { submitParcelWorkflow } from "../api/client";

const ServiceRequestModal = ({ parcel, onClose, onSubmitted }) => {
  const [serviceType, setServiceType] = useState("MUTATION");
  const [applicantName, setApplicantName] = useState(parcel.currentOwners?.[0]?.name || "");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let department = "Revenue";
      let title = "Online e-Mutation Request";

      if (serviceType === "ZONING") {
        department = "Town Planning";
        title = "Master Plan Zoning NOC Clearance";
      } else if (serviceType === "ENCUMBRANCE") {
        department = "Registration (SRO)";
        title = "Non-Encumbrance Certificate (NEC) Verification";
      } else if (serviceType === "SURVEY") {
        department = "Survey & Land Records";
        title = "Cadastral Boundary Re-survey & Demarcation";
      }

      await submitParcelWorkflow(parcel.parcelId, {
        department,
        title,
        applicant: applicantName || "Citizen Applicant",
        remarks: remarks || `Citizen initiated request for ${title} via Land Stack Portal`
      });

      setSuccess(true);
      setTimeout(() => {
        onSubmitted?.();
        onClose();
      }, 1600);
    } catch (err) {
      console.error("Failed to submit service request", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-[2.5rem] border border-white/60 bg-white p-6 shadow-2xl md:p-8">
        <div className="mb-5 flex items-center justify-between border-b pb-4">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-blue-100 p-1.5 text-blue-700">
              <FileText size={18} />
            </span>
            <div>
              <h3 className="text-lg font-bold text-earth-900">Land Stack Citizen Services</h3>
              <p className="text-xs text-earth-500">Cross-Departmental Workflow Application</p>
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

        {success ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 size={48} className="mx-auto text-emerald-600" />
            <h4 className="text-xl font-bold text-earth-900">Application Submitted!</h4>
            <p className="text-sm text-earth-600">
              Your service request has been logged and anchored to the Land Stack DPI audit trail.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-earth-700">
                Select Citizen Service
              </label>
              <select
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-earth-200 bg-earth-50/70 p-3 text-sm text-earth-900 focus:border-earth-800 focus:outline-none"
              >
                <option value="MUTATION">📜 Revenue Department: e-Mutation & Patta/RTC Name Transfer</option>
                <option value="ZONING">📐 Town Planning: Master Plan Zoning & Building NOC</option>
                <option value="ENCUMBRANCE">🖋️ Registration Department: Non-Encumbrance Certificate (NEC)</option>
                <option value="SURVEY">🗺️ Survey Settlement: Cadastral Boundary Demarcation & 11E Sketch</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-earth-700">
                Applicant Name
              </label>
              <input
                type="text"
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                required
                className="mt-1 w-full rounded-2xl border border-earth-200 bg-earth-50/70 p-3 text-sm text-earth-900 focus:border-earth-800 focus:outline-none"
                placeholder="Enter applicant full name"
              />
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-earth-700">
                Application Remarks / Supporting Reference
              </label>
              <textarea
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="mt-1 w-full rounded-2xl border border-earth-200 bg-earth-50/70 p-3 text-sm text-earth-900 focus:border-earth-800 focus:outline-none"
                placeholder="E.g. Application following registered Sale Deed DOC-2024-SPB-3109 or construction sanction..."
              />
            </div>

            <div className="rounded-2xl border border-earth-200/80 bg-earth-50/50 p-3 text-xs text-earth-600">
              <p className="font-semibold text-earth-800">DPI Interoperability Guarantee:</p>
              This request automatically propagates across the Revenue, Registration, and Planning systems with an immutable cryptographic audit record.
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full px-5 py-2.5 text-xs font-semibold text-earth-700 hover:bg-earth-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-full bg-earth-900 px-6 py-2.5 text-xs font-semibold text-white shadow-md transition hover:bg-earth-800 disabled:opacity-50"
              >
                <Send size={14} />
                {submitting ? "Submitting to DPI..." : "Submit Application"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ServiceRequestModal;
