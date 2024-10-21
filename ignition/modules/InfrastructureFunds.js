// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
require("dotenv").config();

module.exports = buildModule("InfrastructureFundsModule", (m) => {
  const governmentAddress = process.env.NEXT_PUBLIC_GOVERNMENT_ADDRESS;

  const fundsTracker = m.contract("InfrastructureFunds", [governmentAddress]);
  return { fundsTracker };
});
