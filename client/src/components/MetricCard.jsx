const MetricCard = ({ label, value, caption }) => (
  <div className="rounded-[1.75rem] border border-white/60 bg-white/80 p-5 shadow-panel backdrop-blur">
    <p className="text-sm uppercase tracking-[0.22em] text-earth-500">{label}</p>
    <p className="mt-3 text-3xl font-extrabold text-earth-900">{value}</p>
    <p className="mt-2 text-sm text-earth-600">{caption}</p>
  </div>
);

export default MetricCard;

