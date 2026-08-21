import { formatDate, ownerLine } from "../utils/format";

const OwnershipTimeline = ({ events = [] }) => (
  <section className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-panel">
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-earth-900">Ownership Timeline</h2>
      <p className="mt-2 text-sm text-earth-700">
        Historical events recorded in MongoDB and prepared for tamper-evident anchoring on the audit layer.
      </p>
    </div>

    <div className="space-y-5">
      {events.map((event) => (
        <div key={`${event._id}-${event.eventDate}`} className="relative pl-6">
          <div className="absolute left-0 top-2 h-3 w-3 rounded-full bg-earth-500" />
          <div className="absolute left-[5px] top-5 h-full w-px bg-earth-200 last:hidden" />
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-earth-500">{event.eventType.replaceAll("_", " ")}</p>
          <h3 className="mt-1 text-lg font-semibold text-earth-900">{formatDate(event.eventDate)}</h3>
          <p className="mt-2 text-sm text-earth-700">{event.summary}</p>
          <p className="mt-2 text-sm text-earth-900">{ownerLine(event.owners)}</p>
          <p className="mt-2 text-xs text-earth-500">
            {event.sourceAuthority?.department || "Demo authority"} • {event.sourceAuthority?.referenceNumber || "No reference"}
          </p>
        </div>
      ))}
    </div>
  </section>
);

export default OwnershipTimeline;

