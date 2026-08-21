import { Contract, JsonRpcProvider, Wallet, ZeroHash, keccak256, toUtf8Bytes } from "ethers";
import { env } from "../config/env.js";

const landAuditAbi = [
  "function anchorParcelEvent(bytes32 parcelKey, bytes32 documentHash, string eventType, string recordType, string metadataURI) external returns (uint256)",
  "function getParcelEvents(bytes32 parcelKey) external view returns (tuple(uint256 eventId, bytes32 parcelKey, bytes32 documentHash, string eventType, string recordType, string metadataURI, uint256 anchoredAt, address anchoredBy)[])"
];

export const deriveParcelAnchorKey = (parcel) =>
  parcel.blockchain?.parcelKey ||
  [parcel.ulpin, parcel.district, parcel.taluk, parcel.hobli, parcel.village, parcel.surveyNumber, parcel.hissaNumber]
    .filter(Boolean)
    .join("|");

export const deriveParcelAnchorHash = (parcel) => keccak256(toUtf8Bytes(deriveParcelAnchorKey(parcel)));

const normalizeHexHash = (hash) => String(hash || "").trim().toLowerCase().replace(/^0x/, "");

const documentHashToBytes32 = (hash) => {
  const normalized = normalizeHexHash(hash);
  return normalized.length === 64 ? `0x${normalized}` : ZeroHash;
};

const getContract = () => {
  if (!env.blockchainEnabled) {
    return null;
  }

  const provider = new JsonRpcProvider(env.sepoliaRpcUrl);
  const wallet = new Wallet(env.blockchainPrivateKey, provider);
  return new Contract(env.landAuditContractAddress, landAuditAbi, wallet);
};

export const getBlockchainStatus = () => ({
  enabled: env.blockchainEnabled,
  network: "Sepolia",
  contractAddress: env.landAuditContractAddress || "",
  mode: env.blockchainEnabled ? "live" : "demo-ready",
  note: env.blockchainEnabled
    ? "Server is configured to anchor parcel and document hashes on Sepolia."
    : "Sepolia credentials are not configured. Verification still works using stored fingerprints and demo audit metadata."
});

export const anchorDocumentOnChain = async ({ parcel, document }) => {
  const contract = getContract();

  if (!contract) {
    return {
      anchored: false,
      mode: "demo-ready",
      txHash: "",
      message: "Sepolia contract environment is not configured."
    };
  }

  const tx = await contract.anchorParcelEvent(
    deriveParcelAnchorHash(parcel),
    documentHashToBytes32(document.sha256Hash),
    document.documentType,
    document.documentType,
    document.storageUri
  );
  const receipt = await tx.wait();

  return {
    anchored: true,
    mode: "live",
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber
  };
};

export const fetchParcelAnchors = async (parcel) => {
  const contract = getContract();

  if (!contract) {
    return [];
  }

  const events = await contract.getParcelEvents(deriveParcelAnchorHash(parcel));

  return events.map((eventRecord) => ({
    eventId: Number(eventRecord.eventId),
    parcelKey: eventRecord.parcelKey,
    documentHash: eventRecord.documentHash,
    eventType: eventRecord.eventType,
    recordType: eventRecord.recordType,
    metadataURI: eventRecord.metadataURI,
    anchoredAt: Number(eventRecord.anchoredAt) * 1000,
    anchoredBy: eventRecord.anchoredBy
  }));
};

