export const demoUsersList = [
  {
    id: "usr-admin-01",
    name: "Dr. Rameshwar Sharma, IAS",
    role: "admin",
    designation: "Joint Secretary / National DPI Administrator",
    department: "Department of Land Resources (DoLR), MoRD",
    email: "admin@landstack.gov.in"
  },
  {
    id: "usr-rev-01",
    name: "K. Annadurai, DRO",
    role: "revenue_officer",
    designation: "District Revenue Officer & Tehsildar",
    department: "Revenue & Disaster Management, Tamil Nadu / Karnataka",
    email: "tehsildar@tamilnilam.tn.gov.in"
  },
  {
    id: "usr-surv-01",
    name: "P. Vignesh, LIS",
    role: "surveyor",
    designation: "Head Licensed Land Surveyor (CORS GNSS)",
    department: "Survey Settlement & Land Records (SSLR)",
    email: "surveyor@surveyofindia.gov.in"
  },
  {
    id: "usr-sro-01",
    name: "Meenakshi Sundaram",
    role: "sro",
    designation: "Sub-Registrar (SRO Grade-I)",
    department: "Registration & Stamps Department",
    email: "sro.sriperumbudur@tnreginet.gov.in"
  },
  {
    id: "usr-bank-01",
    name: "Vikram Malhotra",
    role: "bank",
    designation: "Chief Credit Risk Officer (Lien & Mortgage Cell)",
    department: "Indian Overseas Bank / SBI Consortium",
    email: "mortgages@iob.bank.in"
  },
  {
    id: "usr-court-01",
    name: "Hon. Justice B. Patil",
    role: "court",
    designation: "Presiding Officer & Assistant Commissioner",
    department: "Revenue Court Case Management System (RCCMS)",
    email: "rccms.bench@judiciary.gov.in"
  },
  {
    id: "usr-cit-01",
    name: "Ananya Narayanan",
    role: "citizen",
    designation: "Citizen Landowner & Investor",
    department: "Public User",
    email: "ananya.citizen@gmail.com"
  }
];

export const parseUserContext = (req, res, next) => {
  const roleHeader = req.headers["x-user-role"] || req.query.role || "citizen";
  const user = demoUsersList.find((u) => u.role === roleHeader) || demoUsersList[demoUsersList.length - 1];
  req.user = user;
  next();
};

export const requireRole = (allowedRoles = []) => (req, res, next) => {
  const userRole = req.user?.role || "citizen";

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
