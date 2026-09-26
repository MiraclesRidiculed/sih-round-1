import { GenericStateAdapter } from "./genericStateAdapter.js";

export class KarnatakaAdapter extends GenericStateAdapter {
  constructor() {
    super({
      stateCode: "KA",
      stateName: "Karnataka",
      sourceSystems: ["Bhoomi-style RTC demo records", "Kaveri-style registration demo records"]
    });
  }
}

export class TamilNaduAdapter extends GenericStateAdapter {
  constructor() {
    super({
      stateCode: "TN",
      stateName: "Tamil Nadu",
      sourceSystems: ["Tamil Nilam-style RoR demo records", "TNREGINET-style registration demo records"]
    });
  }
}

export class ChandigarhAdapter extends GenericStateAdapter {
  constructor() {
    super({
      stateCode: "CHD",
      stateName: "Chandigarh (UT)",
      sourceSystems: ["Local Estate Register demo records", "Sub-Registrar demo records"]
    });
  }
}

export const createStateAdapters = () => [
  new KarnatakaAdapter(),
  new TamilNaduAdapter(),
  new ChandigarhAdapter(),
  new GenericStateAdapter()
];
