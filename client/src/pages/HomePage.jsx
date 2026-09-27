import { useDeferredValue, useEffect, useState } from "react";
import {
  BarChart3,
  Landmark,
  MapPinned
} from "lucide-react";
import { fetchDashboard, searchParcels } from "../api/client";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useLiveEvents } from "../context/LiveEventContext";
import ParcelList from "../components/ParcelList";
import SearchBar from "../components/SearchBar";

const METRIC_PRESENTATION = {
  totalParcels: ["Total parcels", "Parcel records"],
  activeRestrictions: ["Active restrictions", "Parcel and RCCMS restriction records"],
  pendingRegistrations: ["Pending registrations", "Local transaction applications"],
  rccmsCases: ["RCCMS cases", "Recorded case records"],
  subdivisions: ["Recorded subdivisions", "Child subdivision records"],
  detectedSpatialChanges: ["Simulated sample changes", "Local change-detection samples; not satellite intelligence"],
  parcelsWithEncumbrance: ["Parcels with mortgage flag", "Recorded parcel encumbrance flag"]
};

const GOVERNANCE_ROLE_LABELS = {
  admin: "National platform administrator",
  revenue_officer: "Revenue officer",
  surveyor: "Surveyor",
  sro: "Sub-registrar",
  court: "Revenue court",
  bank: "Financial institution"
};

const DistributionChart = ({ title, items }) => {
  const maximum = Math.max(0, ...items.map((item) => item.count));
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      {items.length ? (
        <div className="mt-4 space-y-3">
          {items.map(({ label, count }) => (
            <div key={label} className="grid grid-cols-[minmax(0,1fr)_2.5rem] items-center gap-x-3 gap-y-1.5">
              <span className="truncate text-xs text-slate-700" title={label}>{label}</span>
              <span className="text-right text-xs font-semibold tabular-nums text-slate-900">{count}</span>
              <div className="col-span-2 h-2 rounded bg-slate-100" role="img" aria-label={`${label}: ${count}`}>
                <div
                  className="h-full rounded bg-[#315a7d]"
                  style={{ width: `${maximum ? (count / maximum) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-xs text-slate-600">No records available for this summary.</p>
      )}
    </section>
  );
};

const DepartmentHomePage = () => {
  const { activeRole, currentPersona } = useAuth();
  const { t } = useLanguage();
  const { refreshKey } = useLiveEvents();

  const [dashboard, setDashboard] = useState(null);
  const [selectedState, setSelectedState] = useState("All");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");

  const deferredQuery = useDeferredValue(query);

  const loadData = async () => {
    try {
      const dashboardData = await fetchDashboard();
      setDashboard(dashboardData);
      setResults(dashboardData.featuredParcels || []);
      setDashboardError("");
    } catch {
      setDashboardError("Governance summaries could not be loaded from application records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  useEffect(() => {
    const search = async () => {
      if (!dashboard || activeRole !== "admin") return;

      const params = {};
      if (deferredQuery.trim()) {
        params.search = deferredQuery.trim();
      }
      if (selectedState !== "All") {
        params.state = selectedState;
      }

      const response = await searchParcels(params);
      setResults(response.items);
    };

    search();
  }, [activeRole, dashboard, deferredQuery, selectedState]);

  if (dashboardError && !dashboard) {
    return (
      <p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-950">
        {dashboardError}
      </p>
    );
  }

  if (loading && !dashboard) {
    return (
      <div className="rounded-[2.5rem] border border-white/60 bg-white/80 p-12 text-center text-earth-800">
        <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-amber-900 border-t-transparent" />
        <p className="font-bold text-lg">Loading Land Stack services...</p>
        <p className="text-xs text-earth-600 mt-1">Loading local parcel and governance records</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[2.5rem] border border-[#0B2545] bg-[#0B2545] p-8 text-white shadow-panel">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-amber-200">
              <Landmark size={14} />
              <BarChart3 size={14} aria-hidden="true" />
              Land Stack • Local governance summaries
            </div>
            <h2 className="mt-4 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
              Land Governance Decision Dashboard
            </h2>
            <p className="mt-4 text-sm text-gray-200 sm:text-base leading-relaxed">
              Summaries are calculated from parcel, workflow, subdivision, tax, and RCCMS records available in this application.
              They are operational indicators, not authoritative departmental totals.
            </p>

            {activeRole === "admin" && dashboard?.distributions?.state && (
              <div className="mt-6 flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold uppercase tracking-wider text-amber-300 mr-1 text-[11px]">Filter parcel directory by state:</span>
                {dashboard.distributions.state.map(({ label }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setSelectedState((current) => current === label ? "All" : label)}
                    className={`rounded-full px-3.5 py-1.5 font-bold transition ${
                      selectedState === label
                        ? "bg-amber-400 text-earth-950"
                        : "bg-white/15 text-white hover:bg-white/25"
                    }`}
                  >
                    {label}
                  </button>
                ))}
                {selectedState !== "All" && (
                  <button type="button" onClick={() => setSelectedState("All")} className="text-amber-100 underline">
                    Clear filter
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right Hero Badge */}
          <div className="rounded-3xl border border-white/20 bg-white/10 p-5 backdrop-blur-md lg:w-72 shrink-0">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-200">Digital Public Infrastructure</p>
            <div className="mt-3 space-y-2 text-xs text-gray-200">
              <div><span className="font-semibold text-white">View:</span> {GOVERNANCE_ROLE_LABELS[activeRole] || activeRole}</div>
              <div><span className="font-semibold text-white">Data:</span> Current local application records</div>
              <div><span className="font-semibold text-white">Updated:</span> {dashboard?.generatedAt ? new Date(dashboard.generatedAt).toLocaleString() : "Not available"}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Role Context Bar */}
      <div className="rounded-2xl border border-earth-200 bg-white/90 p-4 shadow-sm backdrop-blur">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-earth-900 text-xl text-white shadow-xs shrink-0">
              {currentPersona.avatar}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-earth-950 text-sm">
                  {currentPersona.name}
                </span>
                <span className="rounded-full bg-earth-100 px-2 py-0.5 text-[10px] font-bold text-earth-800 border">
                  {currentPersona.designation}
                </span>
              </div>
              <p className="text-earth-600 mt-0.5">
                {currentPersona.department}
              </p>
            </div>
          </div>

          <div className="shrink-0 text-earth-500 text-[11px]">
            Use the role selector in the header to change the active departmental view
          </div>
        </div>
      </div>

      <section aria-label="Governance metrics" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(dashboard?.metrics || {}).map(([key, value]) => {
          const [label, source] = METRIC_PRESENTATION[key] || [key, "Local application records"];
          return (
            <article key={key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">{label}</p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-[#0B2545]">{value}</p>
              <p className="mt-1 text-xs text-slate-600">{source}</p>
            </article>
          );
        })}
      </section>

      <section aria-label="Record distributions" className="grid gap-4 md:grid-cols-2">
        {dashboard?.distributions?.landUse && <DistributionChart title="Parcels by recorded land use" items={dashboard.distributions.landUse} />}
        {dashboard?.distributions?.propertyTaxStatus && <DistributionChart title="Property tax status (records with a status)" items={dashboard.distributions.propertyTaxStatus} />}
        {dashboard?.distributions?.rccmsStatus && <DistributionChart title="RCCMS cases by recorded status" items={dashboard.distributions.rccmsStatus} />}
        {dashboard?.distributions?.state && <DistributionChart title="Parcels by recorded state" items={dashboard.distributions.state} />}
        {dashboard?.distributions?.district && <DistributionChart title="Parcels by recorded district" items={dashboard.distributions.district} />}
      </section>

      {activeRole === "admin" && (
        <section className="rounded-[2.5rem] border border-white/70 bg-white/85 p-6 shadow-panel">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-earth-950">Land Stack Search Engine</h3>
            <p className="text-xs text-earth-600">Search by 14-Digit ULPIN, Survey Number, Village, or Landowner Name</p>
          </div>
        </div>

        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder={t("searchPlaceholder")}
        />

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-earth-600">
          <span className="font-semibold text-earth-800">Quick Demos:</span>
          <button
            type="button"
            onClick={() => setQuery("33030400100482")}
            className="rounded-full bg-blue-50 px-2.5 py-1 text-blue-800 hover:bg-blue-100 font-mono"
          >
            33030400100482 (Tamil Nadu)
          </button>
          <button
            type="button"
            onClick={() => setQuery("04010100200814")}
            className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-800 hover:bg-amber-100 font-mono"
          >
            04010100200814 (Chandigarh UT)
          </button>
          <button
            type="button"
            onClick={() => setQuery("KAR-BGM-0003")}
            className="rounded-full bg-red-50 px-2.5 py-1 text-red-800 hover:bg-red-100 font-mono font-bold"
          >
            KAR-BGM-0003 (Court Stay Active)
          </button>
          <button
            type="button"
            onClick={() => setQuery("29140200300119")}
            className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-800 hover:bg-emerald-100 font-mono"
          >
            29140200300119 (Karnataka)
          </button>
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-earth-500 hover:text-earth-900 underline ml-2"
            >
              Clear
            </button>
          )}
        </div>
        </section>
      )}

      {/* Cadastral Parcels List */}
      {activeRole === "admin" && (
        <ParcelList
          parcels={results}
          title={selectedState === "All" ? "Parcel directory" : `${selectedState} parcels`}
        />
      )}
    </div>
  );
};

const ParcelLookupPage = ({ role }) => {
  const [ulpin, setUlpin] = useState("");
  const [matches, setMatches] = useState([]);
  const [searchedUlpin, setSearchedUlpin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const roleGuidance = {
    revenue_officer: "RoR, mutation and revenue status",
    surveyor: "Cadastral geometry, survey records and subdivision",
    sro: "Registration status, encumbrance and transfer restrictions",
    court: "Revenue court cases, orders and active stay restrictions",
    bank: "Permitted recorded ownership and mortgage information"
  }[role];

  const search = async (event) => {
    event.preventDefault();
    const normalizedUlpin = ulpin.trim();
    setMatches([]);
    setError("");
    setSearchedUlpin(normalizedUlpin);
    if (!normalizedUlpin) {
      setError("Enter a ULPIN to search land records.");
      return;
    }

    setLoading(true);
    try {
      const response = await searchParcels({ search: normalizedUlpin });
      setMatches(role === "citizen"
        ? response.items.filter((parcel) =>
            String(parcel.ulpin || "").trim().toLocaleLowerCase() === normalizedUlpin.toLocaleLowerCase()
          )
        : response.items);
    } catch {
      setError("Land records could not be searched. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setUlpin("");
    setMatches([]);
    setSearchedUlpin("");
    setError("");
  };

  return (
    <main className="mx-auto max-w-4xl space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold text-slate-600">
          {role === "citizen" ? "Citizen services · Land records" : "Department parcel workspace · Application demo RBAC"}
        </p>
        <h2 className="mt-2 text-2xl font-bold text-[#0B2545] sm:text-3xl">
          {role === "citizen" ? "Search a land parcel" : "Parcel lookup"}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
          {role === "citizen"
            ? "Search by ULPIN to locate a parcel on the cadastral map and review the land-record information available for it."
            : "Search an exact ULPIN, survey number, or parcel identifier. The parcel workspace shows information permitted for your current role."}
        </p>
        {roleGuidance && (
          <p className="mt-3 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-700">
            Workspace view: {roleGuidance}.
          </p>
        )}

        <form onSubmit={search} className="mt-6">
          <label htmlFor="citizen-ulpin" className="mb-2 block text-sm font-semibold text-slate-800">
            {role === "citizen" ? "ULPIN" : "ULPIN, survey number, or parcel identifier"}
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="citizen-ulpin"
              value={ulpin}
              onChange={(event) => setUlpin(event.target.value)}
              autoComplete="off"
              inputMode="numeric"
              placeholder="Enter parcel ULPIN"
              className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 font-mono text-sm text-slate-900 placeholder:font-sans placeholder:text-slate-400 focus:border-[#0B2545] focus:outline-none focus:ring-2 focus:ring-[#0B2545]/20"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-[#0B2545] px-5 py-3 text-sm font-semibold text-white hover:bg-[#16385f] disabled:cursor-wait disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2545]"
            >
              {loading ? "Searching…" : role === "citizen" ? "Search ULPIN" : "Search parcel"}
            </button>
            {(ulpin || searchedUlpin) && (
              <button
                type="button"
                onClick={clearSearch}
                className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2545]"
              >
                Clear
              </button>
            )}
          </div>
        </form>
      </section>

      {error && <p role="alert" className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">{error}</p>}

      {searchedUlpin && !loading && !error && matches.length === 0 && (
        <p role="status" className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
      {role === "citizen"
        ? "No land parcel found for the entered ULPIN."
        : "No matching parcel was found for the entered identifier."}
        </p>
      )}

      {matches.map((parcel) => (
        <section key={parcel.parcelId} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Parcel found</p>
              <h3 className="mt-1 font-mono text-lg font-bold text-[#0B2545]">{parcel.ulpin}</h3>
              <p className="mt-1 text-sm text-slate-700">
                {parcel.village}, {parcel.taluk}, {parcel.district}, {parcel.state}
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Survey number {parcel.surveyNumber} · {parcel.areaInAcres} acres
              </p>
            </div>
            <Link
              to={`/parcels/${encodeURIComponent(parcel.parcelId)}?mapSearch=1`}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0B2545] px-4 py-3 text-sm font-semibold text-white hover:bg-[#16385f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2545]"
            >
              <MapPinned size={16} />
              {role === "citizen" ? "View on cadastral map" : "Open parcel workspace"}
            </Link>
          </div>
        </section>
      ))}

      <p className="rounded-xl bg-slate-100 p-4 text-xs leading-5 text-slate-600">
        Parcel records shown are from the local demonstration dataset. Role permissions are application-level demo rules and do not establish legal authority.
      </p>
    </main>
  );
};

const HomePage = () => {
  const { activeRole } = useAuth();
  if (activeRole !== "citizen") return <DepartmentHomePage />;
  return <ParcelLookupPage role={activeRole} />;
};

export default HomePage;
