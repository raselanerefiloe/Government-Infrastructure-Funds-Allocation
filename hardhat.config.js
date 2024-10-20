require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();

const { NEXT_PUBLIC_INFURA_API_KEY, NEXT_PUBLIC_SIGNER_PRIVATE_KEY } = process.env;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.27",
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${NEXT_PUBLIC_INFURA_API_KEY}`,
      accounts: [`${NEXT_PUBLIC_SIGNER_PRIVATE_KEY}`],
    },
    // You can add other networks here
  },
};
