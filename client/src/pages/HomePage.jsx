import { useDeferredValue, useEffect, useState } from "react";
import { AlertTriangle, Landmark, ShieldCheck } from "lucide-react";
import { fetchBlockchainStatus, fetchDashboard, searchParcels } from "../api/client";
import MetricCard from "../components/MetricCard";
import ParcelList from "../components/ParcelList";
import SearchBar from "../components/SearchBar";
import StatusPill from "../components/StatusPill";

const HomePage = () => {
  const [dashboard, setDashboard] = useState(null);
  const [blockchainStatus, setBlockchainStatus] = useState(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [dashboardData, blockchainData] = await Promise.all([fetchDashboard(), fetchBlockchainStatus()]);
        setDashboard(dashboardData);
        setBlockchainStatus(blockchainData);
        setResults(dashboardData.featuredParcels);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    const search = async () => {
      if (!dashboard) {
        return;
      }

      if (!deferredQuery.trim()) {
        setResults(dashboard.featuredParcels);
        return;
      }

      const response = await searchParcels(deferredQuery);
      setResults(response.items);
    };

    search();
  }, [dashboard, deferredQuery]);

  if (loading && !dashboard) {
    return <div className="rounded-[2rem] border border-white/60 bg-white/80 p-10 text-earth-800">Loading Karnataka parcel records...</div>;
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="overflow-hidden rounded-[2.5rem] border border-white/70 bg-[linear-gradient(135deg,_rgba(48,33,17,0.96),_rgba(104,77,36,0.92)_45%,_rgba(34,69,47,0.95)_100%)] p-7 text-earth-50 shadow-panel">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-earth-100">
            <Landmark size={14} />
            Karnataka parcel verification
          </div>
          <h2 className="mt-5 max-w-3xl text-4xl font-extrabold leading-tight">
            Search a 2D Karnataka land parcel, inspect its provenance, and validate its document fingerprints.
          </h2>
          <p className="mt-4 max-w-3xl text-sm text-earth-100/90 sm:text-base">
            The platform links RTC-style records, mutation trail, registration metadata, encumbrance information,
            cadastral geometry, and blockchain audit fingerprints without claiming that blockchain itself creates title.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <StatusPill status="demo">Karnataka-only scope</StatusPill>
            <StatusPill status={blockchainStatus?.enabled ? "verified" : "attention"}>
              {blockchainStatus?.enabled ? "Live Sepolia" : "Demo-ready Sepolia"}
            </StatusPill>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-panel">
            <div className="mb-3 inline-flex rounded-full bg-lake-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-lake-800">
              Legal guardrail
            </div>
            <p className="text-sm text-earth-800">{dashboard.legalNotice}</p>
          </div>
          <div className="rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-panel">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-field-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-field-800">
              <ShieldCheck size={14} />
              Verification signal
            </div>
            <p className="text-sm text-earth-800">
              Citizen reports combine authoritative-style demo records with tamper-evident hash history, then flag
              pending mutations, encumbrances, and inconsistent ownership signals.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Parcels" value={dashboard.stats.totalParcels} caption="Seeded Karnataka parcel records" />
        <MetricCard label="Anchored docs" value={dashboard.stats.anchoredDocuments} caption="Fingerprint records ready for audit trail review" />
        <MetricCard label="Flagged" value={dashboard.stats.flaggedParcels} caption="Parcels that need attention or manual review" />
        <MetricCard label="Encumbrances" value={dashboard.stats.activeEncumbrances} caption="Seeded active burdens or crop-loan style entries" />
      </div>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <SearchBar value={query} onChange={setQuery} />
          <p className="text-sm text-earth-700">
            Search works across ULPIN, survey number, hissa, khata, district, taluk, hobli, and village.
          </p>
        </div>

        <div className="rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-panel">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-800">
            <AlertTriangle size={14} />
            Demo integrations
          </div>
          <p className="text-sm text-earth-800">
            Where live Karnataka APIs are unavailable, the backend uses explicit demo adapters for Bhoomi-like RTC,
            Kaveri-style registration, and survey/cadastral responses.
          </p>
        </div>
      </section>

      <ParcelList parcels={results} title={query ? "Search results" : "Featured Karnataka parcels"} />
    </div>
  );
};

export default HomePage;

