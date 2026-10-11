import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { Circle, GeoJSON, MapContainer, Marker, Polygon, Polyline, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import { AlertOctagon, Check, Eye, Gavel, Layers, LoaderCircle, Lock, MapPin, Radio, Satellite, Search, ShieldAlert, X, Zap } from "lucide-react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { searchParcels } from "../api/client";
import { useLiveEvents } from "../context/LiveEventContext";
import { findExactParcelSearchMatch, normalizeParcelSearchTerm } from "../utils/parcelSearch";
import { getParcelPlanningInfo } from "../utils/parcelInfo";

// Fix default leaflet marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});

const FitToParcel = ({ geoJson, fitKey, fitRequest }) => {
  const map = useMap();

  useEffect(() => {
    if (!geoJson) return;
    try {
      const bounds = L.geoJSON(geoJson).getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 17 });
      }
    } catch {
      // ignore
    }
  }, [geoJson, fitKey, fitRequest, map]);

  return null;
};

const ParcelMap = ({ parcel, geoJson: propGeoJson, height = "440px", fitRequest = 0, searchFocusRequest = 0, restrictedView = false, role }) => {
  const { lastEvent } = useLiveEvents();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const geoJson = propGeoJson || parcel?.geoJson;
  const planningInfo = getParcelPlanningInfo(parcel?.unifiedRecord, { ...parcel, geoJson });
  const changeDetection = parcel?.unifiedRecord?.modules?.changeDetection?.data;
  const encumbranceInfo = parcel?.unifiedRecord?.modules?.encumbrance?.data?.record ||
    parcel?.essentialLayers?.encumbrance || {};
  const [searchTerm, setSearchTerm] = useState("");
  const [searchStatus, setSearchStatus] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef(null);
  const isSearchResult = searchParams.get("mapSearch") === "1";

  // Active map layers.
  const [showBaseLayer, setShowBaseLayer] = useState(true);
  const [showEssentialLayer, setShowEssentialLayer] = useState(true);
  const [showUseCaseLayer, setShowUseCaseLayer] = useState(true);
  const [showChangeDetection, setShowChangeDetection] = useState(false);
  const [showPlanningLayer, setShowPlanningLayer] = useState(true);
  const [basemapType, setBasemapType] = useState("satellite"); // "satellite" or "topo"

  useEffect(() => {
    if (searchFocusRequest > 0) searchInputRef.current?.focus();
  }, [searchFocusRequest]);

  // Live CORS GNSS rover state
  const [liveRoverPoint, setLiveRoverPoint] = useState(null);

  useEffect(() => {
    if (
      lastEvent?.type === "GNSS_POINT_RECEIVED" &&
      lastEvent.payload?.parcelId === parcel?.parcelId
    ) {
      setLiveRoverPoint(lastEvent.payload);
      const timer = setTimeout(() => setLiveRoverPoint(null), 15000);
      return () => clearTimeout(timer);
    }
  }, [lastEvent, parcel?.parcelId]);

  // Derive center and coordinates
  const coords = geoJson?.geometry?.coordinates?.[0] || [];
  const centerLat = coords.length ? coords.reduce((acc, c) => acc + c[1], 0) / coords.length : 13.0;
  const centerLng = coords.length ? coords.reduce((acc, c) => acc + c[0], 0) / coords.length : 77.6;
  const leafletCoords = coords.map((c) => [c[1], c[0]]);

  // Court stay / transaction lock status
  const isCourtLocked = !restrictedView && Boolean(
    parcel?.disputeRecord?.transactionLock ||
    parcel?.essentialLayers?.ror?.revenueCourtDispute ||
    parcel?.verificationHint?.status === "mismatch"
  );

  // Utility lines
  const waterPipelineCoords = coords.length > 2 ? [
    [coords[0][1] + 0.0003, coords[0][0] - 0.0008],
    [coords[0][1] + 0.0003, coords[1][0] + 0.0008]
  ] : [];

  const powerGridCoords = coords.length > 3 ? [
    [coords[3][1] - 0.0004, coords[3][0] - 0.0006],
    [coords[2][1] - 0.0004, coords[2][0] + 0.0006]
  ] : [];

  const subdivision = parcel?.subdivisionData;
  const splitLine = subdivision?.activeSketch?.splitLine;
  const splitLineCoordinates = splitLine?.type === "MultiLineString"
    ? splitLine.coordinates
    : splitLine?.type === "LineString"
      ? [splitLine.coordinates]
      : subdivision?.activeSketch?.demarcationLineCoords
        ? [subdivision.activeSketch.demarcationLineCoords]
        : [];
  const demarcationLines = splitLineCoordinates.map((line) =>
    line.map(([longitude, latitude]) => [latitude, longitude])
  );
  const subdivisionChildren = subdivision?.subdivisions || [];
  const canViewSubdivision = role === "admin" || role === "surveyor";
  const handleParcelSearch = async (event) => {
    event.preventDefault();
    const query = normalizeParcelSearchTerm(searchTerm);
    if (!query) {
      setSearchStatus({
        type: "error",
        message: "Enter a ULPIN, survey number, or parcel identifier."
      });
      return;
    }

    setIsSearching(true);
    setSearchStatus(null);
    try {
      const response = await searchParcels({ search: query });
      const match = findExactParcelSearchMatch(response.items, query);
      if (!match) {
        setSearchStatus({ type: "error", message: "No land parcel found for the entered ULPIN." });
        return;
      }

      const targetPath = `/parcels/${encodeURIComponent(match.parcelId)}?mapSearch=1`;
      setSearchStatus({ type: "success", message: `Parcel ${match.parcelId} located. Boundary highlighted.` });
      navigate(targetPath);
    } catch (error) {
      setSearchStatus({
        type: "error",
        message: error.response?.data?.message || "Parcel search is temporarily unavailable. Please try again."
      });
    } finally {
      setIsSearching(false);
    }
  };

  const clearParcelSearch = () => {
    setSearchTerm("");
    setSearchStatus(null);
    if (isSearchResult) {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        next.delete("mapSearch");
        return next;
      }, { replace: true });
    }
  };

  const hasDetectedChange = changeDetection?.status === "change-detected";

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/70 shadow-panel">
      {/* Top Floating Controls Bar */}
      <div className="absolute left-3 right-3 top-3 z-[1000] flex flex-col gap-2 rounded-2xl border border-white/70 bg-white/95 p-2.5 shadow-lg backdrop-blur-md">
        <form onSubmit={handleParcelSearch} role="search" className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 shadow-sm focus-within:border-[#0B2545] focus-within:ring-2 focus-within:ring-[#0B2545]/15">
          <Search size={18} className="shrink-0 text-slate-500" aria-hidden="true" />
          <label htmlFor="parcel-map-search" className="sr-only">
            Search by ULPIN, survey number, or parcel identifier
          </label>
          <input
            ref={searchInputRef}
            id="parcel-map-search"
            type="search"
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              if (searchStatus) setSearchStatus(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") clearParcelSearch();
            }}
            placeholder="Search ULPIN, survey number, or parcel ID"
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-500"
          />
          {(searchTerm || searchStatus || isSearchResult) && (
            <button
              type="button"
              onClick={clearParcelSearch}
              className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              aria-label="Clear parcel search"
              title="Clear search"
            >
              <X size={16} />
            </button>
          )}
          <button
            type="submit"
            disabled={isSearching}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#0B2545] px-3 py-2 text-xs font-semibold text-white hover:bg-[#16385f] disabled:cursor-wait disabled:opacity-70"
          >
            {isSearching ? <LoaderCircle size={15} className="animate-spin" aria-hidden="true" /> : <Search size={15} aria-hidden="true" />}
            <span>{isSearching ? "Searching" : "Search"}</span>
          </button>
        </form>
        {searchStatus && (
          <p
            role={searchStatus.type === "error" ? "alert" : "status"}
            aria-live="polite"
            className={`px-1 text-xs font-medium ${searchStatus.type === "error" ? "text-red-800" : "text-emerald-800"}`}
          >
            {searchStatus.message}
          </p>
        )}
        {/* Basemap Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 rounded-xl bg-earth-100/70 p-1 text-xs font-medium text-earth-800">
          <button
            type="button"
            onClick={() => setBasemapType("satellite")}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition ${
              basemapType === "satellite" ? "bg-earth-900 text-white shadow-sm" : "hover:bg-earth-200/60"
            }`}
          >
            <Satellite size={13} />
            Satellite
          </button>
          <button
            type="button"
            onClick={() => setBasemapType("topo")}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition ${
              basemapType === "topo" ? "bg-earth-900 text-white shadow-sm" : "hover:bg-earth-200/60"
            }`}
          >
            <Eye size={13} />
            Cadastral Topo
          </button>
        </div>

        {!restrictedView && (
        /* 3 Spatial Layers Toggles */
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setShowBaseLayer(!showBaseLayer)}
            className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 transition ${
              showBaseLayer
                ? isCourtLocked
                  ? "border border-red-500/60 bg-red-50 text-red-950 shadow-sm"
                  : "border border-amber-500/40 bg-amber-50 text-amber-900 shadow-sm"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${isCourtLocked ? "bg-red-600" : "bg-amber-600"}`} />
            Layer 1: Base Cadastral
            {showBaseLayer && <Check size={12} className={isCourtLocked ? "text-red-700" : "text-amber-700"} />}
          </button>

          <button
            type="button"
            onClick={() => setShowEssentialLayer(!showEssentialLayer)}
            className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 transition ${
              showEssentialLayer
                ? "border border-blue-500/40 bg-blue-50 text-blue-900 shadow-sm"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-blue-600" />
            Layer 2: Essential (RRR)
            {showEssentialLayer && <Check size={12} className="text-blue-700" />}
          </button>

          <button
            type="button"
            onClick={() => setShowUseCaseLayer(!showUseCaseLayer)}
            className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 transition ${
              showUseCaseLayer
                ? "border border-emerald-500/40 bg-emerald-50 text-emerald-900 shadow-sm"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-600" />
            Layer 3: Use-Case (Utilities)
            {showUseCaseLayer && <Check size={12} className="text-emerald-700" />}
          </button>
        </div>
        )}

        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setShowChangeDetection(!showChangeDetection)}
            aria-pressed={showChangeDetection}
            className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 transition ${
              showChangeDetection
                ? "border border-rose-300 bg-rose-50 text-rose-900 shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-rose-50 hover:text-rose-800"
            }`}
          >
            <Zap size={12} className={showChangeDetection ? "text-rose-600" : "text-gray-400"} />
            Remote Sensing Change
          </button>
        </div>
        {planningInfo.zoningGeoJson && (
          <button
            type="button"
            onClick={() => setShowPlanningLayer((visible) => !visible)}
            aria-pressed={showPlanningLayer}
            className={`flex items-center gap-1.5 self-start rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
              showPlanningLayer
                ? "border border-blue-300 bg-blue-50 text-blue-900"
                : "border border-slate-200 bg-white text-slate-600"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-blue-600" />
            Planning designation
            {showPlanningLayer && <Check size={12} />}
          </button>
        )}
        </div>
      </div>

      {/* Map Canvas */}
      <MapContainer
        style={{ height, width: "100%" }}
        center={[centerLat, centerLng]}
        zoom={16}
        scrollWheelZoom
      >
        {basemapType === "satellite" ? (
          <TileLayer
            attribution="&copy; Esri World Imagery, Maxar, Earthstar Geographics"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={19}
          />
        ) : (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        )}

        {/* LAYER 1: BASE CADASTRAL & ULPIN */}
        {showBaseLayer && leafletCoords.length > 0 && (
          <>
            <Polygon
              positions={leafletCoords}
              pathOptions={{
                color: isCourtLocked ? "#dc2626" : "#f59e0b",
                weight: isCourtLocked ? 4 : 3,
                fillColor: isCourtLocked ? "#ef4444" : "#f59e0b",
                fillOpacity: isCourtLocked ? 0.35 : showEssentialLayer ? 0.15 : 0.45,
                dashArray: isCourtLocked ? "4, 4" : "6, 4"
              }}
            >
              <Tooltip sticky>
                <div className="text-xs font-semibold">
                  {!restrictedView && isCourtLocked && (
                    <p className="text-red-700 font-extrabold flex items-center gap-1">
                      <Lock size={12} />
                      🚨 Court Stay Active: Section 52 Lis Pendens
                    </p>
                  )}
                  <p className="text-amber-800 font-bold">Cadastral parcel</p>
                  <p>ULPIN: {parcel?.ulpin || "Unassigned"}</p>
                  <p>Survey: {parcel?.surveyNumber} / {parcel?.hissaNumber || ""}</p>
                  <p>Area: {parcel?.areaInAcres} Acres ({parcel?.baseLayer?.localAreaUnit || ""})</p>
                </div>
              </Tooltip>
            </Polygon>

            {/* Boundary Vertex Pins */}
            {leafletCoords.map((coord, idx) => (
              <Circle
                key={`vertex-${idx}`}
                center={coord}
                radius={3}
                pathOptions={{
                  color: "#ffffff",
                  fillColor: isCourtLocked ? "#dc2626" : "#d97706",
                  fillOpacity: 1,
                  weight: 2
                }}
              >
                <Popup>
                  <div className="text-xs">
                    <p className="font-bold text-amber-800">Cadastral Vertex #{idx + 1}</p>
                    <p className="font-mono text-[11px]">Lat: {coord[0].toFixed(6)}</p>
                    <p className="font-mono text-[11px]">Lng: {coord[1].toFixed(6)}</p>
                    {!restrictedView && <p className="text-gray-500">CORS Accuracy: ±5cm (WGS84)</p>}
                  </div>
                </Popup>
              </Circle>
            ))}
          </>
        )}

        {showPlanningLayer && planningInfo.zoningGeoJson && (
          <GeoJSON
            data={planningInfo.zoningGeoJson}
            style={() => ({
              color: planningInfo.zoningColor,
              weight: 2,
              fillColor: planningInfo.zoningColor,
              fillOpacity: 0.16
            })}
          >
            <Tooltip sticky>
              <span className="text-xs font-semibold">
                Recorded planning designation: {planningInfo.masterPlan.zoneCategory ||
                  planningInfo.masterPlan.planningDesignation ||
                  planningInfo.masterPlan.landUseDesignation}
              </span>
            </Tooltip>
            <Popup>
              <div className="max-w-xs space-y-1.5 p-1 text-xs">
                <p className="font-semibold text-[#0B2545]">Planning record · local demonstration data</p>
                {planningInfo.masterPlan.authority && <p><strong>Authority:</strong> {planningInfo.masterPlan.authority}</p>}
                {planningInfo.masterPlan.zoneCategory && <p><strong>Zone:</strong> {planningInfo.masterPlan.zoneCategory}</p>}
                {planningInfo.masterPlan.planningDesignation && <p><strong>Designation:</strong> {planningInfo.masterPlan.planningDesignation}</p>}
                <p className="text-slate-600">The shaded feature follows the parcel geometry; no separate zoning boundary layer is configured.</p>
              </div>
            </Popup>
          </GeoJSON>
        )}

        {canViewSubdivision && showBaseLayer && subdivisionChildren.map((child, index) => {
          const childRings = child.geoJson?.geometry?.coordinates || [];
          if (!childRings.length || childRings[0].length < 4) return null;
          const childPositions = childRings.map((ring) =>
            ring.map(([longitude, latitude]) => [latitude, longitude])
          );
          const childColor = index === 0 ? "#2563eb" : "#059669";
          return (
            <Polygon
              key={child.childIdentifier || `subdivision-part-${index}`}
              positions={childPositions}
              pathOptions={{ color: childColor, weight: 2, fillColor: childColor, fillOpacity: 0.28 }}
            >
              <Tooltip sticky>
                <div className="text-xs">
                  <p className="font-semibold">Child parcel part {child.part}</p>
                  <p>Project ID: {child.childIdentifier || "Not assigned"}</p>
                  <p>Area: {child.areaInAcres} acres</p>
                </div>
              </Tooltip>
            </Polygon>
          );
        })}

        {/* LAYER 2: ESSENTIAL GOVERNANCE & RRR */}
        {!restrictedView && showEssentialLayer && leafletCoords.length > 0 && (
          <Polygon
            positions={leafletCoords}
            pathOptions={{
              color: isCourtLocked ? "#b91c1c" : parcel?.geoJson?.properties?.zoningColor || "#3b82f6",
              weight: 2,
              fillColor: isCourtLocked ? "#f87171" : parcel?.geoJson?.properties?.zoningColor || "#3b82f6",
              fillOpacity: isCourtLocked ? 0.25 : 0.35
            }}
          >
            <Popup>
              <div className="max-w-xs space-y-1.5 p-1 text-xs">
                <div className="flex items-center justify-between border-b pb-1 font-bold text-blue-900">
                  <span>Essential Governance (RRR)</span>
                  {planningInfo.masterPlan.zoneCategory && (
                    <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-800">
                      {planningInfo.masterPlan.zoneCategory}
                    </span>
                  )}
                </div>
                {planningInfo.masterPlan.permissibleFar !== undefined && <p><strong>Permissible FAR:</strong> {planningInfo.masterPlan.permissibleFar}</p>}
                {planningInfo.buildingPermission.status && <p><strong>Building Permission:</strong> {planningInfo.buildingPermission.status}</p>}
                {encumbranceInfo.status && <p><strong>Encumbrance:</strong> {encumbranceInfo.status}</p>}
                {isCourtLocked && (
                  <p className="text-red-700 font-bold bg-red-50 p-1 rounded">
                    🚨 Injunction: {parcel?.disputeRecord?.caseNumber || "Stay Active"}
                  </p>
                )}
              </div>
            </Popup>
          </Polygon>
        )}

        {/* SUBDIVISION 11E DEMARCATION LINE (if parcel is subdivided) */}
        {canViewSubdivision && subdivision?.isSubdivided && demarcationLines.map((line, index) => line.length === 2 && (
          <Polyline
            key={`subdivision-cut-${index}`}
            positions={line}
            pathOptions={{ color: "#dc2626", weight: 3, dashArray: "6, 6" }}
          >
            <Tooltip sticky>
              <span className="text-xs font-bold text-red-700">
                Validated geometric split (11E Sketch: {subdivision?.activeSketch?.sketchId || "Demarcated"})
              </span>
            </Tooltip>
          </Polyline>
        ))}

        {/* LAYER 3: UTILITIES & WATER SUPPLY */}
        {!restrictedView && showUseCaseLayer && (
          <>
            {waterPipelineCoords.length === 2 && (
              <Polyline
                positions={waterPipelineCoords}
                pathOptions={{ color: "#0284c7", weight: 4, dashArray: "4, 6" }}
              >
                <Tooltip sticky>
                  <span className="text-xs font-semibold text-sky-800">
                    💧 Water Pipeline: {parcel?.additionalLayers?.utilities?.waterSupplyLine || "Municipal Feeder (200mm)"}
                  </span>
                </Tooltip>
              </Polyline>
            )}

            {powerGridCoords.length === 2 && (
              <Polyline
                positions={powerGridCoords}
                pathOptions={{ color: "#eab308", weight: 3, dashArray: "8, 6" }}
              >
                <Tooltip sticky>
                  <span className="text-xs font-semibold text-yellow-800">
                    ⚡ 11kV Power Feeder Grid ({parcel?.additionalLayers?.utilities?.powerSubstationDistance || "Active Grid"})
                  </span>
                </Tooltip>
              </Polyline>
            )}
          </>
        )}

        {showChangeDetection && hasDetectedChange && leafletCoords.length > 0 && (
          <Marker
            position={[centerLat, centerLng]}
            icon={L.divIcon({
              className: "",
              html: '<span class="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-rose-700 text-sm font-black text-white shadow-lg">!</span>',
              iconSize: [36, 36],
              iconAnchor: [18, 18]
            })}
          >
            <Tooltip>Sample change recorded for this parcel</Tooltip>
            <Popup>
              <div className="max-w-xs space-y-2 p-1 text-xs">
                <div className="flex items-center gap-1 font-bold text-rose-900">
                  <ShieldAlert size={14} />
                  <span>Remote Sensing Change Detection</span>
                </div>
                <p className="rounded bg-amber-50 px-2 py-1 font-semibold text-amber-900">
                  Simulated sample analysis · not real satellite intelligence
                </p>
                <p><strong>Detected change:</strong> {changeDetection.detectedChange || "Change recorded; classification unavailable"}</p>
                {changeDetection.detectionDate && <p><strong>Detection / recorded pass date:</strong> {changeDetection.detectionDate}</p>}
                <p><strong>Confidence:</strong> Not calculated</p>
                {changeDetection.changeAreaSqM !== null && <p><strong>Recorded change area:</strong> {changeDetection.changeAreaSqM} m²</p>}
                <p><strong>Affected parcel:</strong> {changeDetection.affectedParcel?.parcelId || parcel?.parcelId}</p>
                <p><strong>ULPIN:</strong> {changeDetection.affectedParcel?.ulpin || parcel?.ulpin || "Unassigned"}</p>
                {changeDetection.referenceDate && <p><strong>Reference date:</strong> {changeDetection.referenceDate}</p>}
                {changeDetection.sourceImagery && (
                  <div className="border-t border-slate-200 pt-1">
                    <p className="font-semibold">Source imagery metadata (recorded)</p>
                    {Object.entries(changeDetection.sourceImagery).map(([key, value]) => (
                      <p key={key}><strong>{key}:</strong> {Array.isArray(value) ? value.join(", ") : String(value)}</p>
                    ))}
                  </div>
                )}
                <p className="text-slate-600">{changeDetection.source?.disclaimer}</p>
                <p className="text-slate-500">Marker indicates the parcel, not the exact change location.</p>
              </div>
            </Popup>
          </Marker>
        )}

        {/* LIVE CORS GNSS ROVER TELEMETRY PIN */}
        {!restrictedView && liveRoverPoint && (
          <Circle
            center={[liveRoverPoint.lat, liveRoverPoint.lng]}
            radius={5}
            pathOptions={{ color: "#9333ea", fillColor: "#c084fc", fillOpacity: 0.9, weight: 3 }}
          >
            <Tooltip permanent>
              <div className="text-[10px] font-bold text-purple-950 bg-white p-1 rounded shadow">
                📡 CORS GNSS Rover Pt #{liveRoverPoint.pt} (±{liveRoverPoint.rtkAccuracyCm}cm)
              </div>
            </Tooltip>
          </Circle>
        )}

        {isSearchResult && leafletCoords.length > 0 && (
          <Polygon
            positions={leafletCoords}
            pathOptions={{ color: "#0B2545", weight: 5, fillColor: "#F59E0B", fillOpacity: 0.22 }}
            interactive={false}
          />
        )}

        <FitToParcel
          geoJson={geoJson}
          fitKey={isSearchResult ? location.key : null}
          fitRequest={fitRequest}
        />
      </MapContainer>

      {/* Bottom Map Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-earth-100 bg-white/95 px-5 py-2.5 text-xs text-earth-800">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5 font-medium">
            <span className={`h-2.5 w-2.5 rounded-full ${isCourtLocked ? "bg-red-600" : "bg-amber-400"}`} />
            {isCourtLocked ? "Disputed / Locked Cadastre" : "Cadastral Boundary"}
          </span>
          {!restrictedView && (
            <>
              {planningInfo.zoningGeoJson && (
              <span className="flex items-center gap-1.5 font-medium">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                Recorded planning designation
              </span>
              )}
              <span className="flex items-center gap-1.5 font-medium">
                <span className="h-1 w-4 bg-sky-500" />
                Water Conduits
              </span>
              <span className="flex items-center gap-1.5 font-medium">
                <span className="h-1 w-4 bg-yellow-500" />
                11kV Grid
              </span>
            </>
          )}
          {!restrictedView && isCourtLocked && (
            <span className="flex items-center gap-1 font-extrabold text-red-700 bg-red-50 px-2 py-0.5 rounded-md border border-red-200">
              <Lock size={12} />
              Court Stay Active
            </span>
          )}
        </div>

        <div className="text-[11px] text-earth-600">
          CRS: <span className="font-mono font-semibold">EPSG:4326</span> • RTK Sub-Meter Precision
        </div>
      </div>
    </div>
  );
};

export default ParcelMap;
