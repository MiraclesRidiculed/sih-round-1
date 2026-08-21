const styles = {
  verified: "bg-field-100 text-field-800 border-field-200",
  attention: "bg-amber-100 text-amber-800 border-amber-200",
  mismatch: "bg-rose-100 text-rose-800 border-rose-200",
  pass: "bg-field-100 text-field-800 border-field-200",
  warning: "bg-amber-100 text-amber-800 border-amber-200",
  high: "bg-rose-100 text-rose-800 border-rose-200",
  demo: "bg-lake-100 text-lake-800 border-lake-200"
};

const StatusPill = ({ status, children }) => (
  <span
    className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
      styles[status] || "bg-earth-100 text-earth-800 border-earth-200"
    }`}
  >
    {children || status}
  </span>
);

export default StatusPill;

