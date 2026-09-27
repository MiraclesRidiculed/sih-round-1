const API_NAME = "land-stack-interoperability";
const API_VERSION = "1.0";

export const INTEROPERABILITY_MODULES = Object.freeze({
  cadastral: "cadastral",
  rights: "ror",
  registration: "registration",
  planning: "planning",
  encumbrances: "encumbrance",
  restrictions: "restrictions",
  "building-permission": "buildingPermission",
  "land-use": "landUse",
  "property-tax": "propertyTax",
  utilities: "utilities",
  transactions: "transactions",
  "change-detection": "changeDetection"
});

const ROLE_MODULE_ACCESS = Object.freeze({
  admin: Object.keys(INTEROPERABILITY_MODULES),
  revenue_officer: ["cadastral", "rights", "land-use", "restrictions", "change-detection"],
  surveyor: ["cadastral", "restrictions", "change-detection"],
  sro: ["cadastral", "registration", "encumbrances", "restrictions", "transactions", "change-detection"],
  court: ["cadastral", "restrictions", "change-detection"],
  bank: ["cadastral", "rights", "encumbrances", "restrictions", "change-detection"],
  citizen: ["cadastral", "rights", "registration", "planning", "building-permission", "encumbrances", "land-use", "restrictions", "transactions", "change-detection"]
});

export const canAccessInteroperabilityModule = (role, module) =>
  ROLE_MODULE_ACCESS[role]?.includes(module) === true;

const responseMetadata = ({ ulpin, role, module, source, now }) => ({
  api: API_NAME,
  version: API_VERSION,
  generatedAt: now.toISOString(),
  correlation: { key: "ulpin", value: ulpin },
  source: source || {
    mode: "local-demo",
    authoritative: false,
    realTime: false,
    disclaimer: "Assembled from local Land Stack records and demonstration seed data; no external government systems are queried."
  },
  access: {
    role,
    policy: "application-demo-rbac"
  },
  ...(module ? { module } : {})
});

export const createInteroperabilityResponse = ({
  data,
  ulpin,
  role,
  module,
  source,
  now = new Date()
}) => ({
  success: true,
  data,
  meta: responseMetadata({ ulpin, role, module, source, now })
});

export const createInteroperabilityError = ({
  code,
  message,
  ulpin,
  now = new Date()
}) => ({
  success: false,
  error: { code, message },
  meta: {
    api: API_NAME,
    version: API_VERSION,
    generatedAt: now.toISOString(),
    ...(ulpin ? { correlation: { key: "ulpin", value: ulpin } } : {})
  }
});
