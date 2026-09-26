import { useEffect, useState } from "react";
import L from "leaflet";
import { Circle, GeoJSON, MapContainer, Marker, Polygon, Polyline, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import { AlertOctagon, Check, Eye, Gavel, Layers, Lock, MapPin, Radio, Satellite, ShieldAlert, Zap } from "lucide-react";
import { useLiveEvents } from "../context/LiveEventContext";

// Fix default leaflet marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});

const FitToParcel = ({ geoJson }) => {
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
  }, [geoJson, map]);

  return null;
};

const ParcelMap = ({ parcel, geoJson: propGeoJson, height = "440px" }) => {
  const { lastEvent } = useLiveEvents();
  const geoJson = propGeoJson || parcel?.geoJson;

  // Active layers state (The 3 Layers of Land Stack + AI)
  const [showBaseLayer, setShowBaseLayer] = useState(true);
  const [showEssentialLayer, setShowEssentialLayer] = useState(true);
  const [showUseCaseLayer, setShowUseCaseLayer] = useState(true);
  const [showAiRadar, setShowAiRadar] = useState(false);
  const [basemapType, setBasemapType] = useState("satellite"); // "satellite" or "topo"

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
  const isCourtLocked = Boolean(
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

  // Demarcation Split Line from Subdivision Sketch
  const demarcationLine = coords.length >= 4 ? [
    [(coords[0][1] + coords[3][1]) / 2, (coords[0][0] + coords[3][0]) / 2],
    [(coords[1][1] + coords[2][1]) / 2, (coords[1][0] + coords[2][0]) / 2]
  ] : [];

  // Synthesize AI encroachment anomaly polygon if anomaly detected
  const hasAiAnomaly = Boolean(parcel?.aiGeospatial?.satelliteChangeDetection?.anomalyDetected);
  const anomalyCoords = coords.length > 2 ? [
    [coords[0][1], coords[0][0]],
    [coords[1][1], coords[1][0]],
    [coords[1][1] + 0.00025, coords[1][0] + 0.0001],
    [coords[0][1] + 0.00025, coords[0][0] - 0.0001]
  ] : [];

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/70 shadow-panel">
      {/* Top Floating Controls Bar */}
      <div className="absolute left-3 right-3 top-3 z-[1000] flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/70 bg-white/90 p-2.5 shadow-lg backdrop-blur-md">
        {/* Basemap Switcher */}
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

        {/* 3 Spatial Layers Toggles */}
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
            <span className={`h-2 w-2 rounded-full ${isCourtLocked ? "bg-red-600 animate-pulse" : "bg-amber-600"}`} />
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

          <button
            type="button"
            onClick={() => setShowAiRadar(!showAiRadar)}
            className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 transition ${
              showAiRadar
                ? "border border-rose-500/40 bg-rose-50 text-rose-900 shadow-sm animate-pulse"
                : "bg-gray-100 text-gray-600 hover:bg-rose-50 hover:text-rose-800"
            }`}
          >
            <Zap size={12} className={showAiRadar ? "text-rose-600" : "text-gray-400"} />
            AI Radar
          </button>
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
                  {isCourtLocked && (
                    <p className="text-red-700 font-extrabold flex items-center gap-1">
                      <Lock size={12} />
                      🚨 Court Stay Active: Section 52 Lis Pendens
                    </p>
                  )}
                  <p className="text-amber-800 font-bold">Base Cadastral Parcel</p>
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
                    <p className="text-gray-500">CORS Accuracy: ±5cm (WGS84)</p>
                  </div>
                </Popup>
              </Circle>
            ))}
          </>
        )}

        {/* LAYER 2: ESSENTIAL GOVERNANCE & RRR */}
        {showEssentialLayer && leafletCoords.length > 0 && (
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
                  <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-800">
                    {parcel?.essentialLayers?.masterPlanZoning?.zoneCategory || "Master Plan Layer"}
                  </span>
                </div>
                <p><strong>Permissible FAR:</strong> {parcel?.essentialLayers?.masterPlanZoning?.permissibleFar || "2.0"}</p>
                <p><strong>Building Permission:</strong> {parcel?.essentialLayers?.buildingPermissions?.status || "Sanctioned"}</p>
                <p>
                  <strong>Encumbrance:</strong>{" "}
                  {parcel?.essentialLayers?.encumbrance?.hasMortgage ? "⚠️ Active Bank Lien" : "✅ Clear Title"}
                </p>
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
        {parcel?.subdivisionData?.isSubdivided && demarcationLine.length === 2 && (
          <Polyline
            positions={demarcationLine}
            pathOptions={{ color: "#dc2626", weight: 3, dashArray: "6, 6" }}
          >
            <Tooltip sticky>
              <span className="text-xs font-bold text-red-700">
                Demarcation Split Line (11E Sketch: {parcel.subdivisionData?.activeSketch?.sketchId || "Demarcated"})
              </span>
            </Tooltip>
          </Polyline>
        )}

        {/* LAYER 3: UTILITIES & WATER SUPPLY */}
        {showUseCaseLayer && (
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

        {/* AI SATELLITE RADAR */}
        {showAiRadar && hasAiAnomaly && anomalyCoords.length > 0 && (
          <Polygon
            positions={anomalyCoords}
            pathOptions={{
              color: "#e11d48",
              weight: 3,
              fillColor: "#f43f5e",
              fillOpacity: 0.55
            }}
          >
            <Popup>
              <div className="space-y-1 p-1 text-xs">
                <div className="flex items-center gap-1 font-bold text-rose-800">
                  <ShieldAlert size={14} />
                  <span>AI Encroachment Alert</span>
                </div>
                <p><strong>Confidence:</strong> {parcel?.aiGeospatial?.satelliteChangeDetection?.confidenceScorePercent}%</p>
                <p><strong>Anomaly:</strong> {parcel?.aiGeospatial?.satelliteChangeDetection?.anomalyType}</p>
                <p><strong>Excess Footprint:</strong> {parcel?.aiGeospatial?.satelliteChangeDetection?.detectedFootprintChangeSqM} m²</p>
              </div>
            </Popup>
          </Polygon>
        )}

        {/* LIVE CORS GNSS ROVER TELEMETRY PIN */}
        {liveRoverPoint && (
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

        <FitToParcel geoJson={geoJson} />
      </MapContainer>

      {/* Bottom Map Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-earth-100 bg-white/95 px-5 py-2.5 text-xs text-earth-800">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5 font-medium">
            <span className={`h-2.5 w-2.5 rounded-full ${isCourtLocked ? "bg-red-600" : "bg-amber-400"}`} />
            {isCourtLocked ? "Disputed / Locked Cadastre" : "Cadastral Boundary"}
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            Master Plan Zoning
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="h-1 w-4 bg-sky-500" />
            Water Conduits
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="h-1 w-4 bg-yellow-500" />
            11kV Grid
          </span>
          {isCourtLocked && (
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
