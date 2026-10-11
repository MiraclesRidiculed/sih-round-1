import { createHmac } from "node:crypto";
import { env } from "../config/env.js";

export const deriveDemoUserPassword = (email) => {
  if (Buffer.byteLength(env.demoSeedPassword, "utf8") < 32) {
    throw new Error("DEMO_SEED_PASSWORD must be configured with at least 32 bytes of secret material.");
  }
  return createHmac("sha256", env.demoSeedPassword)
    .update(String(email).trim().toLowerCase())
    .digest("base64url");
};
