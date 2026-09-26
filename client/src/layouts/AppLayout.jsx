import { useState } from "react";
import { BookOpen, FileCheck, Landmark, Layers, MapPinned, QrCode, Shield, UserCheck } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

const navClass = ({ isActive }) =>
  `rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition ${
    isActive ? "bg-earth-900 text-earth-50 shadow-sm" : "text-earth-800 hover:bg-earth-100"
  }`;

const AppLayout = () => {
  const [activeRole, setActiveRole] = useState("citizen");

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(167,128,57,0.14),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(47,143,165,0.12),_transparent_32%),linear-gradient(180deg,_#f8f6ef_0%,_#f2eddc_55%,_#edf6f1_100%)]">
      {/* Subtle National Tricolor Accent Bar */}
      <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 via-white to-emerald-600" />

      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-12 pt-5 sm:px-6 lg:px-8">
        {/* Header Banner */}
        <header className="glass-panel mb-8 flex flex-col gap-5 rounded-[2.2rem] p-5 shadow-panel md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-900 text-2xl text-amber-100 shadow-md">
              🏛️
            </div>
            <div>
              <div className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-amber-100/80 px-3 py-0.5 text-[11px] font-bold uppercase tracking-[0.22em] text-amber-900">
                <Landmark size={12} />
                Govt. of India • DoLR Pilot Platform
              </div>
              <h1 className="text-2xl font-black tracking-tight text-earth-950 sm:text-3xl">
                Land Stack <span className="text-sm font-normal text-earth-600">| Integrated DPI for Land Governance</span>
              </h1>
              <p className="mt-1 max-w-2xl text-xs text-earth-700 sm:text-sm">
                Unified GIS-based Digital Public Infrastructure linking Cadastral Maps, Record of Rights (RoR),
                Master Plan Zoning, Utilities, and Blockchain Audit Trails across Indian States & UTs.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-start gap-3 md:items-end">
            {/* Persona / Role Switcher */}
            <div className="flex items-center gap-1 rounded-full border border-earth-200 bg-earth-50/80 p-1 text-xs">
              <span className="px-2 font-bold text-earth-500 uppercase text-[10px]">Role:</span>
              <button
                type="button"
                onClick={() => setActiveRole("citizen")}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                  activeRole === "citizen" ? "bg-earth-900 text-white shadow-xs" : "text-earth-700 hover:bg-earth-200/60"
                }`}
              >
                👤 Citizen
              </button>
              <button
                type="button"
                onClick={() => setActiveRole("revenue")}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                  activeRole === "revenue" ? "bg-earth-900 text-white shadow-xs" : "text-earth-700 hover:bg-earth-200/60"
                }`}
              >
                📜 Revenue
              </button>
              <button
                type="button"
                onClick={() => setActiveRole("planning")}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                  activeRole === "planning" ? "bg-earth-900 text-white shadow-xs" : "text-earth-700 hover:bg-earth-200/60"
                }`}
              >
                📐 Planning
              </button>
              <button
                type="button"
                onClick={() => setActiveRole("sro")}
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                  activeRole === "sro" ? "bg-earth-900 text-white shadow-xs" : "text-earth-700 hover:bg-earth-200/60"
                }`}
              >
                🖋️ SRO
              </button>
            </div>

            {/* Navigation links */}
            <nav className="flex flex-wrap gap-1.5">
              <NavLink to="/" end className={navClass}>
                <span className="inline-flex items-center gap-1.5">
                  <MapPinned size={15} />
                  Cadastre Explorer
                </span>
              </NavLink>
              <NavLink to="/std" className={navClass}>
                <span className="inline-flex items-center gap-1.5">
                  <BookOpen size={15} />
                  Tech Standards (STD)
                </span>
              </NavLink>
              <NavLink to="/scan" className={navClass}>
                <span className="inline-flex items-center gap-1.5">
                  <QrCode size={15} />
                  Verify Hash / QR
                </span>
              </NavLink>
            </nav>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1">
          <Outlet context={{ activeRole, setActiveRole }} />
        </main>

        {/* Official Footer */}
        <footer className="mt-12 rounded-[2rem] border border-earth-200/80 bg-white/75 p-5 text-xs text-earth-700 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-bold text-earth-900">
                Land Stack — An Integrated GIS-based Digital Public Infrastructure for Land Governance
              </p>
              <p className="mt-0.5 text-earth-600">
                Department of Land Resources (DoLR), Ministry of Rural Development, Government of India.
                Pilots active in Chandigarh (UT) and Tamil Nadu (Launched 31 Dec 2025).
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-earth-500">
              <span className="inline-flex items-center gap-1 text-emerald-800 font-semibold">
                <Shield size={13} />
                Sepolia Audit Anchor Active
              </span>
              <span>•</span>
              <span>14-Digit ULPIN Standard</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AppLayout;
