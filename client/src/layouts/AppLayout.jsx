import { useState } from "react";
import {
  Bell,
  BookOpen,
  ClipboardList,
  FileCheck,
  Globe,
  Landmark,
  Layers,
  LogIn,
  LogOut,
  MapPinned,
  QrCode,
  Radio,
  Shield,
  UserCheck,
  X,
  Zap
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useLiveEvents } from "../context/LiveEventContext";

const navClass = ({ isActive }) =>
  `rounded-full px-4 py-2 text-xs sm:text-sm font-semibold transition ${
    isActive ? "bg-earth-900 text-earth-50 shadow-sm" : "text-earth-800 hover:bg-earth-100"
  }`;

const AppLayout = () => {
  const { activeRole, switchRole, currentPersona, demoRolePersonas, isAuthenticated, user, logout } = useAuth();
  const { lang, setLanguage, t, availableLangs } = useLanguage();
  const { gatewayStatus, activeToasts, removeToast } = useLiveEvents();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Subtle National Tricolor Accent Bar */}
      <div className="h-1.5 w-full bg-[#0B2545]" />

      {/* Floating Real-Time Toast Notifications (Top Right) */}
      <div className="fixed top-4 right-4 z-[3000] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {activeToasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-lg"
          >
            <div className="flex items-start gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-400 text-earth-950 text-xs shrink-0 mt-0.5">
                <Zap size={14} />
              </span>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-earth-500">
                  {toast.type || "DPI Real-Time Event"}
                </span>
                <p className="text-xs font-extrabold text-earth-950 mt-0.5">
                  {toast.payload?.summary || toast.message || "Inter-Agency State Synchronized"}
                </p>
                {toast.payload?.parcelId && (
                  <p className="text-[10px] font-mono text-earth-600">
                    ULPIN / Parcel: {toast.payload.parcelId}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-earth-400 hover:text-earth-800 p-1"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-12 pt-5 sm:px-6 lg:px-8">
        {/* Header Banner */}
        <header className="glass-panel mb-8 flex flex-col gap-4 rounded-[2.2rem] p-5 shadow-panel md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-900 text-2xl text-amber-100 shadow-md">
              🏛️
            </div>
            <div>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/80 px-3 py-0.5 text-[11px] font-bold uppercase tracking-[0.22em] text-amber-900">
                  <Landmark size={12} />
                  Govt. of India • DoLR Pilot Platform
                </span>

                {/* Compact Live DPI Gateway Telemetry Pill */}
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold tracking-wide border shadow-xs ${
                  gatewayStatus === "connected"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                    : gatewayStatus === "reconnecting"
                    ? "bg-amber-50 text-amber-800 border-amber-300"
                    : "bg-rose-50 text-rose-800 border-rose-300"
                }`}>
                  <span className={`h-2 w-2 rounded-full ${
                    gatewayStatus === "connected"
                      ? "bg-emerald-500"
                      : gatewayStatus === "reconnecting"
                      ? "bg-amber-500"
                      : "bg-rose-500"
                  }`} />
                  {gatewayStatus === "connected"
                    ? t("liveGatewayConnected")
                    : gatewayStatus === "reconnecting"
                    ? t("liveGatewayReconnecting")
                    : t("liveGatewayOffline")}
                </span>
              </div>

              <h1 className="text-2xl font-black tracking-tight text-earth-950 sm:text-3xl">
                Land Stack <span className="text-sm font-normal text-earth-600">| {t("subtitle")}</span>
              </h1>
            </div>
          </div>

          <div className="flex flex-col items-start gap-2.5 md:items-end">
            <div className="flex flex-wrap items-center gap-2">
              {/* Language Selector */}
              <div className="flex items-center rounded-full border border-earth-200 bg-earth-50/80 p-0.5 text-[11px] font-bold">
                <span className="pl-2 pr-1 text-earth-400">
                  <Globe size={12} />
                </span>
                {[
                  { code: "en", label: "EN" },
                  { code: "hi", label: "हि" },
                  { code: "kn", label: "ಕ" },
                  { code: "ta", label: "த" }
                ].map(({ code, label }) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setLanguage(code)}
                    className={`rounded-full px-2 py-0.5 transition ${
                      lang === code ? "bg-earth-900 text-white shadow-xs" : "text-earth-600 hover:text-earth-900"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* 6-Persona Role Selector */}
              {activeRole === "citizen" ? (
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700">
                  Citizen land-record view
                </span>
              ) : (
                <div className="flex items-center gap-1 rounded-full border border-earth-200 bg-earth-50/80 p-1 text-xs">
                  <span className="px-2 font-bold text-earth-500 uppercase text-[10px]">Persona:</span>
                  <select
                    value={activeRole}
                    onChange={(e) => switchRole(e.target.value)}
                    className="rounded-full bg-white px-3 py-1 font-bold text-earth-900 border border-earth-300 shadow-xs focus:outline-none cursor-pointer text-xs"
                  >
                    <option value="citizen">👤 Citizen Landowner</option>
                    <option value="revenue_officer">📜 Revenue Officer (Tehsildar)</option>
                    <option value="surveyor">📐 Revenue Surveyor (CORS GNSS)</option>
                    <option value="sro">🖋️ Sub-Registrar (SRO)</option>
                    <option value="bank">🏦 Bank (Finacle / Mortgage)</option>
                    <option value="court">⚖️ Revenue Court (RCCMS)</option>
                    <option value="admin">🏛️ National Admin (DoLR)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Navigation links */}
            <nav className="flex flex-wrap items-center gap-1.5">
              <NavLink to="/" end className={navClass}>
                <span className="inline-flex items-center gap-1.5">
                  <MapPinned size={15} />
                  Cadastre Explorer
                </span>
              </NavLink>
              {activeRole !== "citizen" && (
                <>
                  <NavLink to="/std" className={navClass}>
                    <span className="inline-flex items-center gap-1.5">
                      <BookOpen size={15} />
                      Tech Standards (STD)
                    </span>
                  </NavLink>
                  <NavLink to="/operations" className={navClass}>
                    <span className="inline-flex items-center gap-1.5">
                      <Shield size={15} />
                      Operations
                    </span>
                  </NavLink>
                  {["admin", "surveyor"].includes(activeRole) && (
                    <NavLink to="/field-survey" className={navClass}>
                      <span className="inline-flex items-center gap-1.5">
                        <ClipboardList size={15} />
                        Field Survey
                      </span>
                    </NavLink>
                  )}
                  <NavLink to="/scan" className={navClass}>
                  <span className="inline-flex items-center gap-1.5">
                    <QrCode size={15} />
                    Verify Hash / QR
                  </span>
                  </NavLink>
                </>
              )}

              {/* Login or Authenticated User Menu */}
              {isAuthenticated ? (
                <div className="flex items-center gap-1.5 pl-1">
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 border border-slate-200">
                    <UserCheck size={13} className="text-emerald-700" />
                    <span className="truncate max-w-[110px]">{user?.name?.split(",")[0] || "Official"}</span>
                  </span>
                  <button
                    type="button"
                    onClick={logout}
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 transition"
                  >
                    <LogOut size={13} />
                    Sign Out
                  </button>
                </div>
              ) : (
                <NavLink to="/login" className={navClass}>
                  <span className="inline-flex items-center gap-1.5 text-amber-900 font-bold">
                    <LogIn size={15} />
                    Official Login
                  </span>
                </NavLink>
              )}
            </nav>
          </div>
        </header>

        {/* Main Routed Page Content */}
        <main className="flex-1">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="mt-12 border-t border-earth-200/80 pt-6 text-center text-xs text-earth-600">
          <p className="font-semibold text-earth-800">
            Land Stack: National Integrated GIS-Based Digital Public Infrastructure (DPI) for Land Governance
          </p>
          <p className="mt-1 text-[11px] text-earth-500">
            Department of Land Resources (DoLR), Ministry of Rural Development, Government of India • SIH26014
          </p>
        </footer>
      </div>

    </div>
  );
};

export default AppLayout;
