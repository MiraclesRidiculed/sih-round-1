import { useState } from "react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { useNavigate } from "react-router-dom";

const getRawScanValue = (payload) => {
  if (Array.isArray(payload)) {
    return payload[0]?.rawValue || payload[0]?.raw || payload[0]?.value || "";
  }

  return payload?.rawValue || payload?.raw || payload?.text || payload || "";
};

const resolveRoute = (rawValue) => {
  try {
    const parsedUrl = new URL(rawValue);
    if (parsedUrl.pathname.startsWith("/verify/")) {
      return `${parsedUrl.pathname}${parsedUrl.search}`;
    }
  } catch {
    // Continue to JSON parsing below.
  }

  try {
    const parsedJson = JSON.parse(rawValue);
    if (parsedJson.parcelId && parsedJson.token) {
      return `/verify/${parsedJson.parcelId}?token=${parsedJson.token}`;
    }
  } catch {
    // Ignore invalid JSON.
  }

  return "";
};

const QrScanPage = () => {
  const navigate = useNavigate();
  const [manualValue, setManualValue] = useState("");
  const [message, setMessage] = useState("");

  const handleResolvedValue = (rawValue) => {
    const route = resolveRoute(rawValue);
    if (!route) {
      setMessage("QR payload not recognized. Expected a parcel verification URL or JSON payload.");
      return;
    }
    navigate(route);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <section className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-panel">
        <h2 className="text-3xl font-extrabold text-earth-900">Scan Parcel QR</h2>
        <p className="mt-3 text-sm text-earth-700">
          Use a device camera to open the public verification report attached to a Karnataka parcel QR code.
        </p>

        <div className="mt-6 overflow-hidden rounded-[2rem] border border-earth-100">
          <Scanner
            onScan={(payload) => {
              const rawValue = getRawScanValue(payload);
              if (rawValue) {
                handleResolvedValue(rawValue);
              }
            }}
            onError={(error) => {
              setMessage(error?.message || "Camera access error");
            }}
          />
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-panel">
        <h3 className="text-2xl font-bold text-earth-900">Manual fallback</h3>
        <p className="mt-3 text-sm text-earth-700">
          If camera access is unavailable, paste the QR payload or verification URL here.
        </p>

        <textarea
          value={manualValue}
          onChange={(event) => setManualValue(event.target.value)}
          className="mt-5 h-48 w-full rounded-[1.5rem] border border-earth-200 bg-earth-50/80 p-4 text-sm text-earth-900 outline-none"
          placeholder="Paste a verification URL like http://localhost:5173/verify/KAR-BLRU-0001?token=..."
        />

        <button
          onClick={() => handleResolvedValue(manualValue)}
          className="mt-4 rounded-full bg-earth-900 px-5 py-2 text-sm font-semibold text-earth-50 transition hover:bg-earth-800"
        >
          Open verification report
        </button>

        {message && <p className="mt-4 text-sm text-rose-700">{message}</p>}
      </section>
    </div>
  );
};

export default QrScanPage;

