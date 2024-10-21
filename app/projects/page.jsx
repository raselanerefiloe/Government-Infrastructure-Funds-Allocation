"use client";
import React, { useEffect, useState } from "react";
import { Web3 } from "web3"; 
import FundsTrackerABI from "../../artifacts/contracts/InfrastructureFunds.sol/InfrastructureFunds.json";
import { isAddress } from "web3-validator";
import convertWeiToEther from "@/utils/ConvertWeiToEther";
import Link from "next/link";
import Loader from "@/components/Loader"; // Import the Loader component
import { addProjectToAppwriteCollection } from '../appwrite'

const Projects = () => {
  const [account, setAccount] = useState("");
  const [projects, setProjects] = useState([]);
  const [projectName, setProjectName] = useState("");
  const [projectBudget, setProjectBudget] = useState("");
  const [projectDescription, setProjectDescription] = useState(""); 
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(true); // Loading state
  const [network, setNetwork] = useState("");

  useEffect(() => {
    const initWeb3 = async () => {
      try {
        console.log("Initializing Web3...");

        const network = process.env.NEXT_PUBLIC_ETHEREUM_NETWORK; // Accessing from environment
        const infuraApiKey = process.env.NEXT_PUBLIC_INFURA_API_KEY; // Accessing from environment
        const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS; // Accessing from environment

        console.log("Network:", network);
        console.log("Infura API Key:", infuraApiKey);
        console.log("Contract Address:", contractAddress);

        if (!contractAddress) {
          console.error("Contract address is missing. Please check your .env file.");
          return;
        }

        // Initialize Web3 with Infura provider
        const web3 = new Web3(
          new Web3.providers.HttpProvider(
            `https://${network}.infura.io/v3/${infuraApiKey}`
          )
        );
        console.log("Web3 initialized with Infura provider.");

        // Check if Web3 is injected by the browser (MetaMask)
        if (window.ethereum) {
          window.web3 = new Web3(window.ethereum);
          await window.ethereum.request({ method: "eth_requestAccounts" });

          // Fetch accounts from MetaMask
          const accounts = await window.web3.eth.getAccounts();

          if (accounts.length === 0) {
            console.error("No accounts found. Please connect to MetaMask.");
            alert("No accounts found. Please connect to MetaMask.");
            return;
          }

          // Use the first account as the current account
          setAccount(accounts[0]);
          console.log("Accounts fetched from MetaMask:", accounts);
        } else {
          console.error("MetaMask is not installed. Please install it to use this app.");
          alert("MetaMask is not installed. Please install it to use this app.");
        }

        // Create the contract instance with the ABI and address from the environment variable
        const instance = new web3.eth.Contract(FundsTrackerABI.abi, contractAddress);
        console.log("Smart contract instance created:", instance);

        setContract(instance);
        await fetchProjects(instance); // Pass the contract to fetch projects

        setNetwork(network);
      } catch (error) {
        console.error("Error initializing Web3 with Infura:", error);
      }
    };

    initWeb3();
  }, []);

  const fetchProjects = async (contractInstance) => {
    if (contractInstance) {
      setLoading(true); // Set loading to true before fetching
      try {
        console.log("Fetching projects...");
        const projects = await contractInstance.methods.getAllProjects().call();
        
        console.log("All projects fetched:", projects);
        setProjects(projects);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false); // Set loading to false after fetching
      }
    } else {
      console.warn("Contract instance is not defined. Cannot fetch projects.");
    }
  };

  const createProject = async () => {
    try {
      if (!projectName || !projectBudget) {
        alert("Please enter a valid project name and budget.");
        return;
      }

      const web3 = new Web3(window.ethereum); // Use MetaMask's provider
      const budgetInWei = web3.utils.toWei(projectBudget, "ether"); // Convert budget to Wei

      if (!account) {
        alert("Account not found. Please connect to MetaMask.");
        return;
      }
      // Request accounts access from MetaMask
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    const userAccount = accounts[0];

    // Load the deployed contract instance using its ABI and address
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    const contract = new web3.eth.Contract(FundsTrackerABI.abi, contractAddress);

    // Interact with the contract to create the project
    const transactionReceipt = await contract.methods.createProject(projectName).send({
      from: userAccount, // Use the user's MetaMask account
      value: budgetInWei, // Budget in Wei must be included in the transaction
      gas: 300000,
    });
    console.log("TranscactionReceipt: ", transactionReceipt)
    // Get the project ID from the transaction receipt (optional if the ID is available from contract events)
    const projectId = transactionReceipt.events.ProjectCreated.returnValues.projectId;
    console.log("Project created on blockchain with ID:", projectId);

    // Now, add the project to the Appwrite collection
    await addProjectToAppwriteCollection(projectName, projectDescription, projectId);


      alert("Project created successfully!");
      setProjectName(""); // Reset form fields after successful creation
      setProjectBudget("");
      setProjectDescription("");
      fetchProjects(contract); // Refresh project list
    } catch (error) {
      console.error("Error creating project:", error);
      alert("Failed to create project. Please check the console for more details.");
    }
  };

  const fundProject = async (projectId) => {
    try {
      // Prompt the user for the donation amount in Ether
      const donationAmount = prompt("Enter donation amount in Ether:");

      // Validate the donation amount input
      if (!donationAmount || isNaN(donationAmount) || parseFloat(donationAmount) <= 0) {
        alert("Please enter a valid donation amount.");
        return;
      }

      // Check if the browser has a web3 provider (like MetaMask)
      if (typeof window.ethereum === "undefined") {
        alert("Please install MetaMask or another Ethereum wallet to proceed.");
        return;
      }

      // Request access to the user's Ethereum accounts
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const web3 = new Web3(window.ethereum);

      // Get the current user's account
      const accounts = await web3.eth.getAccounts();
      const userAccount = accounts[0];

      // Validate the user's account address
      if (!isAddress(userAccount)) {
        alert("Invalid account address.");
        return;
      }

      // Load the deployed contract instance using its ABI and address
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
      const contract = new web3.eth.Contract(FundsTrackerABI.abi, contractAddress);

      // Convert the donation amount from Ether to Wei
      const donationAmountInWei = web3.utils.toWei(donationAmount, "ether");

      // Send the donation transaction from the user's account
      await contract.methods.donate(projectId).send({
        from: userAccount,
        value: donationAmountInWei,
        gas: 300000,
      });

      alert("Donation successful!");
      fetchProjects(contract); // Refresh projects after donation
    } catch (error) {
      if (error.message.includes("User denied transaction signature")) {
        alert("Transaction denied by user.");
      } else {
        console.error("Error making a donation:", error);
        alert("Failed to make a donation. Please try again.");
      }
    }
  };

  // Show loader if loading state is true
  if (loading) {
    return <Loader />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-6">
        <h2 className="text-xl mb-2">Account: {account}</h2>

        <div className="bg-white shadow-md rounded-lg p-4 mb-4">
          <h3 className="text-xl font-semibold mb-2">Create Project</h3>
          <input
            type="text"
            placeholder="Project Name"
            className="border border-gray-300 rounded p-2 w-full mb-2"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
          />
          <input
            type="number"
            placeholder="Budget (in Ether)"
            className="border border-gray-300 rounded p-2 w-full mb-2"
            value={projectBudget}
            onChange={(e) => setProjectBudget(e.target.value)}
          />
          <textarea
            placeholder="Project Description"
            className="border border-gray-300 rounded p-2 w-full mb-2"
            value={projectDescription}
            onChange={(e) => setProjectDescription(e.target.value)}
          />
          <button
            onClick={createProject}
            className="bg-primary text-white p-2 rounded hover:bg-secondary"
          >
            Create Project
          </button>
        </div>

        <div className="bg-white shadow-md rounded-lg p-4">
          <h3 className="text-xl font-semibold mb-2">Projects</h3>
          <ul className="space-y-4">
            {projects.map((project, index) => (
              <li key={index} className="p-4 border border-gray-200 rounded-lg">
                <strong className="block text-lg">{project.name}</strong>
                <p>Budget: {convertWeiToEther(project.budget)} ETH</p>
                <p>Description: {project.description}</p> {/* Displaying project description */}
                <p>
                  Funded:{" "}
                  {project.funded
                    ? parseFloat(project.amountReceived) < parseFloat(project.budget)
                      ? "Accepting Funds"
                      : "Yes"
                    : "No"}
                </p>
                <button
                  onClick={() => fundProject(index)}
                  className="bg-greenlight text-white p-2 rounded hover:bg-green-400"
                >
                  Fund Project
                </button>
                <Link href={`/projects/${project.id}`}>
                  <button
                    className="bg-secondary text-white p-2 rounded hover:bg-primary ml-2"
                  >
                    View Details
                  </button>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Projects;
