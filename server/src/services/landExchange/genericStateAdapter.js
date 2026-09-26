import { Parcel } from "../../models/Parcel.js";
import { StateLandAdapter } from "./stateLandAdapter.js";

const lookupFilter = ({ parcelId, ulpin, surveyNumber } = {}) => {
  if (parcelId) return { parcelId };
  if (ulpin) return { ulpin };
  if (surveyNumber) return { surveyNumber };
  return null;
};

export class GenericStateAdapter extends StateLandAdapter {
  constructor(options = {}) {
    super({
      stateCode: options.stateCode || "GEN",
      stateName: options.stateName || "Unspecified State",
      sourceSystems: options.sourceSystems || ["Local seeded parcel records"]
    });
  }

  async findRecord(identifier = {}) {
    const filter = lookupFilter(identifier);
    if (!filter) return null;

    const parcel = await Parcel.findOne(filter).lean();
    if (!parcel || (parcel.state !== this.stateName && this.stateCode !== "GEN")) return null;
    return parcel;
  }

  async searchRecords(filters = {}) {
    const query = {};
    if (filters.ulpin) query.ulpin = filters.ulpin;
    if (filters.state && this.stateCode === "GEN") query.state = filters.state;
    if (filters.state && this.stateCode !== "GEN" && filters.state !== this.stateName) return [];
    if (filters.district) query.district = new RegExp(filters.district, "i");
    if (filters.surveyNumber) query.surveyNumber = new RegExp(filters.surveyNumber, "i");
    if (filters.owner) query["currentOwners.name"] = new RegExp(filters.owner, "i");
    if (filters.encumbranceStatus) {
      query["authoritativeRecords.encumbranceStatus"] = new RegExp(filters.encumbranceStatus, "i");
    }

    const records = await Parcel.find(query).sort({ state: 1, district: 1, parcelId: 1 }).limit(100).lean();
    return records.filter((parcel) => this.stateCode === "GEN" || parcel.state === this.stateName);
  }

  sourceMetadata(parcel) {
    return {
      stateCode: this.stateCode,
      stateName: parcel.state || this.stateName,
      sourceSystems: this.sourceSystems,
      integrationMode: "local-seed",
      authoritative: false,
      disclaimer: "Local seeded demonstration data only; no government production system is connected."
    };
  }

  async lookupParcel(identifier) {
    const parcel = await this.findRecord(identifier);
    if (!parcel) return null;
    return { source: this.sourceMetadata(parcel), record: parcel };
  }

  async lookupOwnership(identifier) {
    const result = await this.lookupParcel(identifier);
    return result ? { ...result, record: { currentOwners: result.record.currentOwners || [] } } : null;
  }

  async lookupEncumbrance(identifier) {
    const result = await this.lookupParcel(identifier);
    if (!result) return null;
    return {
      ...result,
      record: {
        encumbrance: result.record.essentialLayers?.encumbrance || {},
        authoritativeEncumbranceStatus: result.record.authoritativeRecords?.encumbranceStatus || ""
      }
    };
  }

  async getMutationStatus(identifier) {
    const result = await this.lookupParcel(identifier);
    if (!result) return null;
    return {
      ...result,
      record: {
        mutationNumber: result.record.authoritativeRecords?.mutationNumber || "",
        mutationStatus: result.record.authoritativeRecords?.mutationStatus || ""
      }
    };
  }

  async getRegistrationStatus(identifier) {
    const result = await this.lookupParcel(identifier);
    if (!result) return null;
    return {
      ...result,
      record: {
        registrationReference: result.record.authoritativeRecords?.registrationReference || "",
        registrationDate: result.record.authoritativeRecords?.registrationDate || "",
        registration: result.record.essentialLayers?.registration || {}
      }
    };
  }

  async getSpatialFeature(identifier) {
    const result = await this.lookupParcel(identifier);
    if (!result) return null;
    return {
      ...result,
      record: {
        type: "Feature",
        geometry: result.record.geoJson?.geometry || null,
        properties: {
          parcelId: result.record.parcelId,
          ulpin: result.record.ulpin || "",
          surveyNumber: result.record.surveyNumber,
          state: result.record.state,
          district: result.record.district,
          village: result.record.village
        }
      }
    };
  }
}
