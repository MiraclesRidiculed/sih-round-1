export const fetchSurveySnapshot = async (parcel) => ({
  authorityLabel: "Karnataka Survey Demo Adapter",
  integrationMode: "demo",
  authoritative: false,
  disclaimer:
    "Cadastral geometry in this MVP is demo GeoJSON representing a 2D Karnataka land parcel only.",
  surveySketchRef: parcel.authoritativeRecords.surveySketchRef,
  polygonType: parcel.geoJson.geometry.type,
  vertexCount: parcel.geoJson.geometry.coordinates[0]?.length || 0,
  areaInAcres: parcel.areaInAcres,
  district: parcel.district,
  taluk: parcel.taluk,
  hobli: parcel.hobli,
  village: parcel.village
});

