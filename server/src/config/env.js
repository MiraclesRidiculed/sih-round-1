import dotenv from "dotenv";

dotenv.config();

const truthy = new Set(["true", "1", "yes"]);

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
  mongodbUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/karnataka_landchain",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
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

