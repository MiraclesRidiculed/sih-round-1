import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api"
});

// Attach current role header to all outgoing requests
api.interceptors.request.use((config) => {
  const currentRole = localStorage.getItem("landstack_role") || "citizen";
  config.headers["x-user-role"] = currentRole;
  return config;
});

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

export const fetchParcelVerification = async (parcelId) => {
  const { data } = await api.get(`/parcels/${parcelId}/verification`);
  return data;
};

export const submitParcelWorkflow = async (parcelId, payload) => {
  const { data } = await api.post(`/parcels/${parcelId}/workflow`, payload);
  return data;
};

export const simulateFastTrackSroDeed = async (parcelId, payload = {}) => {
  const { data } = await api.post(`/parcels/${parcelId}/sro-fast-track`, payload);
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
