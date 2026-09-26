import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Cloud, CloudOff, Download, LocateFixed, RefreshCw, Save } from "lucide-react";
import { fetchParcel, submitFieldSurveyApi } from "../api/client";
import { useAuth } from "../context/AuthContext";
import {
  cacheSurveyParcel,
  exportSurveyWorkPackage,
  getCachedSurveyParcel,
  getCachedSurveyParcels,
  getCachedSurveys,
  saveSurveyOffline,
  syncPendingSurveys,
  unlockOfflineVault
} from "../utils/offlineSurvey";

const statusLabels = {
  pending: "Pending synchronization",
  synchronized: "Synchronized",
  failed: "Sync failed"
};

const statusStyles = {
  pending: "border-amber-300 bg-amber-50 text-amber-900",
  synchronized: "border-emerald-300 bg-emerald-50 text-emerald-900",
  failed: "border-rose-300 bg-rose-50 text-rose-900"
};

const FieldSurveyPage = () => {
  const { user } = useAuth();
  const [online, setOnline] = useState(navigator.onLine);
  const [parcels, setParcels] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [selectedParcelId, setSelectedParcelId] = useState("");
  const [parcelSearch, setParcelSearch] = useState("");
  const [loadedParcel, setLoadedParcel] = useState(null);
  const [observations, setObservations] = useState("");
  const [coordinateNote, setCoordinateNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [vaultPassword, setVaultPassword] = useState("");
  const [unlockingVault, setUnlockingVault] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setVaultUnlocked(false);
    setVaultPassword("");
    setParcels([]);
    setSurveys([]);
    setLoadedParcel(null);
    setSelectedParcelId("");
  }, [user?.id]);

  const refreshLocalRecords = useCallback(async () => {
    const [cachedParcels, cachedSurveys] = await Promise.all([
      user?.id ? getCachedSurveyParcels(String(user.id)) : Promise.resolve([]),
      user?.id ? getCachedSurveys(String(user.id)) : Promise.resolve([])
    ]);
    setParcels(cachedParcels.sort((a, b) => a.parcelId.localeCompare(b.parcelId)));
    setSurveys(cachedSurveys.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    setLoadedParcel((current) => current || cachedParcels.find((parcel) => parcel.parcelId === selectedParcelId) || null);
  }, [selectedParcelId, user?.id]);

  const synchronize = useCallback(async () => {
    if (!navigator.onLine || !vaultUnlocked) return;
    setSyncing(true);
    setError("");
    try {
      if (!user?.id) return;
      const result = await syncPendingSurveys((survey) =>
        submitFieldSurveyApi(survey.parcelId, {
          offlineId: survey.offlineId,
          surveyDate: survey.surveyDate,
          observations: survey.observations,
          observedCoordinate: survey.observedCoordinate
        }),
      String(user.id));
      if (result.synchronized || result.failed) {
        setMessage(`${result.synchronized} survey record(s) synchronized; ${result.failed} failed and retained for retry.`);
      }
      await refreshLocalRecords();
    } catch (syncError) {
      setError(syncError.message || "Unable to read the local survey queue. Saved records remain in browser storage.");
    } finally {
      setSyncing(false);
    }
  }, [refreshLocalRecords, user, vaultUnlocked]);

  useEffect(() => {
    if (!vaultUnlocked) return;
    const updateConnectivity = () => {
      const connected = navigator.onLine;
      setOnline(connected);
      if (connected) synchronize();
    };
    window.addEventListener("online", updateConnectivity);
    window.addEventListener("offline", updateConnectivity);
    refreshLocalRecords().catch((storageError) => setError(storageError.message));
    if (navigator.onLine) synchronize();
    return () => {
      window.removeEventListener("online", updateConnectivity);
      window.removeEventListener("offline", updateConnectivity);
    };
  }, [refreshLocalRecords, synchronize, vaultUnlocked]);

  const unlockVault = async (event) => {
    event.preventDefault();
    setUnlockingVault(true);
    setError("");
    try {
      await unlockOfflineVault(String(user.id), vaultPassword);
      setVaultUnlocked(true);
      setVaultPassword("");
      setMessage("Offline survey records are unlocked for this session.");
      await refreshLocalRecords();
    } catch (unlockError) {
      setError(unlockError.message || "The offline survey vault could not be unlocked.");
    } finally {
      setUnlockingVault(false);
    }
  };

  const selectedCachedParcel = useMemo(
    () => parcels.find((parcel) => parcel.parcelId === selectedParcelId) || null,
    [parcels, selectedParcelId]
  );

  const loadParcelForSurvey = async () => {
    setError("");
    setMessage("");
    if (!parcelSearch.trim()) {
      setError("Enter a parcel identifier to load its cadastral coordinates.");
      return;
    }
    if (!vaultUnlocked) {
      setError("Unlock the offline survey vault before caching coordinates.");
      return;
    }
    setLoading(true);
    try {
      if (navigator.onLine) {
        const parcel = await fetchParcel(parcelSearch.trim());
        const cached = await cacheSurveyParcel(parcel, String(user.id));
        setLoadedParcel(cached);
        setSelectedParcelId(cached.parcelId);
        await refreshLocalRecords();
        setMessage("Parcel reference and cadastral coordinates saved for offline field work.");
      } else {
        const cached = await getCachedSurveyParcel(parcelSearch.trim(), String(user.id));
        if (!cached) throw new Error("This parcel has not been cached on this device. Load it while online before field work.");
        setLoadedParcel(cached);
        setSelectedParcelId(cached.parcelId);
      }
    } catch (loadError) {
      setError(loadError.response?.data?.message || loadError.message || "Unable to load parcel coordinates.");
    } finally {
      setLoading(false);
    }
  };

  const selectCachedParcel = (parcelId) => {
    setSelectedParcelId(parcelId);
    setLoadedParcel(parcels.find((parcel) => parcel.parcelId === parcelId) || null);
    setError("");
  };

  const captureCoordinate = () => {
    if (!navigator.geolocation) {
      setError("Location capture is not available in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setCoordinateNote(JSON.stringify({
          latitude: Number(coords.latitude.toFixed(7)),
          longitude: Number(coords.longitude.toFixed(7)),
          accuracyMeters: Number(coords.accuracy.toFixed(1)),
          capturedAt: new Date().toISOString()
        }));
        setError("");
      },
      (locationError) => setError(`Location capture failed: ${locationError.message}`),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const saveSurvey = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!loadedParcel) {
      setError("Load a parcel with locally stored cadastral coordinates before saving a survey.");
      return;
    }
    setSaving(true);
    try {
      const record = await saveSurveyOffline({
        ownerId: String(user.id),
        parcelId: loadedParcel.parcelId,
        surveyDate: new Date().toISOString(),
        observations,
        observedCoordinate: coordinateNote ? JSON.parse(coordinateNote) : null,
        parentGeoJson: loadedParcel.geoJson,
        parcelReferences: {
          ulpin: loadedParcel.ulpin,
          surveyNumber: loadedParcel.surveyNumber,
          district: loadedParcel.district,
          taluk: loadedParcel.taluk,
          village: loadedParcel.village
        }
      });
      setObservations("");
      setCoordinateNote("");
      setMessage("Survey saved locally and queued for synchronization.");
      await refreshLocalRecords();
      if (navigator.onLine) await synchronize();
      return record;
    } catch (saveError) {
      setError(saveError.message || "Survey could not be saved. No synchronization was attempted.");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const queuedCount = surveys.filter(({ status }) => status === "pending" || status === "failed").length;

  if (!["admin", "surveyor"].includes(user?.role)) {
    return (
      <section role="alert" className="rounded-3xl border border-amber-300 bg-amber-50 p-6 text-sm text-amber-950">
        Field survey access is limited to authenticated surveyor and administrator accounts.
      </section>
    );
  }

  if (!vaultUnlocked) {
    return (
      <section className="max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-[#0B2545]">Unlock offline survey records</h2>
        <p className="mt-2 text-sm text-slate-600">
          Saved surveys and cadastral coordinates are encrypted on this device. Enter your account password to unlock them; after a reload, they remain locked until you do.
        </p>
        {error && <div role="alert" className="mt-4 rounded-xl border border-rose-300 bg-rose-50 p-3 text-sm text-rose-900">{error}</div>}
        <form onSubmit={unlockVault} className="mt-4 space-y-3">
          <label className="block text-sm font-semibold text-slate-700">
            Account password
            <input
              type="password"
              autoComplete="current-password"
              required
              value={vaultPassword}
              onChange={(event) => setVaultPassword(event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2"
            />
          </label>
          <button type="submit" disabled={unlockingVault} className="rounded-xl bg-[#0B2545] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
            {unlockingVault ? "Unlocking..." : "Unlock encrypted records"}
          </button>
        </form>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#334155]">Survey & Cadastral Operations</p>
            <h2 className="mt-1 text-2xl font-bold text-[#0B2545]">Offline field survey</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Load parcel coordinates while connected, record field observations offline, then synchronize the queued survey when service returns.
            </p>
          </div>
          <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-semibold ${
            online ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-amber-300 bg-amber-50 text-amber-900"
          }`}>
            {online ? <Cloud size={16} /> : <CloudOff size={16} />}
            {online ? "Online" : "Offline"}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-xs font-semibold text-slate-700">
          <span className="rounded-full bg-amber-50 px-3 py-1.5">{queuedCount} pending synchronization</span>
          <span className="rounded-full bg-emerald-50 px-3 py-1.5">{surveys.filter((survey) => survey.status === "synchronized").length} synchronized</span>
          <span className="rounded-full bg-rose-50 px-3 py-1.5">{surveys.filter((survey) => survey.status === "failed").length} sync failed</span>
        </div>
      </header>

      {error && <div role="alert" className="rounded-2xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900">{error}</div>}
      {message && <div role="status" className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">{message}</div>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-bold text-[#0B2545]">Parcel coordinates</h3>
          <p className="mt-1 text-xs text-slate-600">Only parcel identifiers and cadastral polygon geometry are retained for offline survey use.</p>
          <div className="mt-4 flex gap-2">
            <input
              value={parcelSearch}
              onChange={(event) => setParcelSearch(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && loadParcelForSurvey()}
              placeholder="Parcel identifier"
              className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
            <button type="button" onClick={loadParcelForSurvey} disabled={loading} className="rounded-xl bg-[#0B2545] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {loading ? "Loading..." : "Load"}
            </button>
          </div>
          {parcels.length > 0 && (
            <label className="mt-4 block text-xs font-semibold text-slate-700">
              Available on this device
              <select value={selectedParcelId} onChange={(event) => selectCachedParcel(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm">
                <option value="">Select a cached parcel</option>
                {parcels.map((parcel) => <option key={parcel.parcelId} value={parcel.parcelId}>{parcel.parcelId} · Survey {parcel.surveyNumber}</option>)}
              </select>
            </label>
          )}
          {loadedParcel && (
            <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm">
              <p className="font-bold text-[#0B2545]">{loadedParcel.parcelId}</p>
              <p className="mt-1 text-xs text-slate-600">
                {loadedParcel.village}, {loadedParcel.taluk}, {loadedParcel.district} · Survey {loadedParcel.surveyNumber || "Not recorded"}
              </p>
              <p className="mt-2 text-xs font-semibold text-emerald-800">
                Cadastral Polygon stored locally · {loadedParcel.geoJson.geometry.coordinates[0].length - 1} boundary vertices
              </p>
            </div>
          )}
          {selectedCachedParcel && !loadedParcel && (
            <button type="button" onClick={() => selectCachedParcel(selectedCachedParcel.parcelId)} className="mt-3 text-sm font-semibold text-blue-800 underline">
              Use cached parcel coordinates
            </button>
          )}
        </section>

        <form onSubmit={saveSurvey} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-bold text-[#0B2545]">Field observation</h3>
          <label className="mt-4 block text-xs font-semibold text-slate-700">
            Survey observations
            <textarea
              required
              value={observations}
              onChange={(event) => setObservations(event.target.value)}
              rows={5}
              placeholder="Record boundary observations, marks, or field notes."
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-normal"
            />
          </label>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button type="button" onClick={captureCoordinate} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800">
              <LocateFixed size={16} /> Capture GPS coordinate
            </button>
            {coordinateNote && <span className="text-xs text-slate-700">Location captured: {JSON.parse(coordinateNote).latitude}, {JSON.parse(coordinateNote).longitude}</span>}
          </div>
          <button type="submit" disabled={saving || !loadedParcel} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0B2545] px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
            <Save size={16} /> {saving ? "Saving..." : "Save survey locally"}
          </button>
        </form>
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[#0B2545]">Survey synchronization queue</h3>
            <p className="mt-1 text-xs text-slate-600">Failed submissions remain stored locally and can be retried.</p>
          </div>
          <button type="button" onClick={synchronize} disabled={!online || syncing || queuedCount === 0} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-800 disabled:opacity-50">
            <RefreshCw size={15} className={syncing ? "animate-spin" : ""} /> {syncing ? "Synchronizing..." : "Retry synchronization"}
          </button>
        </div>
        {surveys.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">No field survey records have been saved on this device.</p>
        ) : (
          <div className="mt-4 divide-y divide-slate-200">
            {surveys.map((survey) => (
              <article key={survey.offlineId} className="flex flex-wrap items-start justify-between gap-3 py-4 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-sm text-[#0B2545]">{survey.parcelId}</strong>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusStyles[survey.status]}`}>
                      {statusLabels[survey.status]}
                    </span>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{survey.observations}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Saved {new Date(survey.createdAt).toLocaleString()} · {survey.syncAttempts} sync attempt(s)
                  </p>
                  {survey.lastSyncError && <p className="mt-1 flex items-center gap-1 text-xs text-rose-800"><AlertCircle size={13} />{survey.lastSyncError}</p>}
                  {survey.synchronizedAt && <p className="mt-1 flex items-center gap-1 text-xs text-emerald-800"><CheckCircle2 size={13} />Synchronized {new Date(survey.synchronizedAt).toLocaleString()}</p>}
                </div>
                <button type="button" onClick={() => exportSurveyWorkPackage(survey)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700">
                  <Download size={14} /> Export
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
};

export default FieldSurveyPage;
