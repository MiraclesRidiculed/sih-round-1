const selectImageryMetadata = (metadata = {}) => {
  const fields = [
    "provider",
    "collection",
    "imageId",
    "acquiredAt",
    "resolutionMeters",
    "bands",
    "referenceImageId",
    "referenceAcquiredAt"
  ];
  return Object.fromEntries(fields.flatMap((field) => {
    const value = metadata[field];
    if (
      typeof value === "string" ||
      typeof value === "boolean" ||
      (typeof value === "number" && Number.isFinite(value))
    ) {
      return value === "" ? [] : [[field, value]];
    }
    if (Array.isArray(value) && value.every((item) =>
      typeof item === "string" ||
      typeof item === "boolean" ||
      (typeof item === "number" && Number.isFinite(item))
    )) {
      return [[field, value]];
    }
    return [];
  }));
};

export const createRemoteSensingChangeDetection = (parcel) => {
  const detection = parcel.aiGeospatial?.satelliteChangeDetection || {};
  const imageryMetadata = selectImageryMetadata(
    detection.sourceImagery || detection.imageryMetadata
  );

  return {
    status: detection.anomalyDetected === true
      ? "change-detected"
      : Object.keys(detection).length
        ? "no-change-recorded"
        : "unavailable",
    analysisMode: "simulated",
    detectedChange: detection.anomalyDetected === true
      ? detection.anomalyType || "Change recorded; classification unavailable"
      : null,
    detectionDate: detection.detectionDate || detection.lastSatellitePassDate || null,
    referenceDate: detection.historicalReferenceDate || null,
    confidencePercent: Number.isFinite(detection.confidenceScorePercent) &&
      detection.confidenceScorePercent >= 0 &&
      detection.confidenceScorePercent <= 100
      ? detection.confidenceScorePercent
      : null,
    affectedParcel: {
      parcelId: parcel.parcelId || null,
      ulpin: parcel.ulpin || null,
      surveyNumber: parcel.surveyNumber || null
    },
    changeAreaSqM: Number.isFinite(detection.detectedFootprintChangeSqM) &&
      detection.detectedFootprintChangeSqM >= 0
      ? detection.detectedFootprintChangeSqM
      : null,
    sourceImagery: Object.keys(imageryMetadata).length ? imageryMetadata : null,
    source: {
      mode: "simulated",
      authoritative: false,
      realTime: false,
      disclaimer: "Prototype demonstration only. No real satellite imagery or remote-sensing provider is connected."
    }
  };
};
