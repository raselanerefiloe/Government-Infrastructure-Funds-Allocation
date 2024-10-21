// pages/projects/[id]/page.jsx
"use client";
import React, { useEffect, useState, useCallback } from 'react';
import Web3 from 'web3'; // Ensure Web3 is imported correctly
import FundsTrackerABI from "../../../artifacts/contracts/InfrastructureFunds.sol/InfrastructureFunds.json";
import convertWeiToEther from '@/utils/ConvertWeiToEther';
import Loader from '@/components/Loader';

const ProjectDetails = ({ params }) => {
  const id = params.id; // Get the project ID from the URL
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contractors, setContractors] = useState([]); // State for contractors
  const [selectedContractor, setSelectedContractor] = useState(""); // State for selected contractor
  const [assigning, setAssigning] = useState(false); // State for assigning contractor

  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

  // Initialize Web3 instance
  const getWeb3Instance = useCallback(() => {
    const network = process.env.NEXT_PUBLIC_ETHEREUM_NETWORK;
    const infuraApiKey = process.env.NEXT_PUBLIC_INFURA_API_KEY;

    return new Web3(
      new Web3.providers.HttpProvider(`https://${network}.infura.io/v3/${infuraApiKey}`)
    );
  }, []);
  
  useEffect(() => {
    const fetchProjectDetails = async () => {
      if (!id) return; // Ensure ID is present before proceeding

      try {
        
        const web3 = getWeb3Instance()
        // Create the contract instance
        const instance = new web3.eth.Contract(FundsTrackerABI.abi, contractAddress);

        // Fetch project details using the ID
        const projects = await instance.methods.getAllProjects().call();
        console.log(projects)
        // filter by id
        const idToFind = BigInt(id);
        const projectData = projects.find(project => project.id === idToFind);
        setProject(projectData);

        // Fetch project contractors
        const projectContractors = await instance.methods.getContractorByProjectId(id).call();
        console.log("Project Contractors", projectContractors)
       setContractors(projectContractors)
        setLoading(false);
      } catch (error) {
        // Handle the error when no contractor is assigned
        if (error.message.includes("Error happened while trying to execute a function inside a smart contract")) {
              console.log("No contractor assigned to this project. Fetching all contractors...");
              // If there are no project-specific contractors, fetch all contractors
              const allContractors = await fetchAllContractors();
              console.log("All Contractors", allContractors);
              setContractors(allContractors);
          } else {
              // Handle any other unexpected error
              console.error("Error fetching project contractors:", error);
          }
        setLoading(false);
      }
    };

    fetchProjectDetails();
  }, [id]); // Re-run effect when `id` changes

  const fetchAllContractors = async () => {
    const web3 = getWeb3Instance()

        // Create the contract instance
        const instance = new web3.eth.Contract(FundsTrackerABI.abi, contractAddress);
    const contractors = await instance.methods.getAllContractors().call(); 
    return contractors;
  };

  const handleAssignContractor = async () => {
    if (!selectedContractor) return; // Ensure a contractor is selected
    setAssigning(true);

    try {
      const network = process.env.NEXT_PUBLIC_ETHEREUM_NETWORK;
      const infuraApiKey = process.env.NEXT_PUBLIC_INFURA_API_KEY;
      const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

      // Initialize Web3 with Infura provider
      const web3 = new Web3(
        new Web3.providers.HttpProvider(
          `https://${network}.infura.io/v3/${infuraApiKey}`
        )
      );

      // Create the contract instance
      const instance = new web3.eth.Contract(FundsTrackerABI.abi, contractAddress);

      const accounts = await web3.eth.getAccounts(); // Get accounts
      await instance.methods.assignProjectToContractor(id, selectedContractor).send({ from: accounts[0] });

      alert("Project assigned successfully!");
    } catch (error) {
      console.error("Error assigning contractor:", error);
      alert("Error assigning contractor.");
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return <Loader />; // Loading state
  }

  if (!project) {
    return <div>Project not found.</div>; // Error handling
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">{project.name}</h1>
      <p><strong>Budget:</strong> {convertWeiToEther(project.budget)} Ether</p>
      <p><strong>Description:</strong> {project.description}</p>
      <p><strong>Funded:</strong> {project.funded ? "Yes" : "No"}</p>

      {/* Dropdown for assigning contractor */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700">
          Assign Contractor:
        </label>
        <select
          value={selectedContractor}
          onChange={(e) => setSelectedContractor(e.target.value)}
          className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
        >
          <option value="">Select a contractor</option>
          {contractors.map((contractor) => (
            <option key={contractor.walletAddress} value={contractor.walletAddress}>
              {contractor.name} - {contractor.services}
            </option>
          ))}
        </select>
        <button
          onClick={handleAssignContractor}
          disabled={assigning || !selectedContractor}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
        >
          {assigning ? "Assigning..." : "Assign Contractor"}
        </button>
      </div>

      {/* Additional details and features can be added here */}
    </div>
  );
};

export default ProjectDetails;
