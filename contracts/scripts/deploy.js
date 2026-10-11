import { network } from "hardhat";

async function main() {
  const connection = await network.create();
  try {
    const contract = await connection.ethers.deployContract("KarnatakaLandAudit");
    await contract.waitForDeployment();

    const contractAddress = await contract.getAddress();

    console.log("KarnatakaLandAudit deployed");
    console.log(`Address: ${contractAddress}`);
    console.log(`Network: ${connection.networkName}`);
  } finally {
    await connection.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
