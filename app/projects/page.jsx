"use client";
import React, { useEffect, useState } from "react";
import {Web3} from "web3"; 
import FundsTrackerABI from "../../artifacts/contracts/FundsTracker.sol/FundsTracker.json";
import { isAddress } from "web3-validator";
import convertWeiToEther from "@/utils/ConvertWeiToEther";

const Projects = () => {
  const [account, setAccount] = useState("");
  const [projects, setProjects] = useState([]);
  const [projectName, setProjectName] = useState("");
  const [projectBudget, setProjectBudget] = useState("");
  const [projectDescription, setProjectDescription] = useState(""); 
  const [contract, setContract] = useState(null);
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
        fetchProjects(instance); // Pass the contract to fetch projects

        setNetwork(network);
      } catch (error) {
        console.error("Error initializing Web3 with Infura:", error);
      }
    };

    initWeb3();
  }, []);

  const fetchProjects = async (contractInstance) => {
    if (contractInstance) {
      try {
        console.log("Fetching projects...");
        const projectCount = await contractInstance.methods.getProjectCount().call();
        console.log("Number of projects:", projectCount);

        const projectsArray = [];
        for (let i = 0; i < projectCount; i++) {
          const project = await contractInstance.methods.getProject(i).call();
          console.log(`Project ${i}:`, project);
          projectsArray.push(project);
        }
        console.log("All projects fetched:", projectsArray);
        setProjects(projectsArray);
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    } else {
      console.warn("Contract instance is not defined. Cannot fetch projects.");
    }
  };

  const createProject = async () => {
    try {
      // Validate the budget input
      if (
        !projectBudget ||
        isNaN(projectBudget) ||
        parseFloat(projectBudget) <= 0
      ) {
        alert("Please enter a valid budget.");
        return;
      }

      // Convert the project budget from Ether to Wei
      const budgetInWei = Web3.utils.toWei(projectBudget, "ether");

      // Check if the account is valid using web3-validator
      if (!isAddress(account)) {
        alert("Invalid account address.");
        return;
      }
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
      const contract = new web3.eth.Contract(
        FundsTrackerABI.abi,
        contractAddress
      );
      // Load Government Address
      const governmentAddress = process.env.NEXT_PUBLIC_GOVERNMENT_ADDRESS;
      // Sending the transaction via MetaMask
      await contract.methods
        .createProject(projectName, budgetInWei, governmentAddress, projectDescription)
        .send({ from: signer.address, gas: 300000 });

      alert("Project created!");
      fetchProjects(contract); // Refresh projects after creating a new one
    } catch (error) {
      console.error("Error creating project:", error);
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

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-4">Infrastructure Funds Tracker</h1>
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
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
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
                <p>Budget: {convertWeiToEther(project.budget)} Ether</p>
                <p>Amount Received: {convertWeiToEther(project.amountReceived)} Ether</p>
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
                  className="bg-green-500 text-white p-2 rounded hover:bg-green-600"
                >
                  Fund Project
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Projects;
