import "dotenv/config";
import { defineConfig } from "hardhat/config";
import hardhatEthers from "@nomicfoundation/hardhat-ethers";

const { SEPOLIA_RPC_URL, DEPLOYER_PRIVATE_KEY } = process.env;
const networks = {
  default: {
    type: "edr-simulated",
    chainType: "l1"
  }
};

if (SEPOLIA_RPC_URL) {
  networks.sepolia = {
    type: "http",
    chainType: "l1",
    url: SEPOLIA_RPC_URL,
    accounts: DEPLOYER_PRIVATE_KEY ? [DEPLOYER_PRIVATE_KEY] : []
  };
}

export default defineConfig({
  plugins: [hardhatEthers],
  solidity: "0.8.24",
  networks: {
    ...networks
  }
});
