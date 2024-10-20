"use client";
import React, { useEffect, useState } from 'react';
import { Web3 } from 'web3';
import FundsTrackerABI from '../artifacts/contracts/FundsTracker.sol/FundsTracker.json'; 
import { isAddress } from 'web3-validator'; 
import Loader from '@/components/Loader'; // Import the Loader component

const Home = () => {
  const [account, setAccount] = useState('');
  const [projects, setProjects] = useState([]);
  const [projectName, setProjectName] = useState('');
  const [projectBudget, setProjectBudget] = useState('');
  const [contract, setContract] = useState(null);
  const [network, setNetwork] = useState('');
  const [loading, setLoading] = useState(true); // Loading state

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
          console.error('Contract address is missing. Please check your .env file.');
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
          await window.ethereum.request({ method: 'eth_requestAccounts' });

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
      } finally {
        setLoading(false); // Set loading to false after fetching
      }
    } else {
      console.warn("Contract instance is not defined. Cannot fetch projects.");
    }
  };

  const createProject = async () => {
    try {
      console.log("Account ", account, " Creating project with name:", projectName, "and budget:", projectBudget);

      // Validate the budget input
      if (!projectBudget || isNaN(projectBudget) || parseFloat(projectBudget) <= 0) {
        alert("Please enter a valid budget.");
        return;
      }

      // Convert the project budget from Ether to Wei
      const budgetInWei = Web3.utils.toWei(projectBudget, 'ether');

      // Check if the account is valid using web3-validator
      if(!isAddress(account)) {
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
      const contract = new web3.eth.Contract(FundsTrackerABI.abi, contractAddress);

      // Sending the transaction via MetaMask
      await contract.methods.createProject(projectName, budgetInWei, signer.address).send({ from: account, gas: 300000 });

      alert('Project created!');
      fetchProjects(contract); // Refresh projects after creating a new one
    } catch (error) {
      console.error("Error creating project:", error);
    }
  };

  const donateToProject = async (projectId) => {
    const donationAmount = prompt("Enter donation amount in Ether:");
    if (contract && donationAmount) {
      try {
        console.log("Donating to project ID:", projectId, "with amount:", donationAmount, "Ether");
        await contract.methods.donate(projectId).send({ from: account, value: Web3.utils.toWei(donationAmount, 'ether') });
        alert('Donation successful!');
        fetchProjects(contract); // Refresh projects after donation
      } catch (error) {
        console.error("Error making a donation:", error);
      }
    } else {
      console.warn("Contract instance is not defined or donation amount is invalid.");
    }
  };

  // Show loader if loading state is true
  if (loading) {
    return <Loader />;
  }

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
                <p>Budget: {project.budget} Wei</p>
                <p>Amount Received: {project.amountReceived} Wei</p>
                <p>Funded: {project.funded ? "Yes" : "No"}</p>
                <button
                  onClick={() => donateToProject(index)}
                  className="bg-green-500 text-white p-2 rounded hover:bg-green-600"
                >
                  Donate
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Home;
