const { Web3 } = require("web3");
const fs = require("fs");
require("dotenv").config();

const { abi } = JSON.parse(fs.readFileSync("./artifacts/contracts/FundsTracker.sol/FundsTracker.json")); // Adjust to your contract's ABI

async function main() {
    try {
        // Connect to the Ethereum network
        const network = process.env.NEXT_PUBLIC_ETHEREUM_NETWORK;
        const web3 = new Web3(
            new Web3.providers.HttpProvider(
                `https://${network}.infura.io/v3/${process.env.NEXT_PUBLIC_INFURA_API_KEY}`
            )
        );

        // Create a signing account using the private key
        const signer = web3.eth.accounts.privateKeyToAccount(
            process.env.NEXT_PUBLIC_SIGNER_PRIVATE_KEY
        );
        web3.eth.accounts.wallet.add(signer);

        // Load the deployed contract instance using its ABI and address
        const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS; 
        const contract = new web3.eth.Contract(abi, contractAddress);

        // Call the 'createProject' function
        const projectName = "Dam Construction - Ha Mphele";
        const projectBudget = web3.utils.toWei("0.000012", "ether"); // Example budget in Wei
        // Load Government Address
        const governmentAddress = process.env.NEXT_PUBLIC_GOVERNMENT_ADDRESS;
        const description = "The Ministry of Agriculture Lesotho, is planning to construct a dam for farmers around Ha Mphele Berea"; // Use the signer address as the project owner

        const receipt = await contract.methods.createProject(projectName, projectBudget, governmentAddress, description).send({
            from: signer.address,
            gas: 300000, // Adjust gas limit as needed
        });

        console.log("Project created successfully!");
        console.log(`Transaction hash: ${receipt.transactionHash}`);

        // Fetch and log all projects
        await fetchAllProjects(contract);

    } catch (error) {
        console.error("An error occurred while interacting with the contract:", error);
    }

}

// Function to fetch all projects
const fetchAllProjects = async (contract) => {
    try {
        const projectCount = await contract.methods.getProjectCount().call(); // Get the number of projects
        const projects = []; // Initialize an array to hold project details

        for (let i = 0; i < projectCount; i++) {
            const project = await contract.methods.getProject(i).call(); // Fetch each project
            projects.push(project); // Add project details to the array
        }

        console.log("All Projects:", projects); // Log all projects
        return projects; // Return the projects array if needed
    } catch (error) {
        console.error("An error occurred while fetching projects:", error);
    }
};

main();
