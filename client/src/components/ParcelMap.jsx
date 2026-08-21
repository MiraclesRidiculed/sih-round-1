import { useEffect } from "react";
import L from "leaflet";
import { GeoJSON, MapContainer, TileLayer, useMap } from "react-leaflet";

const FitToParcel = ({ geoJson }) => {
  const map = useMap();

  useEffect(() => {
    const bounds = L.geoJSON(geoJson).getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [geoJson, map]);

  return null;
};

const ParcelMap = ({ geoJson }) => (
  <div className="overflow-hidden rounded-[2rem] border border-white/70 shadow-panel">
    <MapContainer className="h-[360px] w-full" center={[13.0, 77.6]} zoom={13} scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <GeoJSON
        data={geoJson}
        style={() => ({
          color: "#8a672d",
          weight: 2,
          fillColor: "#5ea46f",
          fillOpacity: 0.35
        })}
      />
      <FitToParcel geoJson={geoJson} />
    </MapContainer>
  </div>
);

export default ParcelMap;
