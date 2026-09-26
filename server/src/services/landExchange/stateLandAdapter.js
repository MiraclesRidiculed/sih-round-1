export class StateLandAdapter {
  constructor({ stateCode, stateName, sourceSystems }) {
    this.stateCode = stateCode;
    this.stateName = stateName;
    this.sourceSystems = sourceSystems;
  }

  async lookupParcel() {
    throw new Error("StateLandAdapter.lookupParcel must be implemented by a concrete adapter");
  }

  async lookupOwnership() {
    throw new Error("StateLandAdapter.lookupOwnership must be implemented by a concrete adapter");
  }

  async lookupEncumbrance() {
    throw new Error("StateLandAdapter.lookupEncumbrance must be implemented by a concrete adapter");
  }

  async getMutationStatus() {
    throw new Error("StateLandAdapter.getMutationStatus must be implemented by a concrete adapter");
  }

  async getRegistrationStatus() {
    throw new Error("StateLandAdapter.getRegistrationStatus must be implemented by a concrete adapter");
  }

  async getSpatialFeature() {
    throw new Error("StateLandAdapter.getSpatialFeature must be implemented by a concrete adapter");
  }
}
