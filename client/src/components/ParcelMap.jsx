import { useEffect, useState } from "react";
import L from "leaflet";
import { Circle, GeoJSON, MapContainer, Marker, Polygon, Polyline, Popup, TileLayer, Tooltip, useMap } from "react-leaflet";
import { Check, Eye, Layers, MapPin, Satellite, ShieldAlert, Zap } from "lucide-react";

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
  const geoJson = propGeoJson || parcel?.geoJson;

  // Active layers state (The 3 Layers of Land Stack + AI)
  const [showBaseLayer, setShowBaseLayer] = useState(true);
  const [showEssentialLayer, setShowEssentialLayer] = useState(true);
  const [showUseCaseLayer, setShowUseCaseLayer] = useState(true);
  const [showAiRadar, setShowAiRadar] = useState(false);
  const [basemapType, setBasemapType] = useState("satellite"); // "satellite" or "topo"

  // Derive center and coordinates
  const coords = geoJson?.geometry?.coordinates?.[0] || [];
  const centerLat = coords.length ? coords.reduce((acc, c) => acc + c[1], 0) / coords.length : 13.0;
  const centerLng = coords.length ? coords.reduce((acc, c) => acc + c[0], 0) / coords.length : 77.6;
  const leafletCoords = coords.map((c) => [c[1], c[0]]);

  // Synthesize utility pipelines passing along boundary
  const waterPipelineCoords = coords.length > 2 ? [
    [coords[0][1] + 0.0003, coords[0][0] - 0.0008],
    [coords[0][1] + 0.0003, coords[1][0] + 0.0008]
  ] : [];

  const powerGridCoords = coords.length > 3 ? [
    [coords[3][1] - 0.0004, coords[3][0] - 0.0006],
    [coords[2][1] - 0.0004, coords[2][0] + 0.0006]
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
                ? "border border-amber-500/40 bg-amber-50 text-amber-900 shadow-sm"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-amber-600" />
            Layer 1: Base Cadastral & ULPIN
            {showBaseLayer && <Check size={12} className="text-amber-700" />}
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
            Layer 2: Essential (RRR / Zoning)
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
            AI Encroachment Radar
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
                color: "#f59e0b",
                weight: 3,
                fillColor: "#f59e0b",
                fillOpacity: showEssentialLayer ? 0.15 : 0.45,
                dashArray: "6, 4"
              }}
            >
              <Tooltip sticky>
                <div className="text-xs font-semibold">
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
                pathOptions={{ color: "#ffffff", fillColor: "#d97706", fillOpacity: 1, weight: 2 }}
              >
                <Popup>
                  <div className="text-xs">
                    <p className="font-bold text-amber-800">Cadastral Vertex #{idx + 1}</p>
                    <p className="font-mono text-[11px]">Lat: {coord[0].toFixed(6)}</p>
                    <p className="font-mono text-[11px]">Lng: {coord[1].toFixed(6)}</p>
                    <p className="text-gray-500">CORS Accuracy: ±5cm</p>
                  </div>
                </Popup>
              </Circle>
            ))}
          </>
        )}

        {/* LAYER 2: ESSENTIAL GOVERNANCE & RRR (Zoning + Building Footprint) */}
        {showEssentialLayer && leafletCoords.length > 0 && (
          <Polygon
            positions={leafletCoords}
            pathOptions={{
              color: parcel?.geoJson?.properties?.zoningColor || "#3b82f6",
              weight: 2,
              fillColor: parcel?.geoJson?.properties?.zoningColor || "#3b82f6",
              fillOpacity: 0.35
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
                <p><strong>Encumbrance:</strong> {parcel?.essentialLayers?.encumbrance?.hasMortgage ? "⚠️ Active Bank Lien" : "✅ Clear Title"}</p>
                <p className="text-[11px] text-gray-600">Rights: {parcel?.essentialLayers?.rrrSummary?.rights?.[0] || "Freehold"}</p>
              </div>
            </Popup>
          </Polygon>
        )}

        {/* LAYER 3: USE-CASE LAYERS (Utilities & Environmental Buffer) */}
        {showUseCaseLayer && (
          <>
            {/* Water Supply Line */}
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

            {/* 11kV Power Line */}
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

            {/* 30m Environmental / Lake Buffer Zone (if applicable) */}
            {parcel?.additionalLayers?.restrictionZones?.isEcoSensitive && (
              <Circle
                center={[centerLat, centerLng]}
                radius={75}
                pathOptions={{
                  color: "#059669",
                  fillColor: "#10b981",
                  fillOpacity: 0.15,
                  weight: 1,
                  dashArray: "5, 5"
                }}
              >
                <Tooltip sticky>
                  <span className="text-xs font-semibold text-emerald-800">
                    🌿 75m Lake Eco-Monitoring Buffer Zone
                  </span>
                </Tooltip>
              </Circle>
            )}
          </>
        )}

        {/* AI SATELLITE ENCROACHMENT RADAR */}
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
                <p className="text-[11px] text-gray-600">{parcel?.aiGeospatial?.satelliteChangeDetection?.aiRecommendation}</p>
              </div>
            </Popup>
          </Polygon>
        )}

        <FitToParcel geoJson={geoJson} />
      </MapContainer>

      {/* Bottom Map Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-earth-100 bg-white/95 px-5 py-2.5 text-xs text-earth-800">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="h-2.5 w-2.5 rounded-full border border-amber-600 bg-amber-400" />
            Cadastral Boundary
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
            Master Plan Zoning
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="h-1 w-4 bg-sky-500" />
            Water Network
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="h-1 w-4 bg-yellow-500" />
            11kV Grid
          </span>
          {hasAiAnomaly && (
            <span className="flex items-center gap-1.5 font-bold text-rose-700">
              <span className="h-2.5 w-2.5 animate-ping rounded-full bg-rose-500" />
              AI Encroachment Alert
            </span>
          )}
        </div>

        <div className="text-[11px] text-earth-600">
          CRS: <span className="font-mono font-semibold">EPSG:4326</span> • OGC WFS/GeoJSON Compliant
        </div>
      </div>
    </div>
  );
};

export default ParcelMap;
