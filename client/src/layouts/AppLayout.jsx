import { Landmark, MapPinned, QrCode } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

const navClass = ({ isActive }) =>
  `rounded-full px-4 py-2 text-sm transition ${
    isActive ? "bg-earth-900 text-earth-50" : "text-earth-800 hover:bg-earth-100"
  }`;

const AppLayout = () => (
  <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(167,128,57,0.16),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(47,143,165,0.12),_transparent_32%),linear-gradient(180deg,_#f8f6ef_0%,_#f2eddc_55%,_#edf6f1_100%)]">
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <header className="glass-panel mb-8 flex flex-col gap-5 rounded-[2rem] p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-earth-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-earth-700">
            <Landmark size={14} />
            Karnataka-only land parcel registry MVP
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-earth-900 sm:text-3xl">
            Landchain Karnataka
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-earth-700 sm:text-base">
            Tamper-evident parcel history, document fingerprint verification, and QR-based land record checks for
            Karnataka 2D land parcels.
          </p>
        </div>

        <nav className="flex flex-wrap gap-2">
          <NavLink to="/" className={navClass}>
            <span className="inline-flex items-center gap-2">
              <MapPinned size={16} />
              Parcels
            </span>
          </NavLink>
          <NavLink to="/scan" className={navClass}>
            <span className="inline-flex items-center gap-2">
              <QrCode size={16} />
              Scan QR
            </span>
          </NavLink>
        </nav>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-10 rounded-[2rem] border border-earth-200/70 bg-white/70 px-5 py-4 text-sm text-earth-700 backdrop-blur">
        Authoritative Karnataka revenue, registration, and survey records remain the legal source of truth. Blockchain
        entries in this MVP provide provenance and tamper-evident fingerprints only.
      </footer>
    </div>
  </div>
);

export default AppLayout;

