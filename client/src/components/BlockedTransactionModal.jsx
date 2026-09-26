import { AlertOctagon, FileText, Gavel, ShieldAlert, X } from "lucide-react";

const BlockedTransactionModal = ({ parcel, errorData, onClose }) => {
  if (!errorData) return null;

  const dispute = errorData.dispute || parcel?.disputeRecord || {};

  return (
    <div className="fixed inset-0 z-[2500] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="relative w-full max-w-xl rounded-[2.5rem] border-2 border-rose-500 bg-white p-6 shadow-2xl md:p-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header Alert Banner */}
        <div className="flex items-start justify-between border-b border-rose-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-600 text-white shadow-lg shadow-rose-600/30">
              <AlertOctagon size={28} />
            </div>
            <div>
              <span className="rounded-full bg-rose-100 px-3 py-0.5 text-[11px] font-black uppercase tracking-wider text-rose-800">
                SRO Anti-Fraud Gateway Lock
              </span>
              <h3 className="text-xl font-black text-rose-950">
                REGISTRATION HARD-BLOCKED
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

        {/* Legal Grounds Notice */}
        <div className="mt-5 space-y-3">
          <div className="rounded-2xl border border-rose-300 bg-rose-50/80 p-4 text-xs">
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-rose-900">
              <Gavel size={15} />
              <span>Statutory Legal Basis</span>
            </div>
            <p className="mt-1 font-bold text-rose-950 text-sm">
              {errorData.legalBasis || "Section 52, Transfer of Property Act (Lis Pendens) & Civil Court Interim Injunction"}
            </p>
            <p className="mt-1 text-rose-900/90 leading-relaxed">
              Under Indian property jurisprudence, no lawful title conveyance, deed execution, or mutation can be registered on a parcel subject to an active interim court stay order.
            </p>
          </div>

          {/* Court Injunction Particulars */}
          <div className="rounded-2xl border border-earth-200 bg-earth-50/80 p-4 text-xs space-y-2">
            <p className="font-bold uppercase tracking-wider text-earth-500">Active Injunction Particulars</p>
            <div className="grid grid-cols-2 gap-2 text-earth-800">
              <div>
                <span className="text-earth-500">ULPIN:</span>{" "}
                <strong className="font-mono">{parcel?.ulpin || parcel?.parcelId}</strong>
              </div>
              <div>
                <span className="text-earth-500">Case Number:</span>{" "}
                <strong>{dispute.caseNumber || "RA-114/2023"}</strong>
              </div>
              <div className="col-span-2">
                <span className="text-earth-500">Issuing Authority:</span>{" "}
                <strong>{dispute.courtName || "Belagavi District & Sessions Court"}</strong>
              </div>
              <div className="col-span-2">
                <span className="text-earth-500">Injunction Terms:</span>{" "}
                <p className="mt-0.5 text-earth-700 italic">
                  "{dispute.injunctionTerms || "Restraining all alienations, registration of instruments, or boundary modifications pending disposal of title suit."}"
                </p>
              </div>
              <div>
                <span className="text-earth-500">Order Ref:</span>{" "}
                <span className="font-mono">{dispute.orderReference || "AC/BGM/REV/RA-114"}</span>
              </div>
              <div>
                <span className="text-earth-500">Next Hearing:</span>{" "}
                <strong>{dispute.nextHearing || "2026-11-12"}</strong>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-amber-50 p-3 text-[11px] text-amber-900 border border-amber-200">
            <strong>Audit Trail Note:</strong> This blocked transaction attempt has been cryptographically recorded in the Land Stack audit trail with timestamp and SRO terminal identifier.
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end border-t pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-rose-700 px-6 py-2.5 text-xs font-bold text-white shadow transition hover:bg-rose-800"
          >
            Acknowledge & Abort Registration
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlockedTransactionModal;
