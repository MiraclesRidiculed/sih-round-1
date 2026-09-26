import { nationalLandExchange } from "../services/landExchange/nationalLandExchange.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const lookupNationalLandRecord = asyncHandler(async (req, res) => {
  const { parcelId, ulpin, surveyNumber } = req.query;
  const record = await nationalLandExchange.lookupLandRecord({ parcelId, ulpin, surveyNumber });

  if (!record) {
    res.status(404).json({
      error: "LAND_RECORD_NOT_FOUND",
      message: "No matching local demonstration land record was found."
    });
    return;
  }

  res.json(record);
});

export const searchNationalLandRecords = asyncHandler(async (req, res) => {
  const { ulpin, state, district, surveyNumber, owner, encumbranceStatus } = req.query;
  const items = await nationalLandExchange.searchLandRecords({
    ulpin,
    state,
    district,
    surveyNumber,
    owner,
    encumbranceStatus
  });

  res.json({
    integrationMode: "local-seed",
    authoritative: false,
    disclaimer: "Search results are normalized from local demonstration records; no government production system is connected.",
    count: items.length,
    items
  });
});
