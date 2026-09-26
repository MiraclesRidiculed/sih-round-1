import dotenv from "dotenv";

dotenv.config();

const truthy = new Set(["true", "1", "yes"]);

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
  mongodbUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/karnataka_landchain",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  clientOrigins: (process.env.CLIENT_ORIGINS || "").split(",").map((origin) => origin.trim()).filter(Boolean),
  cookieSameSite: (process.env.COOKIE_SAME_SITE || "lax").toLowerCase(),
  jwtSecret: process.env.JWT_SECRET || "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  demoSeedPassword: process.env.DEMO_SEED_PASSWORD || "",
  sepoliaRpcUrl: process.env.SEPOLIA_RPC_URL || "",
  landAuditContractAddress: process.env.LAND_AUDIT_CONTRACT_ADDRESS || "",
  blockchainPrivateKey: process.env.BLOCKCHAIN_PRIVATE_KEY || "",
  blockchainEnabled:
    truthy.has(String(process.env.BLOCKCHAIN_ENABLED || "")) ||
    Boolean(
      process.env.SEPOLIA_RPC_URL &&
        process.env.LAND_AUDIT_CONTRACT_ADDRESS &&
        process.env.BLOCKCHAIN_PRIVATE_KEY
    )
};

export const validateSecurityConfiguration = (configuration = env) => {
  if (Buffer.byteLength(configuration.jwtSecret, "utf8") < 32) {
    throw new Error("JWT_SECRET must be configured with at least 32 bytes of secret material.");
  }
  if (!["strict", "lax", "none"].includes(configuration.cookieSameSite)) {
    throw new Error("COOKIE_SAME_SITE must be one of: strict, lax, none.");
  }
  const expiry = /^([1-9]\d*)(s|m|h|d)$/.exec(configuration.jwtExpiresIn);
  const secondsPerUnit = { s: 1, m: 60, h: 3600, d: 86400 };
  const expirySeconds = expiry ? Number(expiry[1]) * secondsPerUnit[expiry[2]] : NaN;
  if (!Number.isSafeInteger(expirySeconds) || expirySeconds < 60 || expirySeconds > 7 * 86400) {
    throw new Error("JWT_EXPIRES_IN must be between 60 seconds and 7 days (for example, 15m or 7d).");
  }
};
