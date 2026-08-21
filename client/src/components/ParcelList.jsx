import { ArrowRight, MapPinned } from "lucide-react";
import { Link } from "react-router-dom";
import { formatArea, ownerLine } from "../utils/format";
import StatusPill from "./StatusPill";

const ParcelList = ({ parcels = [], title }) => (
  <section className="space-y-5">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold text-earth-900">{title}</h2>
      <p className="text-sm text-earth-600">{parcels.length} parcel record(s)</p>
    </div>

    <div className="grid gap-4 lg:grid-cols-2">
      {parcels.map((parcel) => (
        <Link
          key={parcel.parcelId}
          to={`/parcels/${parcel.parcelId}`}
          className="group rounded-[2rem] border border-white/70 bg-white/85 p-5 shadow-panel transition hover:-translate-y-1 hover:border-earth-300"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-earth-600">
                <MapPinned size={14} />
                {parcel.district}
              </div>
              <h3 className="text-xl font-bold text-earth-900">{parcel.parcelId}</h3>
              <p className="mt-2 text-sm text-earth-700">
                Survey {parcel.surveyNumber}
                {parcel.hissaNumber ? ` / Hissa ${parcel.hissaNumber}` : ""} • {parcel.village}, {parcel.hobli},
                {` ${parcel.taluk}`}
              </p>
            </div>

            <StatusPill status={parcel.verificationHint?.status}>{parcel.verificationHint?.status || "attention"}</StatusPill>
          </div>

          <div className="mt-5 grid gap-3 text-sm text-earth-700 sm:grid-cols-2">
            <div>
              <p className="text-earth-500">ULPIN</p>
              <p className="font-medium text-earth-900">{parcel.ulpin || "Not available"}</p>
            </div>
            <div>
              <p className="text-earth-500">Area</p>
              <p className="font-medium text-earth-900">{formatArea(parcel.areaInAcres)}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-earth-500">Current owners</p>
              <p className="font-medium text-earth-900">{ownerLine(parcel.currentOwners)}</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="max-w-xl text-sm text-earth-700">{parcel.verificationHint?.summary}</p>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-earth-800 transition group-hover:translate-x-1">
              Open
              <ArrowRight size={16} />
            </span>
          </div>
        </Link>
      ))}
    </div>
  </section>
);

export default ParcelList;

