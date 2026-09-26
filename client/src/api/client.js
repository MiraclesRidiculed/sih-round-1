import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  withCredentials: true
});

const AUTH_SESSION_INVALID_EVENT = "landstack:session-invalid";
const ACCESS_DENIED_EVENT = "landstack:access-denied";

const clearStoredSession = () => {
  localStorage.removeItem("landstack_token");
  localStorage.removeItem("landstack_user");
  localStorage.setItem("landstack_role", "citizen");
};

const notify = (eventName, detail) => {
  window.dispatchEvent(new CustomEvent(eventName, { detail }));
};

// Send the double-submit CSRF token with cookie-authenticated writes.
api.interceptors.request.use((config) => {
  if (!["get", "head", "options"].includes((config.method || "get").toLowerCase())) {
    const prefix = "landstack_csrf=";
    const csrfCookie = document.cookie.split(";").map((part) => part.trim()).find((part) => part.startsWith(prefix));
    if (csrfCookie) {
      config.headers ??= {};
      config.headers["X-CSRF-Token"] = csrfCookie.slice(prefix.length);
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    // Login failures are credential errors, not expired sessions.
    if (status === 401 && !error.config?.skipSessionInvalidation) {
      clearStoredSession();
      notify(AUTH_SESSION_INVALID_EVENT, {
        message: error.response?.data?.message || "Your session has expired. Please sign in again."
      });
    }

    // Keep authorization failures distinct from authentication failures.
    if (status === 403) {
      notify(ACCESS_DENIED_EVENT, {
        message: error.response?.data?.message || "You are not authorized to perform this operation.",
        allowedRoles: error.response?.data?.allowedRoles || []
      });
    }

    return Promise.reject(error);
  }
);

export const loginApi = async (credentials) => {
  const { data } = await api.post("/auth/login", credentials, {
    skipSessionInvalidation: true
  });
  return data;
};

export const fetchCurrentUser = async () => {
  const { data } = await api.get("/auth/me");
  return data;
};

export const logoutApi = async () => {
  await api.post("/auth/logout");
};

export const searchNationalLandRecords = async (params = {}) => {
  const { data } = await api.get("/exchange/land-records", { params });
  return data;
};

export const fetchDashboard = async () => {
  const { data } = await api.get("/dashboard");
  return data;
};

export const searchParcels = async (params = {}) => {
  const query = typeof params === "string" ? { search: params } : params;
  const { data } = await api.get("/parcels", { params: query });
  return data;
};

export const fetchParcel = async (parcelId) => {
  const { data } = await api.get(`/parcels/${parcelId}`);
  return data;
};

export const createParcelTransactionApi = async (parcelId, payload) => {
  const { data } = await api.post(`/parcels/${parcelId}/transactions`, payload);
  return data;
};

export const updateParcelTransactionApi = async (parcelId, transactionId, payload) => {
  const { data } = await api.patch(`/parcels/${parcelId}/transactions/${transactionId}`, payload);
  return data;
};

export const fetchParcelVerification = async (parcelId) => {
  const { data } = await api.get(`/parcels/${parcelId}/verification`);
  return data;
};

export const submitParcelWorkflow = async (parcelId, payload) => {
  const { data } = await api.post(`/parcels/${parcelId}/workflow`, payload);
  return data;
};

export const submitFieldSurveyApi = async (parcelId, payload) => {
  const { data } = await api.post(`/parcels/${parcelId}/field-surveys`, payload);
  return data;
};

export const submitSubdivision = async (parcelId, payload = {}) => {
  const { data } = await api.post(`/parcels/${parcelId}/subdivide`, payload);
  return data;
};

export const approveSubdivisionApi = async (parcelId, payload = {}) => {
  const { data } = await api.post(`/parcels/${parcelId}/subdivision/approve`, payload);
  return data;
};

export const issueCourtInjunctionApi = async (parcelId, payload = {}) => {
  const { data } = await api.post(`/court/${parcelId}/injunction`, payload);
  return data;
};

export const liftCourtInjunctionApi = async (parcelId, payload = {}) => {
  const { data } = await api.post(`/court/${parcelId}/lift-injunction`, payload);
  return data;
};

export const fetchDisputeDetails = async (parcelId) => {
  const { data } = await api.get(`/court/${parcelId}/disputes`);
  return data;
};

export const createBankLienApi = async (parcelId, payload = {}) => {
  const { data } = await api.post(`/parcels/${parcelId}/bank-lien`, payload);
  return data;
};

export const releaseBankLienApi = async (parcelId, payload = {}) => {
  const { data } = await api.post(`/parcels/${parcelId}/release-lien`, payload);
  return data;
};

export const recommendAiInspectionApi = async (parcelId, payload = {}) => {
  const { data } = await api.post(`/parcels/${parcelId}/ai-inspection-recommend`, payload);
  return data;
};

export const simulateDpiEventApi = async (eventType, payload = {}) => {
  const { data } = await api.post("/stream/simulate", { eventType, payload });
  return data;
};

export const scanParcelQr = async (parcelId, token) => {
  const { data } = await api.post(`/verification/scan/${parcelId}`, { token });
  return data;
};

export const verifyDocumentHash = async (payload) => {
  const { data } = await api.post("/verification/document-hash", payload);
  return data;
};

export const anchorDocumentFingerprint = async (parcelId, documentId) => {
  const { data } = await api.post("/verification/blockchain/anchor-document", {
    parcelId,
    documentId
  });
  return data;
};

export const fetchBlockchainStatus = async () => {
  const { data } = await api.get("/verification/blockchain/status");
  return data;
};

export const fetchRolesAndUsers = async () => {
  const { data } = await api.get("/auth/roles");
  return data;
};

export const switchRoleApi = async (role) => {
  const { data } = await api.post("/auth/switch-role", { role });
  return data;
};
