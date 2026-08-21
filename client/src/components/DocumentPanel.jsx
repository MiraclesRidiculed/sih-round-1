import { useState } from "react";
import { anchorDocumentFingerprint, verifyDocumentHash } from "../api/client";
import { formatDate, shortHash } from "../utils/format";
import { hashFileSha256 } from "../utils/hashFile";
import StatusPill from "./StatusPill";

const DocumentPanel = ({ parcelId, documents = [], onRefresh }) => {
  const [manualHash, setManualHash] = useState("");
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [anchorMessage, setAnchorMessage] = useState("");

  const submitHash = async (sha256Hash) => {
    setLoading(true);
    setAnchorMessage("");

    try {
      const result = await verifyDocumentHash({ parcelId, sha256Hash });
      setVerificationResult(result);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const hash = await hashFileSha256(file);
    setManualHash(hash);
    await submitHash(hash);
  };

  const handleManualSubmit = async (event) => {
    event.preventDefault();
    if (!manualHash.trim()) {
      return;
    }
    await submitHash(manualHash.trim());
  };

  const handleAnchor = async (documentId) => {
    setAnchorMessage("");
    setLoading(true);

    try {
      const response = await anchorDocumentFingerprint(parcelId, documentId);
      setAnchorMessage(response.message || (response.anchored ? "Document anchored on chain." : "Blockchain not configured."));
      await onRefresh?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-panel">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-earth-900">Supporting Documents</h2>
        <p className="mt-2 text-sm text-earth-700">
          Large files stay off-chain. The system stores metadata, storage references, and SHA-256 fingerprints for verification.
        </p>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <label className="rounded-[1.5rem] border border-dashed border-earth-300 bg-earth-50/80 p-4 text-sm text-earth-700">
          <span className="mb-2 block font-semibold text-earth-900">Upload a document to verify its fingerprint</span>
          <input type="file" className="mt-3 block w-full text-sm" onChange={handleFileChange} />
        </label>

        <form onSubmit={handleManualSubmit} className="rounded-[1.5rem] border border-earth-100 bg-earth-50/80 p-4">
          <p className="mb-2 font-semibold text-earth-900">Or paste a SHA-256 fingerprint</p>
          <input
            value={manualHash}
            onChange={(event) => setManualHash(event.target.value)}
            className="w-full rounded-2xl border border-earth-200 bg-white px-4 py-3 text-sm text-earth-900 outline-none"
            placeholder="Paste 64-character SHA-256 hash"
          />
          <button
            type="submit"
            disabled={loading}
            className="mt-3 rounded-full bg-earth-900 px-5 py-2 text-sm font-semibold text-earth-50 transition hover:bg-earth-800 disabled:opacity-60"
          >
            Verify hash
          </button>
        </form>
      </div>

      {verificationResult && (
        <div className="mb-6 rounded-[1.5rem] border border-lake-100 bg-lake-50/80 p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="font-semibold text-lake-900">Fingerprint result</p>
            <StatusPill status={verificationResult.status}>{verificationResult.status}</StatusPill>
          </div>
          <p className="text-sm text-lake-900">{verificationResult.message}</p>
          {verificationResult.matches?.length > 0 && (
            <div className="mt-3 space-y-2 text-sm text-lake-900">
              {verificationResult.matches.map((match) => (
                <div key={`${match.parcelId}-${match.documentType}`} className="rounded-2xl bg-white/80 p-3">
                  {match.documentType} • {match.title} • {match.recordReference}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {anchorMessage && <p className="mb-4 text-sm text-earth-700">{anchorMessage}</p>}

      <div className="grid gap-4">
        {documents.map((document) => (
          <div key={document._id} className="rounded-[1.5rem] border border-earth-100 bg-white p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <StatusPill status={document.hashAnchored ? "verified" : "attention"}>
                    {document.hashAnchored ? "Anchored" : "Pending"}
                  </StatusPill>
                  <StatusPill status="demo">{document.documentType}</StatusPill>
                </div>
                <h3 className="text-lg font-semibold text-earth-900">{document.title}</h3>
                <p className="mt-2 text-sm text-earth-700">
                  {document.metadata?.issuingAuthority || "Demo authority"} • {formatDate(document.metadata?.issueDate)}
                </p>
                <p className="mt-2 text-sm text-earth-700">Reference: {document.metadata?.recordReference || "Not available"}</p>
                <p className="mt-2 font-mono text-xs text-earth-600">{shortHash(document.sha256Hash)}</p>
                <p className="mt-2 text-xs text-earth-500">{document.storageUri}</p>
              </div>

              {!document.hashAnchored && (
                <button
                  onClick={() => handleAnchor(document._id)}
                  disabled={loading}
                  className="rounded-full border border-earth-300 px-4 py-2 text-sm font-semibold text-earth-800 transition hover:border-earth-500 hover:bg-earth-50 disabled:opacity-60"
                >
                  Anchor to Sepolia
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default DocumentPanel;

