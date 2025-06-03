require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      url: "https://sepolia.infura.io/v3/8c959fc873b34ff390f409ccc3329e8a",
      accounts: ["621578d6c43c26d0dd7c074b4b7652fea699a6b3a719e45995310c3f504efb67"],
    }
  }
};
