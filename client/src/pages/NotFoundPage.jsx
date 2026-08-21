import { Link } from "react-router-dom";

const NotFoundPage = () => (
  <div className="rounded-[2rem] border border-white/70 bg-white/85 p-10 shadow-panel">
    <h2 className="text-3xl font-extrabold text-earth-900">Page not found</h2>
    <p className="mt-3 text-sm text-earth-700">
      The requested route does not exist in this Karnataka land parcel verification MVP.
    </p>
    <Link
      to="/"
      className="mt-5 inline-flex rounded-full bg-earth-900 px-5 py-2 text-sm font-semibold text-earth-50 transition hover:bg-earth-800"
    >
      Back to dashboard
    </Link>
  </div>
);

export default NotFoundPage;

