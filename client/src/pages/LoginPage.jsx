import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AlertCircle, CheckCircle2, KeyRound, Landmark, Lock, Mail, ShieldCheck, User } from "lucide-react";
import { useAuth, demoRolePersonas } from "../context/AuthContext";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, user, logout } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // If already authenticated, allow redirect or signing in as different user
  const from = location.state?.from?.pathname || "/";

  const handlePersonaSelect = (roleKey) => {
    const persona = demoRolePersonas[roleKey];
    if (persona) {
      setSelectedRole(roleKey);
      setUsername(persona.email);
      setErrorMessage("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!username.trim() || !password) {
      setErrorMessage("Please enter both your institutional identifier and password.");
      return;
    }

    setLoading(true);

    try {
      await login(username.trim(), password);
      // On success, redirect to authenticated landing page
      navigate(from, { replace: true });
    } catch (err) {
      // Safe, non-leaking user-facing error message
      const apiMessage = err.response?.data?.message;
      if (err.response?.status === 401) {
        setErrorMessage("Authentication failed. Invalid email, role, or password. Please verify your credentials.");
      } else if (err.response?.status === 400) {
        setErrorMessage(apiMessage || "Invalid request. Please provide valid credentials.");
      } else {
        setErrorMessage("Unable to connect to the authentication authority. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl py-6 px-4">
      {/* Official Government Header Banner */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0B2545] text-white shadow-sm">
          <Landmark size={28} />
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1 text-xs font-semibold text-[#334155] shadow-xs">
          <span className="h-2 w-2 rounded-full bg-amber-600" />
          Government of India • Ministry of Rural Development (MoRD)
        </div>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-[#0B2545] sm:text-3xl">
          National Land Stack DPI Portal
        </h1>
        <p className="mt-1 text-sm text-[#334155]">
          Single Sign-On Authentication for Federated Land Governance & Bhu-Aadhaar Operations
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-12">
        {/* Left Column: Formal Sign-In Card */}
        <div className="md:col-span-7">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
            {/* Top Security Indicator */}
            <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#334155]">
                <ShieldCheck size={16} className="text-emerald-700" />
                Institutional Security Gateway
              </div>
              <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-600">
                JWT • SHA-256
              </span>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800"
              >
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
                <div>
                  <p className="font-semibold">Authentication Error</p>
                  <p className="mt-0.5">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Active Session Notice if already logged in */}
            {isAuthenticated && user && (
              <div className="mb-5 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-900">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-semibold">Active Session: </span>
                    <span>{user.name} ({user.role})</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-lg border border-emerald-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100 transition"
                >
                  Sign Out
                </button>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="login-username"
                  className="block text-xs font-semibold text-[#334155] mb-1.5"
                >
                  Official Email or Role Identifier
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Mail size={16} />
                  </span>
                  <input
                    id="login-username"
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. admin@landstack.gov.in"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-2.5 pl-9 pr-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0B2545] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0B2545] transition"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="login-password"
                  className="block text-xs font-semibold text-[#334155] mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Lock size={16} />
                  </span>
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter security password"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50/50 py-2.5 pl-9 pr-12 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#0B2545] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0B2545] transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-[11px] font-medium text-slate-500 hover:text-slate-800"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-[#0B2545] py-2.5 px-4 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-[#133863] focus:outline-none focus:ring-2 focus:ring-[#0B2545] focus:ring-offset-2 disabled:opacity-60 transition flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span>Verifying Credentials...</span>
                  ) : (
                    <>
                      <KeyRound size={16} />
                      <span>Sign In to Institutional Console</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-center pt-2">
                <p className="text-[11px] text-slate-500">
                  Use the individually provisioned password for your account.
                </p>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: One-Click Demo Personas Selector */}
        <div className="md:col-span-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 border-b border-slate-100 pb-3">
              <span className="inline-block rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-900 border border-amber-200">
                Evaluation Assist
              </span>
              <h2 className="mt-1 text-sm font-bold text-[#0B2545]">
                Institutional accounts
              </h2>
              <p className="mt-0.5 text-[11px] text-[#334155]">
                Select an account to pre-fill its email address. Passwords are not shared.
              </p>
            </div>

            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {Object.entries(demoRolePersonas).map(([roleKey, persona]) => {
                const isSelected = selectedRole === roleKey;

                return (
                  <button
                    key={roleKey}
                    type="button"
                    onClick={() => handlePersonaSelect(roleKey)}
                    className={`w-full text-left rounded-xl p-3 border transition flex items-start gap-3 ${
                      isSelected
                        ? "border-[#0B2545] bg-slate-50 ring-1 ring-[#0B2545]"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/60"
                    }`}
                  >
                    <span className="text-xl shrink-0 mt-0.5">{persona.avatar}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-xs text-[#0B2545] truncate">
                          {persona.name}
                        </span>
                        <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                          {persona.role}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#334155] truncate mt-0.5">
                        {persona.designation}
                      </p>
                      <p className="text-[10px] font-mono text-slate-400 truncate">
                        {persona.email}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
