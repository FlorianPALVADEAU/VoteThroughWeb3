import hre from "hardhat";

async function main() {
    const Vote = await hre.ethers.getContractFactory("Voting");
    const voteInstance = await Vote.deploy();

    await voteInstance.waitForDeployment();
    const [owner] = await hre.ethers.getSigners();
    console.log("Deploying contract with address: ", owner.address);

    const contractAddress = await safeInstance.getAddress();
    console.log("Safe contract deployed at address:", contractAddress);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
}
);