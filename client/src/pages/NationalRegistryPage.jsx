import { useEffect, useState } from "react";
import { Search, ShieldCheck } from "lucide-react";
import { searchNationalLandRecords } from "../api/client";
import { useAuth } from "../context/AuthContext";

const emptyFilters = { ulpin: "", state: "", district: "", surveyNumber: "", owner: "", encumbranceStatus: "" };

const NationalRegistryPage = () => {
  const { activeRole } = useAuth();
  const [filters, setFilters] = useState(emptyFilters);
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("Enter one or more criteria to search local normalized records.");
  const [loading, setLoading] = useState(false);

  const runSearch = async (event) => {
    event?.preventDefault();
    setLoading(true);
    setStatus("");
    try {
      const data = await searchNationalLandRecords(
        Object.fromEntries(Object.entries(filters).filter(([, value]) => value.trim()))
      );
      setResults(data.items);
      setStatus(`${data.count} local demonstration record${data.count === 1 ? "" : "s"} found.`);
    } catch (error) {
      setResults([]);
      setStatus(error.response?.data?.message || "Unable to search the national registry view.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeRole === "admin") runSearch();
  }, [activeRole]);

  const updateFilter = (key, value) => setFilters((current) => ({ ...current, [key]: value }));

  if (activeRole !== "admin") {
    return (
      <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-sm text-amber-950">
        <h2 className="font-bold">Access restricted</h2>
        <p className="mt-1">The National Registry View is available only to the National Administrator role.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B2545] text-white">
            <ShieldCheck size={19} />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#334155]">Admin access only</p>
            <h2 className="mt-1 text-2xl font-bold text-[#0B2545]">National Registry View</h2>
            <p className="mt-2 text-sm text-[#334155]">
              Search the canonical representation assembled from local state adapter records.
              These results are simulated and are not live government data.
            </p>
          </div>
        </div>
      </header>

      <form onSubmit={runSearch} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ["ulpin", "ULPIN"],
            ["state", "State"],
            ["district", "District"],
            ["surveyNumber", "Survey number"],
            ["owner", "Owner / right-holder"],
            ["encumbranceStatus", "Encumbrance status"]
          ].map(([key, label]) => (
            <label key={key} className="text-xs font-semibold text-[#334155]">
              {label}
              <input
                value={filters[key]}
                onChange={(event) => updateFilter(key, event.target.value)}
                placeholder={`Search by ${label.toLowerCase()}`}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-normal text-slate-900 outline-none focus:border-[#0B2545] focus:ring-1 focus:ring-[#0B2545]"
              />
            </label>
          ))}
        </div>
        <button type="submit" disabled={loading} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#0B2545] px-4 py-2 text-sm font-semibold text-white hover:bg-[#163b68] disabled:opacity-60">
          <Search size={15} />
          {loading ? "Searching..." : "Search registry"}
        </button>
        <p className="mt-3 text-xs text-slate-500" role="status">{status}</p>
      </form>

      <div className="space-y-4">
        {results.map((record) => (
          <article key={record.nationalIdentifiers.parcelId} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 border-b border-slate-100 pb-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="font-bold text-[#0B2545]">{record.nationalIdentifiers.parcelId}</h3>
                <p className="text-xs text-[#334155]">{record.location.state} · {record.location.district} · {record.location.village}</p>
              </div>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-900">
                Local demonstration record
              </span>
            </div>
            <div className="mt-4 grid gap-4 text-xs sm:grid-cols-2 lg:grid-cols-4">
              <div><span className="text-slate-500">ULPIN</span><p className="mt-1 font-mono font-semibold text-[#334155]">{record.nationalIdentifiers.ulpin || "Not assigned"}</p></div>
              <div><span className="text-slate-500">Survey number</span><p className="mt-1 font-semibold text-[#334155]">{record.nationalIdentifiers.surveyNumber}</p></div>
              <div><span className="text-slate-500">Canonical land type</span><p className="mt-1 font-semibold text-[#334155]">{record.land.type.category}</p><p className="text-slate-500">{record.land.type.sourceValues.classification || "No source classification"}</p></div>
              <div><span className="text-slate-500">Ownership</span><p className="mt-1 font-semibold text-[#334155]">{record.ownership.map((owner) => owner.name).join(", ") || "Not available"}</p></div>
            </div>
            <div className="mt-4 grid gap-4 border-t border-slate-100 pt-3 text-xs sm:grid-cols-2">
              <div><span className="text-slate-500">Source state and system</span><p className="mt-1 font-semibold text-[#334155]">{record.sourceStateRecord.sourceReference.state} · {record.sourceStateRecord.systems.join(", ")}</p></div>
              <div><span className="text-slate-500">Source update information</span><p className="mt-1 text-[#334155]">{record.sourceStateRecord.sourceReference.lastSynchronizedAt || "Update time not available"} · {record.sourceStateRecord.sourceReference.integrationMode} · authoritative: {String(record.sourceStateRecord.sourceReference.authoritative)}</p></div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default NationalRegistryPage;
