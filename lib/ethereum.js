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
async function createContractor(name) {
  await contract.methods
    .createContractor(name)
    .send({ from: signer.address, gas: 200000 });
  console.log(`Contractor created: ${name}`);
}

async function assignContractorToProject(projectId, contractorId) {
  await contract.methods
    .assignContractor(projectId, contractorId)
    .send({ from: signer.address, gas: 200000 });
  console.log(
    `Contractor with ID ${contractorId} assigned to project ID: ${projectId}`
  );
}

async function getContractor(contractorId) {
  const contractor = await contract.methods.getContractor(contractorId).call();
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
  const projectCount = await contract.methods.getProjectCount().call();
  const projects = [];
  for (let i = 0; i < projectCount; i++) {
    const project = await contract.methods.getProject(i).call();
    projects.push(project);
  }
  console.log("All Projects:", projects);
  return projects;
}

/**
 * Fetch All Contractors
 */
async function fetchAllContractors() {
  const contractors = [];
  const contractorCount = await contract.methods.getContractorCount().call();
  for (let i = 0; i < contractorCount; i++) {
    const contractor = await contract.methods.getContractor(i).call();
    contractors.push(contractor);
  }
  console.log("All Contractors:", contractors);
  return contractors;
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
  getContractor,
  logExpense,
  getProjectExpenses,
  fetchAllProjects,
  fetchAllContractors,
};
