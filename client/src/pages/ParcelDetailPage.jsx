import { useEffect, useState } from "react";
import { Database, FileBadge2, MapPinned, ShieldCheck } from "lucide-react";
import { useParams } from "react-router-dom";
import { fetchParcel } from "../api/client";
import DocumentPanel from "../components/DocumentPanel";
import OwnershipTimeline from "../components/OwnershipTimeline";
import ParcelMap from "../components/ParcelMap";
import QrPanel from "../components/QrPanel";
import StatusPill from "../components/StatusPill";
import VerificationPanel from "../components/VerificationPanel";
import { formatArea, ownerLine } from "../utils/format";

const ParcelDetailPage = () => {
  const { parcelId } = useParams();
  const [parcel, setParcel] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadParcel = async () => {
    setLoading(true);
    try {
      const data = await fetchParcel(parcelId);
      setParcel(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParcel();
  }, [parcelId]);

  if (loading && !parcel) {
    return <div className="rounded-[2rem] border border-white/60 bg-white/80 p-10 text-earth-800">Loading parcel record...</div>;
  }

  if (!parcel) {
    return <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-10 text-rose-900">Parcel not found.</div>;
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2.5rem] border border-white/70 bg-white/85 p-7 shadow-panel">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <StatusPill status="demo">{parcel.district}</StatusPill>
              <StatusPill status={parcel.verification.overallStatus}>{parcel.verification.overallStatus}</StatusPill>
            </div>
            <h2 className="text-4xl font-extrabold text-earth-900">{parcel.parcelId}</h2>
            <p className="mt-3 max-w-4xl text-sm text-earth-700 sm:text-base">
              Survey {parcel.surveyNumber}
              {parcel.hissaNumber ? ` / Hissa ${parcel.hissaNumber}` : ""} • {parcel.village}, {parcel.hobli},{" "}
              {parcel.taluk}, {parcel.district}
            </p>
            <p className="mt-3 text-sm text-earth-700">{parcel.demoNotes}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:w-[430px]">
            <div className="rounded-[1.5rem] border border-earth-100 bg-earth-50/80 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-earth-500">ULPIN</p>
              <p className="mt-2 font-semibold text-earth-900">{parcel.ulpin || "Not available"}</p>
            </div>
            <div className="rounded-[1.5rem] border border-earth-100 bg-earth-50/80 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-earth-500">Area</p>
              <p className="mt-2 font-semibold text-earth-900">{formatArea(parcel.areaInAcres)}</p>
            </div>
            <div className="rounded-[1.5rem] border border-earth-100 bg-earth-50/80 p-4 sm:col-span-2">
              <p className="text-xs uppercase tracking-[0.2em] text-earth-500">Current owners</p>
              <p className="mt-2 font-semibold text-earth-900">{ownerLine(parcel.currentOwners)}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-panel">
          <div className="mb-5 flex items-center gap-3">
            <MapPinned className="text-earth-700" size={20} />
            <div>
              <h3 className="text-2xl font-bold text-earth-900">2D parcel geometry</h3>
              <p className="text-sm text-earth-700">GeoJSON polygon for the Karnataka land parcel footprint.</p>
            </div>
          </div>
          <ParcelMap geoJson={parcel.geoJson} />
        </section>

        <section className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-panel">
          <div className="mb-5 flex items-center gap-3">
            <Database className="text-earth-700" size={20} />
            <div>
              <h3 className="text-2xl font-bold text-earth-900">Parcel identity</h3>
              <p className="text-sm text-earth-700">Karnataka-specific identifiers and record references.</p>
            </div>
          </div>

          <div className="grid gap-4 text-sm text-earth-700">
            <div className="rounded-[1.5rem] border border-earth-100 bg-earth-50/80 p-4">
              <p className="text-earth-500">Survey / Hissa</p>
              <p className="mt-2 font-semibold text-earth-900">
                {parcel.surveyNumber} / {parcel.hissaNumber || "None"}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-earth-100 bg-earth-50/80 p-4">
              <p className="text-earth-500">Khata / Property ID</p>
              <p className="mt-2 font-semibold text-earth-900">
                {parcel.khataNumber || "Not available"} / {parcel.propertyId || "Not available"}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-earth-100 bg-earth-50/80 p-4">
              <p className="text-earth-500">Land classification / use</p>
              <p className="mt-2 font-semibold text-earth-900">
                {parcel.landClassification} / {parcel.landUse}
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-earth-100 bg-earth-50/80 p-4">
              <p className="text-earth-500">RTC / Mutation / EC</p>
              <p className="mt-2 font-semibold text-earth-900">{parcel.authoritativeRecords.rtcNumber}</p>
              <p className="mt-1 text-earth-700">{parcel.authoritativeRecords.mutationNumber}</p>
              <p className="mt-1 text-earth-700">{parcel.authoritativeRecords.encumbranceCertificateNo}</p>
            </div>
          </div>
        </section>
      </div>

      <VerificationPanel verification={parcel.verification} />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <OwnershipTimeline events={parcel.ownershipHistory} />
        <QrPanel qr={parcel.qr} />
      </div>

      <DocumentPanel parcelId={parcel.parcelId} documents={parcel.documents} onRefresh={loadParcel} />

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-panel">
          <div className="mb-3 flex items-center gap-3">
            <ShieldCheck size={18} className="text-earth-700" />
            <h3 className="text-lg font-bold text-earth-900">Authoritative records</h3>
          </div>
          <p className="text-sm text-earth-700">
            Revenue, registration, survey, and related Karnataka authorities remain the legal record source. This MVP
            uses clear adapters where live APIs are unavailable.
          </p>
        </div>

        <div className="rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-panel">
          <div className="mb-3 flex items-center gap-3">
            <FileBadge2 size={18} className="text-earth-700" />
            <h3 className="text-lg font-bold text-earth-900">Document authenticity</h3>
          </div>
          <p className="text-sm text-earth-700">
            Uploaded files are hashed in the browser, then checked against stored SHA-256 fingerprints and blockchain
            readiness metadata.
          </p>
        </div>

        <div className="rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-panel">
          <div className="mb-3 flex items-center gap-3">
            <Database size={18} className="text-earth-700" />
            <h3 className="text-lg font-bold text-earth-900">Audit layer</h3>
          </div>
          <p className="text-sm text-earth-700">
            Ethereum Sepolia records parcel-event and document-hash fingerprints only. Large files remain off-chain via
            IPFS/object storage references.
          </p>
        </div>
      </section>
    </div>
  );
};

export default ParcelDetailPage;

