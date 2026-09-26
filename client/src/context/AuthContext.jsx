import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCurrentUser, loginApi, logoutApi, switchRoleApi } from "../api/client";
import { lockOfflineVault } from "../utils/offlineSurvey";

const AuthContext = createContext();
const SESSION_INVALID_EVENT = "landstack:session-invalid";
const ACCESS_DENIED_EVENT = "landstack:access-denied";

const cacheOfflineIdentity = (user) => {
  localStorage.setItem("landstack_user", JSON.stringify({ id: user.id, role: user.role }));
};

export const demoRolePersonas = {
  admin: {
    role: "admin",
    name: "Dr. Rameshwar Sharma, IAS",
    designation: "DoLR National Platform Administrator",
    department: "Department of Land Resources (DoLR), MoRD",
    email: "admin@landstack.gov.in",
    avatar: "🏛️",
    badgeColor: "bg-purple-100 text-purple-900 border-purple-200"
  },
  revenue_officer: {
    role: "revenue_officer",
    name: "K. Annadurai, DRO",
    designation: "Tehsildar / Village Administrative Officer",
    department: "Revenue & Disaster Management Department",
    email: "tehsildar@tamilnilam.tn.gov.in",
    avatar: "📜",
    badgeColor: "bg-amber-100 text-amber-900 border-amber-200"
  },
  surveyor: {
    role: "surveyor",
    name: "P. Vignesh, LIS",
    designation: "Directorate of Survey & Land Records",
    department: "Survey Settlement & Land Records (SSLR)",
    email: "surveyor@surveyofindia.gov.in",
    avatar: "📐",
    badgeColor: "bg-blue-100 text-blue-900 border-blue-200"
  },
  sro: {
    role: "sro",
    name: "Meenakshi Sundaram",
    designation: "Sub-Registrar / Registration & Stamps Department",
    department: "Registration & Stamps Department",
    email: "sro.sriperumbudur@tnreginet.gov.in",
    avatar: "🖋️",
    badgeColor: "bg-rose-100 text-rose-900 border-rose-200"
  },
  bank: {
    role: "bank",
    name: "Vikram Malhotra",
    designation: "Financial Institution / Core Banking",
    department: "Indian Overseas Bank / Core Banking (Finacle)",
    email: "mortgages@iob.bank.in",
    avatar: "🏦",
    badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-200"
  },
  court: {
    role: "court",
    name: "Hon. Justice B. Patil",
    designation: "Revenue Court / RCCMS Judicial Officer",
    department: "Revenue Court Case Management System (RCCMS)",
    email: "rccms.bench@judiciary.gov.in",
    avatar: "⚖️",
    badgeColor: "bg-red-100 text-red-900 border-red-200"
  },
  citizen: {
    role: "citizen",
    name: "Ananya Narayanan",
    designation: "Public Landholder / Applicant",
    department: "Public User",
    email: "ananya.citizen@gmail.com",
    avatar: "👤",
    badgeColor: "bg-gray-100 text-gray-800 border-gray-200"
  }
};

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [activeRole, setActiveRole] = useState("citizen");
  const [accessDenied, setAccessDenied] = useState(null);

  useEffect(() => {
    let disposed = false;
    const restoreSession = async () => {
      localStorage.removeItem("landstack_token");
      try {
        const data = await fetchCurrentUser();
        if (disposed) return;
        setUser(data.user);
        setActiveRole(data.user.role);
        cacheOfflineIdentity(data.user);
        localStorage.setItem("landstack_role", data.user.role);
      } catch (error) {
        if (disposed) return;
        if (!navigator.onLine) {
          try {
            const cached = localStorage.getItem("landstack_user");
            const offlineUser = cached ? JSON.parse(cached) : null;
            if (offlineUser?.id && demoRolePersonas[offlineUser.role]) {
              setUser(offlineUser);
              setActiveRole(offlineUser.role);
            }
          } catch (storageError) {
            console.error("Cached offline identity could not be restored.", storageError);
          }
        } else if (error.response?.status !== 401) {
          console.error("The saved session could not be validated.", error);
        }
      } finally {
        if (!disposed) setSessionLoading(false);
      }
    };
    restoreSession();
    return () => {
      disposed = true;
    };
  }, []);

  // A validated server identity replaces any cached offline profile.
  useEffect(() => {
    if (user?.role) {
      setActiveRole(user.role);
      localStorage.setItem("landstack_role", user.role);
      cacheOfflineIdentity(user);
    }
  }, [user]);

  useEffect(() => {
    const handleSessionInvalid = () => {
      lockOfflineVault(user?.id);
      setUser(null);
      setActiveRole("citizen");
      setSessionLoading(false);
      localStorage.removeItem("landstack_token");
      localStorage.removeItem("landstack_user");
      localStorage.setItem("landstack_role", "citizen");
      navigate("/login", { replace: true });
    };
    const handleAccessDenied = (event) => setAccessDenied(event.detail);

    window.addEventListener(SESSION_INVALID_EVENT, handleSessionInvalid);
    window.addEventListener(ACCESS_DENIED_EVENT, handleAccessDenied);
    return () => {
      window.removeEventListener(SESSION_INVALID_EVENT, handleSessionInvalid);
      window.removeEventListener(ACCESS_DENIED_EVENT, handleAccessDenied);
    };
  }, [navigate, user?.id]);

  /**
   * Institutional login uses a server-set HttpOnly session cookie.
   */
  const login = async (emailOrRole, password) => {
    const payload = emailOrRole.includes("@")
      ? { email: emailOrRole, password }
      : { role: emailOrRole, password };

    const data = await loginApi(payload);

    if (data.user) {
      setUser(data.user);
      setActiveRole(data.user.role);
      cacheOfflineIdentity(data.user);
      localStorage.setItem("landstack_role", data.user.role);
    }

    return data;
  };

  /**
   * Clear the server session before removing the local identity.
   */
  const logout = async () => {
    try {
      await logoutApi();
    } catch (error) {
      if (error.response?.status !== 401) {
        setAccessDenied({ message: "Unable to confirm sign-out. Check connectivity and try again." });
        console.error("Sign-out request failed.", error);
        return;
      }
    }
    lockOfflineVault(user?.id);
    setUser(null);
    setActiveRole("citizen");
    setAccessDenied(null);
    localStorage.removeItem("landstack_token");
    localStorage.removeItem("landstack_user");
    localStorage.setItem("landstack_role", "citizen");
  };

  /**
   * Quick persona session switch is available only for non-production demos.
   */
  const switchRole = async (newRole) => {
    try {
      const data = await switchRoleApi(newRole);
      if (data.user) {
        if (String(data.user.id) !== String(user?.id)) lockOfflineVault(user?.id);
        setUser(data.user);
        setActiveRole(data.user.role);
      }
    } catch (error) {
      if (error.response?.status !== 403) throw error;
    }
  };

  const currentPersona = demoRolePersonas[activeRole] || demoRolePersonas.citizen;

  const permissions = {
    isAdmin: activeRole === "admin",
    isRevenueOfficer: activeRole === "revenue_officer" || activeRole === "admin",
    isSurveyor: activeRole === "surveyor" || activeRole === "admin",
    isSro: activeRole === "sro" || activeRole === "admin",
    isBank: activeRole === "bank" || activeRole === "admin",
    isCourt: activeRole === "court" || activeRole === "admin",
    isCitizen: activeRole === "citizen",
    canApproveMutation: activeRole === "revenue_officer" || activeRole === "admin",
    canApproveSubdivision: activeRole === "revenue_officer" || activeRole === "admin",
    canCreateSubdivision: activeRole === "surveyor" || activeRole === "admin",
    canRegisterDeed: activeRole === "sro" || activeRole === "admin",
    canIssueInjunction: activeRole === "court" || activeRole === "admin",
    canCreateLien: activeRole === "bank" || activeRole === "admin"
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        sessionLoading,
        activeRole,
        login,
        logout,
        switchRole,
        currentPersona,
        permissions,
        demoRolePersonas,
        accessDenied,
        clearAccessDenied: () => setAccessDenied(null)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
