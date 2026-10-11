import { useDeferredValue, useEffect, useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle,
  Database,
  Landmark,
  Layers,
  MapPinned,
  Search,
  ShieldAlert,
  ShieldCheck,
  Zap
} from "lucide-react";
import { fetchBlockchainStatus, fetchDashboard, searchParcels } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useLiveEvents } from "../context/LiveEventContext";
import MetricCard from "../components/MetricCard";
import ParcelList from "../components/ParcelList";
import SearchBar from "../components/SearchBar";
import StatusPill from "../components/StatusPill";

const HomePage = () => {
  const { activeRole, currentPersona } = useAuth();
  const { t } = useLanguage();
  const { refreshKey } = useLiveEvents();

  const [dashboard, setDashboard] = useState(null);
  const [blockchainStatus, setBlockchainStatus] = useState(null);
  const [selectedState, setSelectedState] = useState("All");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const deferredQuery = useDeferredValue(query);

  const loadData = async () => {
    try {
      const [dashboardData, blockchainData] = await Promise.all([fetchDashboard(), fetchBlockchainStatus()]);
      setDashboard(dashboardData);
      setBlockchainStatus(blockchainData);
      setResults(dashboardData.featuredParcels);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  useEffect(() => {
    const search = async () => {
      if (!dashboard) return;

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
  }, [dashboard, deferredQuery, selectedState]);

  if (loading && !dashboard) {
    return (
      <div className="rounded-[2.5rem] border border-white/60 bg-white/80 p-12 text-center text-earth-800">
        <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-amber-900 border-t-transparent" />
        <p className="font-bold text-lg">Initializing Land Stack National DPI...</p>
        <p className="text-xs text-earth-600 mt-1">Connecting to state cadastral gateways & Sepolia audit layer</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-[2.5rem] border border-white/70 bg-[linear-gradient(135deg,_rgba(31,41,55,0.98),_rgba(48,33,17,0.95)_45%,_rgba(6,78,59,0.96)_100%)] p-8 text-earth-50 shadow-panel">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-amber-200">
              <Landmark size={14} />
              Department of Land Resources (DoLR) • Land Stack DPI
            </div>
            <h2 className="mt-4 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
              India's Integrated GIS Platform for Modern Land Governance
            </h2>
            <p className="mt-4 text-sm text-gray-200 sm:text-base leading-relaxed">
              Consolidating <strong>Base Cadastral Boundaries</strong>, <strong>Essential Governance (RoR & RRR)</strong>,
              and <strong>Use-Case Infrastructure</strong> around 14-digit Bhu-Aadhaar (ULPIN). Piloted across Chandigarh (UT),
              Tamil Nadu (Launched 31 Dec 2025), and Karnataka.
            </p>

            {/* Quick State Filters */}
            <div className="mt-6 flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold uppercase tracking-wider text-amber-300 mr-1 text-[11px]">Pilot Filter:</span>
              {["All", "Tamil Nadu", "Chandigarh (UT)", "Karnataka"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedState(st)}
                  className={`rounded-full px-3.5 py-1.5 font-bold transition ${
                    selectedState === st
                      ? "bg-amber-400 text-earth-950 shadow-md scale-105"
                      : "bg-white/15 text-white hover:bg-white/25"
                  }`}
                >
                  {st === "All" ? "🇮🇳 All National Pilots" : st}
                </button>
              ))}
            </div>
          </div>

          {/* Right Hero Badge */}
          <div className="rounded-3xl border border-white/20 bg-white/10 p-5 backdrop-blur-md lg:w-72 shrink-0">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-200">Digital Public Infrastructure</p>
            <div className="mt-3 space-y-2 text-xs text-gray-200">
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-400 shrink-0" />
                <span>3-Tier Spatial Layering</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-400 shrink-0" />
                <span>14-Digit ULPIN Standard</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-400 shrink-0" />
                <span>AI Satellite Encroachment Radar</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={14} className="text-emerald-400 shrink-0" />
                <span>Sepolia Tamper-Evident Trail</span>
              </div>
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
            Switch roles using the top-right header selector or Live Demo Dock
          </div>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Pilot States & UTs"
          value={dashboard?.stats?.statesOnboarded || 3}
          hint="Tamil Nadu, Chandigarh UT & Karnataka"
        />
        <MetricCard
          label="Spatial Layers Standard"
          value="3 Layers"
          hint="Base, Essential (RRR) & Use-Case"
        />
        <MetricCard
          label="AI Anomalies Flagged"
          value={dashboard?.stats?.aiAnomaliesDetected || 2}
          hint="Satellite change & encroachment radar"
        />
        <MetricCard
          label="Sepolia Audit Layer"
          value={blockchainStatus?.enabled ? "Live Sepolia" : "Active DPI"}
          hint="Tamper-evident cryptographic ledger"
        />
      </section>

      {/* Search Bar with Quick Sample Buttons */}
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

      {/* Cadastral Parcels List */}
      <ParcelList
        parcels={results}
        title={selectedState === "All" ? "National Cadastral Directory (All Pilots)" : `${selectedState} Land Records`}
      />
    </div>
  );
};

export default HomePage;
