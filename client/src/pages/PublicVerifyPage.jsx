import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { scanParcelQr } from "../api/client";
import StatusPill from "../components/StatusPill";
import VerificationPanel from "../components/VerificationPanel";

const PublicVerifyPage = () => {
  const { parcelId } = useParams();
  const [searchParams] = useSearchParams();
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const token = searchParams.get("token");
        if (!token) {
          setError("QR token missing from verification link.");
          return;
        }

        const data = await scanParcelQr(parcelId, token);
        setResult(data);
      } catch (scanError) {
        setError(scanError.response?.data?.message || "Unable to verify parcel QR.");
      }
    };

    load();
  }, [parcelId, searchParams]);

  if (error) {
    return <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-8 text-rose-900">{error}</div>;
  }

  if (!result) {
    return <div className="rounded-[2rem] border border-white/60 bg-white/80 p-10 text-earth-800">Verifying parcel QR...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-panel">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-earth-500">Public verification</p>
            <h2 className="mt-2 text-3xl font-extrabold text-earth-900">{result.parcelId}</h2>
            <p className="mt-2 text-sm text-earth-700">
              This report is generated from the parcel QR token and shows the current seeded verification state.
            </p>
          </div>
          <StatusPill status={result.verification.overallStatus}>{result.verification.overallStatus}</StatusPill>
        </div>
      </section>

      <VerificationPanel verification={result.verification} />

      <Link
        to={`/parcels/${result.parcelId}`}
        className="inline-flex rounded-full bg-earth-900 px-5 py-2 text-sm font-semibold text-earth-50 transition hover:bg-earth-800"
      >
        Open full parcel record
      </Link>
    </div>
  );
};

export default PublicVerifyPage;

