import { formatDate } from "../utils/format";
import StatusPill from "./StatusPill";

const AuthorityCard = ({ title, snapshot }) => (
  <div className="rounded-[1.5rem] border border-earth-100 bg-earth-50/80 p-4">
    <div className="mb-3 flex items-center justify-between gap-3">
      <h3 className="font-semibold text-earth-900">{title}</h3>
      <StatusPill status="demo">{snapshot.integrationMode}</StatusPill>
    </div>
    <p className="text-sm text-earth-700">{snapshot.disclaimer}</p>
    <dl className="mt-4 grid gap-3 text-sm text-earth-700 sm:grid-cols-2">
      {Object.entries(snapshot)
        .filter(([key]) => !["authorityLabel", "integrationMode", "authoritative", "disclaimer"].includes(key))
        .map(([key, value]) => (
          <div key={key}>
            <dt className="text-earth-500">{key}</dt>
            <dd className="font-medium text-earth-900">{Array.isArray(value) ? value.join(", ") : String(value || "Not available")}</dd>
          </div>
        ))}
    </dl>
  </div>
);

const VerificationPanel = ({ verification }) => (
  <section className="space-y-6 rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-panel">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-earth-500">Verification report</p>
        <h2 className="mt-2 text-3xl font-extrabold text-earth-900">Internal consistency check</h2>
        <p className="mt-3 max-w-3xl text-sm text-earth-700">{verification.summary}</p>
        <p className="mt-2 text-xs text-earth-500">Generated on {formatDate(verification.generatedAt)}</p>
      </div>
      <StatusPill status={verification.overallStatus}>{verification.overallStatus}</StatusPill>
    </div>

    <div className="rounded-[1.5rem] border border-lake-100 bg-lake-50/80 p-4 text-sm text-lake-900">
      {verification.legalNotice}
    </div>

    <div className="grid gap-4 lg:grid-cols-3">
      <div className="rounded-[1.5rem] border border-earth-100 bg-earth-50/80 p-4">
        <p className="text-sm uppercase tracking-[0.2em] text-earth-500">Documents</p>
        <p className="mt-3 text-3xl font-bold text-earth-900">{verification.documentSummary.anchoredDocuments}</p>
        <p className="mt-2 text-sm text-earth-700">Anchored / matched fingerprints</p>
      </div>
      <div className="rounded-[1.5rem] border border-earth-100 bg-earth-50/80 p-4">
        <p className="text-sm uppercase tracking-[0.2em] text-earth-500">Pending</p>
        <p className="mt-3 text-3xl font-bold text-earth-900">{verification.documentSummary.unanchoredDocuments}</p>
        <p className="mt-2 text-sm text-earth-700">Document hashes still awaiting chain anchoring</p>
      </div>
      <div className="rounded-[1.5rem] border border-earth-100 bg-earth-50/80 p-4">
        <p className="text-sm uppercase tracking-[0.2em] text-earth-500">Blockchain mode</p>
        <p className="mt-3 text-3xl font-bold text-earth-900">{verification.blockchain.mode}</p>
        <p className="mt-2 text-sm text-earth-700">{verification.blockchain.note}</p>
      </div>
    </div>

    <div>
      <h3 className="mb-4 text-xl font-bold text-earth-900">Findings</h3>
      <div className="grid gap-4">
        {verification.findings.map((finding) => (
          <div key={finding.code} className="rounded-[1.5rem] border border-earth-100 bg-white p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h4 className="font-semibold text-earth-900">{finding.title}</h4>
              <StatusPill status={finding.severity}>{finding.severity}</StatusPill>
            </div>
            <p className="text-sm text-earth-700">{finding.detail}</p>
          </div>
        ))}
      </div>
    </div>

    <div className="grid gap-4 xl:grid-cols-3">
      <AuthorityCard title="RTC / Bhoomi-style snapshot" snapshot={verification.authoritativeSnapshots.rtc} />
      <AuthorityCard title="Registration / Encumbrance snapshot" snapshot={verification.authoritativeSnapshots.registration} />
      <AuthorityCard title="Survey / cadastral snapshot" snapshot={verification.authoritativeSnapshots.survey} />
    </div>
  </section>
);

export default VerificationPanel;

