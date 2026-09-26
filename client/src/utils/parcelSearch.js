export const normalizeParcelSearchTerm = (value) => String(value ?? "").trim();

export const findExactParcelSearchMatch = (parcels = [], value) => {
  const query = normalizeParcelSearchTerm(value).toLowerCase();
  if (!query || !Array.isArray(parcels)) return null;

  const exactMatch = (field) => parcels.find(
    (parcel) => String(parcel?.[field] ?? "").trim().toLowerCase() === query
  );

  return exactMatch("ulpin") || exactMatch("parcelId") || exactMatch("surveyNumber") || null;
};
