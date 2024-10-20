const { Web3 } = require("web3");
const fs = require("fs");
require("dotenv").config();

const { abi } = JSON.parse(
  fs.readFileSync("./artifacts/contracts/FundsTracker.sol/FundsTracker.json")
); // Adjust to your contract's ABI

// Initialize Web3 and contract instance
const network = process.env.NEXT_PUBLIC_ETHEREUM_NETWORK;
const web3 = new Web3(
  new Web3.providers.HttpProvider(
    `https://${network}.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY}`
  )
);
const signer = web3.eth.accounts.privateKeyToAccount(
  process.env.NEXT_PUBLIC_SIGNER_PRIVATE_KEY
);
web3.eth.accounts.wallet.add(signer);
const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const contract = new web3.eth.Contract(abi, contractAddress);

// Utility Functions

/**
 * Role Management Functions
 */
async function addUser(userAddress) {
  await contract.methods
    .addUser(userAddress)
    .send({ from: signer.address, gas: 200000 });
  console.log(`User added: ${userAddress}`);
}

async function assignRole(userAddress, role) {
  await contract.methods
    .assignRole(userAddress, web3.utils.keccak256(role))
    .send({ from: signer.address, gas: 200000 });
  console.log(`Role assigned: ${role} to user: ${userAddress}`);
}

async function revokeRole(userAddress) {
  await contract.methods
    .revokeRole(userAddress)
    .send({ from: signer.address, gas: 200000 });
  console.log(`Role revoked for user: ${userAddress}`);
}

/**
 * Project Management Functions
 */
async function createProject(
  name,
  budgetInEth,
  governmentAddress,
  description
) {
  const budgetInWei = web3.utils.toWei(budgetInEth, "ether");
  await contract.methods
    .createProject(name, budgetInWei, governmentAddress, description)
    .send({ from: signer.address, gas: 300000 });
  console.log(`Project created: ${name}`);
}

async function donateToProject(projectId, amountInEth) {
  const amountInWei = web3.utils.toWei(amountInEth, "ether");
  await contract.methods
    .donate(projectId)
    .send({ from: signer.address, value: amountInWei, gas: 200000 });
  console.log(
    `Donation of ${amountInEth} ETH made to project ID: ${projectId}`
  );
}

async function setProjectDates(projectId, startDate, endDate) {
  await contract.methods
    .setProjectDates(projectId, startDate, endDate)
    .send({ from: signer.address, gas: 200000 });
  console.log(`Project dates set for project ID: ${projectId}`);
}

async function getProject(projectId) {
  const project = await contract.methods.getProject(projectId).call();
  console.log(`Project details for ID ${projectId}:`, project);
  return project;
}

/**
 * Contractor Management Functions
 */
async function createContractor(name, description, services, walletAddress) {
  console.log("Creating contractor with the following details:", {
    name,
    description,
    services,
    walletAddress
  }); 

  // Logic for creating a contractor on the blockchain
  const result = await contract.methods.createContractor(name, description, services, walletAddress).send({ from: signer.address, gas: 300000 });
  return result;
}


async function assignContractorToProject(projectId, contractorId) {
  await contract.methods
    .assignContractor(projectId, contractorId)
    .send({ from: signer.address, gas: 200000 });
  console.log(
    `Contractor with ID ${contractorId} assigned to project ID: ${projectId}`
  );
}

async function getContractorByProjectId(contractorId) {
  const contractor = await contract.methods.getContractorByProjectId(contractorId).call();
  console.log(`Contractor details for ID ${contractorId}:`, contractor);
  return contractor;
}

/**
 * Expense Logging Functions
 */
async function logExpense(projectId, description, amountInEth) {
  const amountInWei = web3.utils.toWei(amountInEth, "ether");
  await contract.methods
    .logExpense(projectId, description, amountInWei)
    .send({ from: signer.address, gas: 200000 });
  console.log(`Expense logged for project ID: ${projectId}`);
}

async function getProjectExpenses(projectId) {
  const expenses = await contract.methods.getProjectExpenses(projectId).call();
  console.log(`Expenses for project ID ${projectId}:`, expenses);
  return expenses;
}

/**
 * Fetch All Projects
 */
async function fetchAllProjects() {
  const projects = await contract.methods.getAllProjects().call();
  return projects;
}

/**
 * Fetch All Contractors
 */
async function fetchAllContractors() {
  const contractors = await contract.methods.getAllContractors().call();
  return contractors;
}

/**
 * Payment Functions
 */
async function payContractor(projectId, contractorId, amountInEth) {
  const amountInWei = web3.utils.toWei(amountInEth, "ether");

  // Fetch the contractor's wallet address
  const contractor = await getContractor(contractorId);
  const contractorWalletAddress = contractor.walletAddress;

  // Make the payment through the smart contract
  await contract.methods
    .payContractor(projectId, contractorWalletAddress, amountInWei)
    .send({ from: signer.address, gas: 300000 });

  console.log(`Payment of ${amountInEth} ETH made to contractor ID: ${contractorId}`);
}

// Export functions if used as a module
module.exports = {
  addUser,
  assignRole,
  revokeRole,
  createProject,
  donateToProject,
  setProjectDates,
  getProject,
  createContractor,
  assignContractorToProject,
  getContractorByProjectId,
  logExpense,
  getProjectExpenses,
  payContractor,
  fetchAllProjects,
  fetchAllContractors,
};
