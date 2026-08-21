import { Copy } from "lucide-react";
import QRCode from "react-qr-code";

const QrPanel = ({ qr }) => {
  const copy = async () => {
    await navigator.clipboard.writeText(qr.publicUrl);
  };

  return (
    <section className="rounded-[2rem] border border-white/70 bg-white/85 p-6 shadow-panel">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-earth-900">Parcel QR Verification</h2>
        <p className="mt-2 text-sm text-earth-700">
          Scan this QR code to open a public verification report for this Karnataka parcel.
        </p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
        <div className="rounded-[2rem] bg-white p-4">
          <QRCode value={qr.publicUrl} size={180} />
        </div>

        <div className="flex-1 space-y-3">
          <div className="rounded-[1.5rem] border border-earth-100 bg-earth-50/80 p-4">
            <p className="text-sm uppercase tracking-[0.2em] text-earth-500">Verification URL</p>
            <p className="mt-2 break-all text-sm font-medium text-earth-900">{qr.publicUrl}</p>
          </div>

          <div className="rounded-[1.5rem] border border-earth-100 bg-earth-50/80 p-4">
            <p className="text-sm uppercase tracking-[0.2em] text-earth-500">Scan token</p>
            <p className="mt-2 font-mono text-sm text-earth-900">{qr.token}</p>
          </div>

          <button
            onClick={copy}
            className="inline-flex items-center gap-2 rounded-full bg-earth-900 px-5 py-2 text-sm font-semibold text-earth-50 transition hover:bg-earth-800"
          >
            <Copy size={16} />
            Copy verification URL
          </button>
        </div>
      </div>
    </section>
  );
};

export default QrPanel;

