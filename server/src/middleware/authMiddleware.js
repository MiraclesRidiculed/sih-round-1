import { verifyToken } from "../utils/jwt.js";
import { clearAuthCookies, SESSION_COOKIE_NAME, parseCookies } from "../utils/authCookies.js";
import { Session } from "../models/Session.js";

export const ROLE_PERMISSIONS = Object.freeze({
  admin: ["all protected operations"],
  revenue_officer: ["workflow", "subdivision approval", "AI inspection", "event simulation"],
  surveyor: ["workflow", "subdivision creation", "event simulation"],
  sro: ["workflow", "SRO fast-track deed", "event simulation"],
  court: ["workflow", "court injunctions"],
  bank: ["workflow", "bank liens"],
  citizen: ["workflow"]
});

export const demoUsersList = [
  {
    id: "usr-admin-01",
    name: "Dr. Rameshwar Sharma, IAS",
    role: "admin",
    designation: "DoLR National Platform Administrator",
    department: "Department of Land Resources (DoLR), MoRD",
    jurisdiction: "National / All States",
    email: "admin@landstack.gov.in"
  },
  {
    id: "usr-rev-01",
    name: "K. Annadurai, DRO",
    role: "revenue_officer",
    designation: "Tehsildar / Village Administrative Officer",
    department: "Revenue & Disaster Management Department",
    jurisdiction: "Sriperumbudur / Kanchipuram",
    email: "tehsildar@tamilnilam.tn.gov.in"
  },
  {
    id: "usr-surv-01",
    name: "P. Vignesh, LIS",
    role: "surveyor",
    designation: "Directorate of Survey & Land Records",
    department: "Survey Settlement & Land Records (SSLR)",
    jurisdiction: "Cadastral Survey Unit",
    email: "surveyor@surveyofindia.gov.in"
  },
  {
    id: "usr-sro-01",
    name: "Meenakshi Sundaram",
    role: "sro",
    designation: "Sub-Registrar / Registration & Stamps Department",
    department: "Registration & Stamps Department",
    jurisdiction: "SRO Sriperumbudur",
    email: "sro.sriperumbudur@tnreginet.gov.in"
  },
  {
    id: "usr-court-01",
    name: "Hon. Justice B. Patil",
    role: "court",
    designation: "Revenue Court / RCCMS Judicial Officer",
    department: "Revenue Court Case Management System (RCCMS)",
    jurisdiction: "Assistant Commissioner Revenue Bench",
    email: "rccms.bench@judiciary.gov.in"
  },
  {
    id: "usr-bank-01",
    name: "Vikram Malhotra",
    role: "bank",
    designation: "Financial Institution / Core Banking",
    department: "Indian Overseas Bank / Core Banking (Finacle)",
    jurisdiction: "Mortgage & Hypothecation Cell",
    email: "mortgages@iob.bank.in"
  },
  {
    id: "usr-cit-01",
    name: "Ananya Narayanan",
    role: "citizen",
    designation: "Public Landholder / Applicant",
    department: "Public User",
    jurisdiction: "Citizen Services Portal",
    email: "ananya.citizen@gmail.com"
  }
];

/**
 * Optional user context parser for signed Bearer headers or session cookies.
 */
const getBearerToken = (authorization) => {
  if (typeof authorization !== "string") return null;
  return /^Bearer\s+([^\s]+)$/i.exec(authorization)?.[1] || null;
};

const getRequestToken = (req) =>
  getBearerToken(req.headers.authorization) || parseCookies(req.headers.cookie)[SESSION_COOKIE_NAME] || null;

export const parseUserContext = (req, res, next) => {
  const token = getRequestToken(req);
  if (token) {
    try {
      req.user = verifyToken(token);
    } catch {
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
};

/**
 * Strict authentication middleware requiring a signed, active session.
 * Returns HTTP 401 if missing, invalid, expired, or revoked.
 */
export const authenticateToken = async (req, res, next) => {
  const token = getRequestToken(req);
  if (!token) {
    return res.status(401).json({
      error: "UNAUTHORIZED",
      message: "Authentication required. Bearer authorization token is missing."
    });
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    clearAuthCookies(res);
    return res.status(401).json({
      error: "TOKEN_INVALID",
      message: "Invalid or expired authorization token.",
    });
  }
  if (typeof decoded.jti !== "string") {
    clearAuthCookies(res);
    return res.status(401).json({ error: "TOKEN_INVALID", message: "Invalid or expired authorization token." });
  }

  let activeSession;
  try {
    activeSession = await Session.exists({ jti: decoded.jti, expiresAt: { $gt: new Date() } });
  } catch (error) {
    return next(error);
  }
  if (!activeSession) {
    clearAuthCookies(res);
    return res.status(401).json({ error: "SESSION_REVOKED", message: "Invalid or expired authorization token." });
  }
  req.user = decoded;
  next();
};

/**
 * Role-Based Access Control (RBAC) middleware.
 * Verifies that the authenticated user possesses one of the allowedRoles.
 * Returns HTTP 401 if unauthenticated, HTTP 403 if authenticated but insufficient privileges.
 */
export const requireRole = (allowedRoles = []) => (req, res, next) => {
  if (!req.user || !req.user.role || !req.user.jti) {
    return res.status(401).json({
      error: "UNAUTHORIZED",
      message: "Authentication required."
    });
  }

  const userRole = req.user.role;

  if (!allowedRoles.includes(userRole)) {
    const roleLabels = {
      admin: "National Administrator",
      revenue_officer: "Revenue Officer (Tehsildar)",
      surveyor: "Revenue Surveyor",
      sro: "Sub-Registrar (SRO)",
      bank: "Bank / Financial Institution",
      court: "Revenue Court / RCCMS Officer",
      citizen: "Citizen"
    };

    const requiredNames = allowedRoles.map((r) => roleLabels[r] || r).join(" or ");
    return res.status(403).json({
      error: "ACCESS_RESTRICTED",
      message: `🔒 Access Restricted: ${requiredNames} permissions are required to perform this operation.`,
      currentRole: userRole,
      allowedRoles
    });
  }

  next();
};
