const hre = require("hardhat");

async function main() {
  const factory = await hre.ethers.getContractFactory("KarnatakaLandAudit");
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();

  console.log("KarnatakaLandAudit deployed");
  console.log(`Address: ${contractAddress}`);
  console.log(`Network: ${hre.network.name}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

