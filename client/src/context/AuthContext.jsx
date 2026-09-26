import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const AuthContext = createContext();

export const demoRolePersonas = {
  admin: {
    role: "admin",
    name: "Dr. Rameshwar Sharma, IAS",
    designation: "Joint Secretary / National DPI Administrator",
    department: "Department of Land Resources (DoLR), MoRD",
    avatar: "🏛️",
    badgeColor: "bg-purple-100 text-purple-900 border-purple-200"
  },
  revenue_officer: {
    role: "revenue_officer",
    name: "K. Annadurai, DRO",
    designation: "District Revenue Officer & Tehsildar",
    department: "Revenue & Disaster Management (Bhoomi / Tamil Nilam)",
    avatar: "📜",
    badgeColor: "bg-amber-100 text-amber-900 border-amber-200"
  },
  surveyor: {
    role: "surveyor",
    name: "P. Vignesh, LIS",
    designation: "Head Licensed Land Surveyor (CORS GNSS)",
    department: "Survey Settlement & Land Records (SSLR)",
    avatar: "📐",
    badgeColor: "bg-blue-100 text-blue-900 border-blue-200"
  },
  sro: {
    role: "sro",
    name: "Meenakshi Sundaram",
    designation: "Sub-Registrar (SRO Grade-I)",
    department: "Registration & Stamps Department (TNREGINET / Kaveri)",
    avatar: "🖋️",
    badgeColor: "bg-rose-100 text-rose-900 border-rose-200"
  },
  bank: {
    role: "bank",
    name: "Vikram Malhotra",
    designation: "Chief Credit Risk Officer (Mortgage Cell)",
    department: "Indian Overseas Bank / Core Banking (Finacle)",
    avatar: "🏦",
    badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-200"
  },
  court: {
    role: "court",
    name: "Hon. Justice B. Patil",
    designation: "Presiding Officer & Assistant Commissioner",
    department: "Revenue Court Case Management System (RCCMS)",
    avatar: "⚖️",
    badgeColor: "bg-red-100 text-red-900 border-red-200"
  },
  citizen: {
    role: "citizen",
    name: "Ananya Narayanan",
    designation: "Citizen Landowner & Investor",
    department: "Public User",
    avatar: "👤",
    badgeColor: "bg-gray-100 text-gray-800 border-gray-200"
  }
};

export const AuthProvider = ({ children }) => {
  const [activeRole, setActiveRole] = useState(() => localStorage.getItem("landstack_role") || "citizen");

  const switchRole = (newRole) => {
    if (demoRolePersonas[newRole]) {
      setActiveRole(newRole);
      localStorage.setItem("landstack_role", newRole);
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
    <AuthContext.Provider value={{ activeRole, switchRole, currentPersona, permissions, demoRolePersonas }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
