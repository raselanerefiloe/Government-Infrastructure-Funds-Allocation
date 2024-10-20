const readline = require("readline");
const {
  addUser,
  assignRole,
  revokeRole,
  createProject,
  donate,
  setProjectDates,
  fetchAllProjects,
  createContractor,
  assignContractor,
  getContractorByProjectId,
  payContractor,
  logExpense,
  getProjectExpenses,
  fetchAllContractors,
} = require("./ethereum"); // Adjust the path as necessary

// Initialize readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Function to ask a question and return a promise
const askQuestion = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

// Main function to display menu and execute commands
async function main() {
  try {
    let exit = false;

    while (!exit) {
      console.log("\nMenu:");
      console.log("1. Users and Roles");
      console.log("2. Projects");
      console.log("3. Contractors");
      console.log("4. Expenses");
      console.log("5. Exit");

      const choice = await askQuestion("Select an option (1-5): ");

      switch (choice) {
        case "1":
          await handleUserAndRoles();
          break;
        case "2":
          await handleProjects();
          break;
        case "3":
          await handleContractors();
          break;
        case "4":
          await handleExpenses();
          break;
        case "5":
          exit = true;
          break;
        default:
          console.log("Invalid choice. Please select a valid option.");
      }
    }

    console.log("Exiting the application...");
    rl.close();
  } catch (error) {
    console.error("Error:", error);
    rl.close();
  }
}

// Handle User and Roles options
async function handleUserAndRoles() {
  console.log("\nUsers and Roles:");
  console.log("1. Add User");
  console.log("2. Assign Role");
  console.log("3. Revoke Role");
  console.log("4. Go Back");

  const choice = await askQuestion("Select an option (1-4): ");

  switch (choice) {
    case "1":
      const userAddress = await askQuestion("Enter user address: ");
      await addUser(userAddress);
      console.log(`User added: ${userAddress}`);
      break;
    case "2":
      const addressToAssign = await askQuestion("Enter user address to assign role: ");
      const roleToAssign = await askQuestion("Enter role to assign (e.g., 'manager', 'user'): ");
      await assignRole(addressToAssign, roleToAssign);
      console.log(`Role ${roleToAssign} assigned to user: ${addressToAssign}`);
      break;
    case "3":
      const addressToRevoke = await askQuestion("Enter user address to revoke role: ");
      await revokeRole(addressToRevoke);
      console.log(`Role revoked for user: ${addressToRevoke}`);
      break;
    case "4":
      return; // Go back to the main menu
    default:
      console.log("Invalid choice. Please select a valid option.");
  }
}

// Handle Projects options
async function handleProjects() {
  console.log("\nProjects:");
  console.log("1. Create Project");
  console.log("2. Fetch All Projects");
  console.log("3. Set Project Dates");
  console.log("4. Fund Project");
  console.log("5. Go Back");

  const choice = await askQuestion("Select an option (1-5): ");

  switch (choice) {
    case "1":
      const projectName = await askQuestion("Enter project name: ");
      const budgetInEth = await askQuestion("Enter budget in ETH: ");
      const governmentAddress = await askQuestion("Enter government address: ");
      const projectDescription = await askQuestion("Enter project description: ");
      await createProject(projectName, budgetInEth, governmentAddress, projectDescription);
      console.log(`Project created: ${projectName}`);
      break;
    case "2":
      const projects = await fetchAllProjects();
      console.log("Fetched Projects:", projects);
      break;
    case "3":
      const projectId = await askQuestion("Enter project ID: ");
      const startDate = await askQuestion("Enter start date (timestamp): ");
      const endDate = await askQuestion("Enter end date (timestamp): ");
      await setProjectDates(projectId, startDate, endDate);
      console.log("Project dates set successfully.");
      break;
    case "4":
      const projectIdToFund = await askQuestion("Enter project ID to fund: ");
      const donationAmount = await askQuestion("Enter donation amount in ETH: ");
      await donate(projectIdToFund, { value: ethers.utils.parseEther(donationAmount) });
      console.log("Donation made successfully.");
      break;
    case "5":
      return; // Go back to the main menu
    default:
      console.log("Invalid choice. Please select a valid option.");
  }
}

// Handle Contractors options
async function handleContractors() {
  console.log("\nContractors:");
  console.log("1. Create Contractor");
  console.log("2. Fetch All Contractors");
  console.log("3. Assign Contractor to Project");
  console.log("4. Pay Contractor");
  console.log("5. Go Back");

  const choice = await askQuestion("Select an option (1-5): ");

  switch (choice) {
    case "1":
      const contractorName = await askQuestion("Enter contractor name: ");
      const contractorDescription = await askQuestion("Enter contractor description: ");
      const contractorServices = await askQuestion("Enter contractor services: ");
      const walletAddress = await askQuestion("Enter contractor wallet address: ");
      await createContractor(contractorName, contractorServices, contractorDescription, walletAddress);
      console.log(`Contractor created: ${contractorName}`);
      break;
    case "2":
      const contractors = await fetchAllContractors();
      console.log("Fetched Contractors:", contractors);
      break;
    case "3":
      const projectIdToAssign = await askQuestion("Enter project ID to assign contractor: ");
      const contractorIdToAssign = await askQuestion("Enter contractor ID to assign: ");
      await assignContractor(projectIdToAssign, contractorIdToAssign);
      console.log("Contractor assigned to project successfully.");
      break;
    case "4":
      const projectIdToPay = await askQuestion("Enter project ID to pay contractor: ");
      const contractorIdToPay = await askQuestion("Enter contractor ID to pay: ");
      const paymentAmount = await askQuestion("Enter payment amount in ETH: ");
      await payContractor(projectIdToPay, contractorIdToPay, paymentAmount);
      console.log("Payment made to contractor successfully.");
      break;
    case "5":
      return; // Go back to the main menu
    default:
      console.log("Invalid choice. Please select a valid option.");
  }
}

// Handle Expenses options
async function handleExpenses() {
  console.log("\nExpenses:");
  console.log("1. Log Expense");
  console.log("2. Fetch Project Expenses");
  console.log("3. Go Back");

  const choice = await askQuestion("Select an option (1-3): ");

  switch (choice) {
    case "1":
      const projectIdForExpense = await askQuestion("Enter project ID for expense: ");
      const expenseDescription = await askQuestion("Enter expense description: ");
      const expenseAmount = await askQuestion("Enter expense amount in ETH: ");
      const itemQuantity = await askQuestion("Enter item quantity: ");
      const walletAddressForExpense = await askQuestion("Enter wallet address for expense: ");
      await logExpense(projectIdForExpense, expenseDescription, expenseAmount, itemQuantity, walletAddressForExpense);
      console.log("Expense logged successfully.");
      break;
    case "2":
      const projectIdForFetch = await askQuestion("Enter project ID to fetch expenses: ");
      const expenses = await getProjectExpenses(projectIdForFetch);
      console.log("Fetched Expenses:", expenses);
      break;
    case "3":
      return; // Go back to the main menu
    default:
      console.log("Invalid choice. Please select a valid option.");
  }
}

// Run the main function
main();
