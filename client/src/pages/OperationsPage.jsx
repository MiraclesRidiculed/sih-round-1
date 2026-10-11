import {
  ArrowRight,
  Building2,
  FileCheck,
  Gavel,
  Landmark,
  Map,
  ShieldCheck,
  Users
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const REFERENCE_PARCEL = "TN-KPM-0001";

const operationSections = [
  {
    id: "revenue",
    title: "Revenue Administration",
    icon: Landmark,
    roles: ["admin", "revenue_officer"],
    operations: [
      { label: "Review parcel records and verification", detail: "Open the authenticated parcel workspace." },
      { label: "Approve subdivision requests", detail: "Available to revenue officers and administrators." },
      { label: "Review remote sensing findings", detail: "Open change detection from the parcel workspace." }
    ]
  },
  {
    id: "survey",
    title: "Survey & Cadastral Operations",
    icon: Map,
    roles: ["admin", "surveyor"],
    operations: [
      { label: "Create cadastral subdivisions", detail: "Use the existing 11E subdivision workspace." },
      { label: "Review cadastral layers", detail: "Inspect boundaries, ULPIN, and survey metadata." }
    ]
  },
  {
    id: "registration",
    title: "Registration & Stamps",
    icon: FileCheck,
    roles: ["admin", "sro"],
    operations: [
      { label: "Review deed registration status", detail: "Use the existing SRO workflow on a parcel." },
      { label: "Check statutory transfer restrictions", detail: "Court restrictions are shown in the parcel record." }
    ]
  },
  {
    id: "court",
    title: "Revenue Court / RCCMS",
    icon: Gavel,
    roles: ["admin", "court"],
    operations: [
      { label: "Review dispute records", detail: "Open the parcel dispute and court workflow view." },
      { label: "Manage injunction status", detail: "Issue or vacate an injunction from the existing workspace." }
    ]
  },
  {
    id: "bank",
    title: "Financial Institution Services",
    icon: Building2,
    roles: ["admin", "bank"],
    operations: [
      { label: "Review encumbrance information", detail: "Inspect current liens in the governance record." },
      { label: "Manage bank lien records", detail: "Create or release a lien from the parcel workspace." }
    ]
  },
  {
    id: "citizen",
    title: "Citizen Services",
    icon: Users,
    roles: ["admin", "citizen"],
    operations: [
      { label: "Submit a parcel service request", detail: "Use the existing citizen request form." },
      { label: "Review public verification", detail: "Public QR and document verification remain available." }
    ]
  },
  {
    id: "registry",
    title: "National Registry View",
    icon: ShieldCheck,
    roles: ["admin"],
    operations: [
      { label: "Review integrated parcel records", detail: "Search normalized records by ULPIN, state, owner, or encumbrance." },
      { label: "Review technical standards", detail: "Open the existing national DPI standards page." }
    ]
  }
];

const OperationsPage = () => {
  const { activeRole } = useAuth();
  const visibleSections = operationSections.filter((section) => section.roles.includes(activeRole));

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#334155]">Authenticated workspace</p>
        <h2 className="mt-2 text-2xl font-bold text-[#0B2545]">Departmental Operations Console</h2>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#334155]">
          Select an existing operational workspace permitted for the current role. Actions continue to use
          the parcel record and authoritative API controls; this page provides navigation only.
        </p>
      </div>

      {visibleSections.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {visibleSections.map((section) => {
            const Icon = section.icon;
            return (
              <section key={section.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B2545] text-white">
                    <Icon size={19} />
                  </span>
                  <h3 className="font-bold text-[#0B2545]">{section.title}</h3>
                </div>
                <div className="mt-3 space-y-3">
                  {section.operations.map((operation) => (
                    <div key={operation.label} className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 p-3">
                      <div>
                        <p className="text-sm font-semibold text-[#334155]">{operation.label}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{operation.detail}</p>
                      </div>
                      <Link
                        to={section.id === "registry" ? "/registry" : `/parcels/${REFERENCE_PARCEL}`}
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-[#0B2545] hover:bg-slate-100"
                      >
                        Open
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-[#334155]">
          No departmental operations are assigned to this role.
        </div>
      )}
    </div>
  );
};

export default OperationsPage;
