// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
require("dotenv").config();

module.exports = buildModule("InfrastructureFundsModule", (m) => {

  const fundsTracker = m.contract("InfrastructureFunds");
  return { fundsTracker };
});
