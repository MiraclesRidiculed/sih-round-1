import { normalizeLandRecord } from "./canonicalLandRecord.js";
import { createStateAdapters } from "./stateAdapters.js";

export class NationalLandExchange {
  constructor(adapters = createStateAdapters()) {
    this.adapters = adapters;
  }

  async findAdapter(identifier = {}) {
    for (const adapter of this.adapters) {
      const result = await adapter.lookupParcel(identifier);
      if (result) return { adapter, result };
    }
    return null;
  }

  async lookupLandRecord(identifier = {}) {
    const match = await this.findAdapter(identifier);
    if (!match) return null;

    const { adapter, result: parcelResult } = match;
    const query = { ...identifier, parcelId: parcelResult.record.parcelId };
    const [ownershipResult, encumbranceResult, mutationResult, registrationResult, spatialResult] =
      await Promise.all([
        adapter.lookupOwnership(query),
        adapter.lookupEncumbrance(query),
        adapter.getMutationStatus(query),
        adapter.getRegistrationStatus(query),
        adapter.getSpatialFeature(query)
      ]);

    const attachAdapter = (value) => value && ({ ...value, adapter });
    return normalizeLandRecord(
      attachAdapter(parcelResult),
      attachAdapter(ownershipResult),
      attachAdapter(encumbranceResult),
      attachAdapter(mutationResult),
      attachAdapter(registrationResult),
      attachAdapter(spatialResult)
    );
  }

  async searchLandRecords(filters = {}) {
    const records = [];
    const seenParcelIds = new Set();
    for (const adapter of this.adapters) {
      const parcels = await adapter.searchRecords(filters);
      for (const parcel of parcels) {
        if (seenParcelIds.has(parcel.parcelId)) continue;
        seenParcelIds.add(parcel.parcelId);
        const canonical = await this.lookupLandRecord({ parcelId: parcel.parcelId });
        if (canonical) records.push(canonical);
      }
    }
    return records;
  }
}

export const nationalLandExchange = new NationalLandExchange();
