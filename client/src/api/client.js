import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api"
});

export const fetchDashboard = async () => {
  const { data } = await api.get("/dashboard");
  return data;
};

export const searchParcels = async (search = "") => {
  const { data } = await api.get("/parcels", {
    params: search ? { search } : {}
  });
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

