import { useEffect, useRef, useState } from "react";
import { Check, Copy, MapPinned, Search, X } from "lucide-react";
import { createParcelTransactionApi, updateParcelTransactionApi } from "../api/client";
import { formatParcelTimestamp, getParcelLayers } from "../utils/parcelInfo";

const nextTransactionStatuses = {
  "Application Submitted": ["Under Verification", "Rejected"],
  "Under Verification": ["Registration Pending", "Rejected"],
  "Registration Pending": ["Registered", "Rejected"]
};

const ParcelInfoPanel = ({ parcel, onClose, onZoomToParcel, onSearchAnother, onRefresh, role, citizen = false }) => {
  const panelRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [transactionType, setTransactionType] = useState("");
  const [transactionBusy, setTransactionBusy] = useState(false);
  const [transactionMessage, setTransactionMessage] = useState("");
  const modulesAreLocalDemo = (moduleName) =>
    parcel?.unifiedRecord?.modules?.[moduleName]?.source?.mode === "local-demo" ||
    parcel?.unifiedRecord?.synchronization?.mode === "local-demo";
  const transactions = parcel?.unifiedRecord?.modules?.transactions?.data?.applications || [];
  const layers = getParcelLayers(parcel?.unifiedRecord);
  const { parcelInfo, tabs, sectionsByTab, boundaryCoordinates, availability, access } = layers;
  const statusLabel = (status) => ({
    available: "Available",
    unavailable: "Data source not configured",
    pending: "Pending",
    restricted: "Restricted"
  }[status] || "Data source not configured");

  useEffect(() => {
    panelRef.current?.focus();
    setActiveTab("overview");
  }, [parcel?.unifiedRecord?.parcel?.parcelId]);

  const copyUlpin = async () => {
    if (!parcelInfo.ulpin || parcelInfo.ulpin === "Not available") return;
    if (!navigator.clipboard?.writeText) {
      setCopyError("Clipboard access is unavailable. Select and copy the ULPIN manually.");
      return;
    }
    try {
      await navigator.clipboard.writeText(parcelInfo.ulpin);
      setCopied(true);
      setCopyError("");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
      setCopyError("Unable to copy the ULPIN. Select and copy it manually.");
    }
  };

  const selectRelativeTab = (event, currentIndex) => {
    const lastIndex = tabs.length - 1;
    let nextIndex = currentIndex;
    if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % tabs.length;
    else if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = lastIndex;
    else return;

    event.preventDefault();
    const nextTab = tabs[nextIndex];
    setActiveTab(nextTab.id);
    document.getElementById(`parcel-tab-${nextTab.id}`)?.focus();
  };

  const renderRows = (rows) => (
    <dl className="divide-y divide-slate-100">
      {rows.map(({ label, value }) => (
        <div key={label} className="grid grid-cols-[minmax(7rem,0.8fr)_minmax(0,1.2fr)] gap-3 py-2 text-sm">
          <dt className="text-slate-500">{label}</dt>
          <dd className="break-words text-right font-medium text-slate-900">{value}</dd>
        </div>
      ))}
    </dl>
  );

  const renderSections = (sections) => (
    <div className="space-y-4">
      {sections.map((item) => (
        <section key={item.title} aria-labelledby={`section-${item.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`}>
          <h3
            id={`section-${item.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}`}
            className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-700"
          >
            {item.title}
          </h3>
          <div className="rounded-xl border border-slate-200 bg-white px-3">
            {renderRows(item.rows)}
          </div>
        </section>
      ))}
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-5">
      {access && (
        <p className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs leading-5 text-blue-950">
          {access.notice}
        </p>
      )}
      <section aria-labelledby="parcel-identification-heading">
        <h3 id="parcel-identification-heading" className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-700">
          Parcel identification
        </h3>
        <div className="rounded-xl border border-slate-200 bg-white px-3">
          {renderRows([
            { label: "Parcel identifier", value: parcelInfo.parcelId },
            { label: "State", value: parcelInfo.state },
            { label: "District", value: parcelInfo.district },
            { label: "Taluk / Tehsil", value: parcelInfo.taluk },
            { label: "Village / Ward", value: parcelInfo.village },
            { label: "Survey number", value: parcelInfo.surveyNumber },
            { label: "Parcel area", value: parcelInfo.area },
            { label: "Source system", value: parcelInfo.sourceSystem },
            { label: "Record status", value: parcelInfo.recordStatus },
            { label: "Last updated (Land Stack)", value: formatParcelTimestamp(parcelInfo.lastUpdated) },
            { label: "Source record", value: parcelInfo.sourceRecord }
          ])}
        </div>
      </section>

      <section aria-labelledby="layer-availability-heading">
        <h3 id="layer-availability-heading" className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-700">
          Layer availability
        </h3>
        <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white px-3">
          {availability.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
              <dt className="text-slate-700">{item.label}</dt>
              <dd className="text-right">
                <span className={
                  item.status === "restricted"
                    ? "font-semibold text-red-800"
                    : item.status === "pending"
                      ? "font-semibold text-amber-800"
                      : item.configured
                        ? "font-medium text-emerald-800"
                        : "text-slate-500"
                }>
                  {statusLabel(item.status)}
                </span>
                {item.source && <span className="block text-xs text-slate-500">{item.source} · local demonstration data</span>}
                {item.lastSynchronizedAt && (
                  <span className="block text-xs text-slate-500">
                    Last local sync: {formatParcelTimestamp(item.lastSynchronizedAt)}
                  </span>
                )}
              </dd>
            </div>
          ))}
        </dl>
        {layers.synchronization && (
          <p className="mt-3 rounded-lg bg-slate-100 p-3 text-xs leading-5 text-slate-600">
            {layers.synchronization.disclaimer}
          </p>
        )}
      </section>
    </div>
  );

  const renderCadastral = () => (
    <div className="space-y-4">
      {renderSections(sectionsByTab.cadastral || [])}
      <section aria-labelledby="parcel-spatial-heading">
        <h3 id="parcel-spatial-heading" className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-700">
          Parcel boundary
        </h3>
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <p className="text-xs text-slate-600">
            {boundaryCoordinates.length
              ? `GeoJSON polygon · ${boundaryCoordinates.length} boundary coordinates`
              : "Data source not configured"}
          </p>
          {boundaryCoordinates.length > 0 && (
            <ol className="mt-2 max-h-40 space-y-1 overflow-y-auto font-mono text-[11px] text-slate-700">
              {boundaryCoordinates.map(([longitude, latitude], index) => (
                <li key={`${longitude}-${latitude}-${index}`}>
                  {index + 1}. {latitude.toFixed(6)}, {longitude.toFixed(6)}
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>
    </div>
  );

  const renderTaxesUtilities = () => (
    <div className="space-y-4">
      {modulesAreLocalDemo("propertyTax") && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950">
          Property tax values are local demonstration records, not a live municipal assessment. A last-updated date is shown only when the source record provides one.
        </p>
      )}
      {modulesAreLocalDemo("utilities") && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950">
          Utility and infrastructure details are local sample data. Recorded network proximity or reference values do not verify an active utility connection.
        </p>
      )}
      {renderSections(sectionsByTab.taxesUtilities || [])}
      {layers.additionalAvailability.find((module) => module.id === "utilities")?.configured &&
        layers.utilityAvailability.filter((item) => !item.configured).map((item) => (
          <section key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-700">{item.label}</h3>
            <p className="mt-2 text-sm text-slate-500">Data source not configured</p>
          </section>
        ))}
      {layers.additionalAvailability
        .filter((module) => !module.configured)
        .map((module) => (
          <section key={module.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-700">{module.label}</h3>
            <p className="mt-2 text-sm text-slate-500">{statusLabel(module.status)}</p>
          </section>
        ))}
    </div>
  );

  const renderPlanning = () => (
    layers.planningInfo.available
      ? renderSections(sectionsByTab.planning || [])
      : <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
          Planning data not available for this parcel.
        </p>
  );

  const createTransaction = async (event) => {
    event.preventDefault();
    const type = transactionType.trim();
    if (!type) {
      setTransactionMessage("Enter an application or transaction type.");
      return;
    }
    setTransactionBusy(true);
    setTransactionMessage("");
    try {
      const result = await createParcelTransactionApi(parcel.parcelId, { transactionType: type });
      setTransactionType("");
      setTransactionMessage(result.notice || result.message || "Local prototype application recorded.");
      await onRefresh?.();
    } catch (error) {
      setTransactionMessage(error.response?.data?.message || "Unable to record the application.");
    } finally {
      setTransactionBusy(false);
    }
  };

  const updateTransaction = async (transactionId, status) => {
    setTransactionBusy(true);
    setTransactionMessage("");
    try {
      const result = await updateParcelTransactionApi(parcel.parcelId, transactionId, { status });
      setTransactionMessage(result.notice || "Local prototype status updated.");
      await onRefresh?.();
    } catch (error) {
      setTransactionMessage(error.response?.data?.message || "Unable to update the application status.");
    } finally {
      setTransactionBusy(false);
    }
  };

  const renderTransactions = () => (
    <div className="space-y-4">
      <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-950">
        Local prototype application tracking only. These statuses are not government registration decisions and do not update ownership records.
      </p>
      {transactionMessage && <p role="status" className="rounded-lg bg-slate-100 p-3 text-sm text-slate-800">{transactionMessage}</p>}
      {(role === "citizen" || role === "sro" || role === "admin") && (
        <form onSubmit={createTransaction} className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
          <label htmlFor="parcel-transaction-type" className="block text-sm font-semibold text-slate-800">
            New application
          </label>
          <div className="flex gap-2">
            <input
              id="parcel-transaction-type"
              value={transactionType}
              onChange={(event) => setTransactionType(event.target.value)}
              maxLength={100}
              placeholder="e.g. Sale deed application"
              className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0B2545]"
            />
            <button
              type="submit"
              disabled={transactionBusy}
              className="rounded-lg bg-[#0B2545] px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              Submit
            </button>
          </div>
        </form>
      )}
      {transactions.length
        ? renderSections(sectionsByTab.transactions || [])
        : <p className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">No transaction applications are recorded for this parcel.</p>}
      {(role === "sro" || role === "admin") && transactions.map((transaction) => {
        const currentStatus = transaction.underlyingStatus || transaction.status;
        const nextStatuses = transaction.status === "Restricted" ? [] : (nextTransactionStatuses[currentStatus] || []);
        return nextStatuses.length > 0 && (
          <div key={`${transaction.id}-actions`} className="flex flex-wrap gap-2">
            {nextStatuses.map((status) => (
              <button
                key={status}
                type="button"
                disabled={transactionBusy}
                onClick={() => updateTransaction(transaction.id, status)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
              >
                Set {transaction.applicationReference} to {status}
              </button>
            ))}
          </div>
        );
      })}
    </div>
  );

  const selectedTab = tabs.find((tab) => tab.id === activeTab) || tabs[0];

  return (
    <aside
      ref={panelRef}
      tabIndex={-1}
      aria-labelledby="parcel-info-heading"
      aria-describedby="parcel-info-summary"
      className="min-w-0 rounded-2xl border border-slate-200 bg-white shadow-md outline-none"
    >
      <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Selected parcel</p>
          <h2 id="parcel-info-heading" className="mt-1 break-words text-lg font-bold text-[#0B2545]">
            {parcelInfo.parcelId}
          </h2>
          <p id="parcel-info-summary" className="mt-1 text-xs text-slate-600">
            {selectedTab.layer}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2545]"
          aria-label="Close parcel information panel"
        >
          <X size={18} />
        </button>
      </div>

      <div className="border-b border-slate-200 bg-slate-50 px-5 py-3">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Common parcel identifier · ULPIN</p>
        <div className="mt-1 flex items-center justify-between gap-3">
          <p className="break-all font-mono text-sm font-semibold text-[#0B2545]">{parcelInfo.ulpin}</p>
          {parcelInfo.ulpin !== "Not available" && (
            <button
              type="button"
              onClick={copyUlpin}
              className="inline-flex shrink-0 items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2545]"
              aria-label={copied ? "ULPIN copied" : "Copy ULPIN"}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? "Copied" : "Copy"}
            </button>
          )}
        </div>
        {copyError && <p role="status" className="mt-1 text-xs text-red-800">{copyError}</p>}
      </div>

      <div role="tablist" aria-label="Parcel information layers" className="flex gap-1 overflow-x-auto border-b border-slate-200 px-3 py-2">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            id={`parcel-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`parcel-tabpanel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => setActiveTab(tab.id)}
            onKeyDown={(event) => selectRelativeTab(event, index)}
            className={`shrink-0 rounded-lg px-3 py-2 text-xs font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#0B2545] ${
              activeTab === tab.id ? "bg-[#0B2545] text-white" : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        id={`parcel-tabpanel-${selectedTab.id}`}
        role="tabpanel"
        aria-labelledby={`parcel-tab-${selectedTab.id}`}
        tabIndex={0}
        className="max-h-[70vh] min-h-40 overflow-y-auto bg-slate-50/60 p-5 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0B2545] lg:max-h-[calc(100vh-17rem)]"
      >
        {selectedTab.id === "overview" && renderOverview()}
        {selectedTab.id === "cadastral" && renderCadastral()}
        {selectedTab.id === "taxesUtilities" && renderTaxesUtilities()}
        {selectedTab.id === "planning" && renderPlanning()}
        {selectedTab.id === "transactions" && renderTransactions()}
        {!["overview", "cadastral", "taxesUtilities", "planning", "transactions"].includes(selectedTab.id) &&
          renderSections(sectionsByTab[selectedTab.id] || [])}
      </div>

      <div className="flex flex-wrap gap-2 border-t border-slate-200 p-4">
        <button
          type="button"
          onClick={onZoomToParcel}
          disabled={!boundaryCoordinates.length}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#0B2545] px-3 py-2.5 text-sm font-semibold text-white hover:bg-[#16385f] disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2545]"
        >
          <MapPinned size={16} />
          Zoom to parcel
        </button>
        <button
          type="button"
          onClick={citizen ? onClose : onSearchAnother}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2545]"
        >
          <Search size={16} />
          {citizen ? "Back to Map" : "Search another parcel"}
        </button>
      </div>
    </aside>
  );
};

export default ParcelInfoPanel;
