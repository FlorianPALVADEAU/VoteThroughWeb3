import hre from "hardhat";

async function main() {
    const Voting = await hre.ethers.getContractFactory("Voting");
    const voteInstance = await Voting.deploy();

    await voteInstance.waitForDeployment();
    const [owner] = await hre.ethers.getSigners();
    console.log("Deploying contract with address: ", owner.address);

    const contractAddress = await voteInstance.getAddress();
    console.log("Contract Deployed to Address:", contractAddress);
  }
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });