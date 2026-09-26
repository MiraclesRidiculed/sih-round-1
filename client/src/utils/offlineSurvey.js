const STORAGE_KEY = "landstack_offline_survey_cache";

export const getCachedSurveys = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveSurveyOffline = (surveyRecord) => {
  const existing = getCachedSurveys();
  const updated = [
    {
      ...surveyRecord,
      savedOfflineAt: new Date().toISOString(),
      offlineId: `OFFLINE-${Date.now()}`
    },
    ...existing
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const exportSurveyWorkPackage = (surveyRecord) => {
  const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
    JSON.stringify(
      {
        format: "LandStack-CORS-GNSS-WorkPackage",
        version: "2026.1",
        exportTimestamp: new Date().toISOString(),
        surveyData: surveyRecord
      },
      null,
      2
    )
  )}`;
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", jsonString);
  downloadAnchor.setAttribute("download", `survey_11E_${surveyRecord.sketchId || "export"}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};
