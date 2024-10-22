"use client";
import React, { useEffect, useState, useCallback } from 'react';
import Web3 from 'web3';
import FundsTrackerABI from "../../../artifacts/contracts/InfrastructureFunds.sol/InfrastructureFunds.json";
import convertWeiToEther from '@/utils/ConvertWeiToEther';
import Loader from '@/components/Loader';

const ProjectDetails = ({ params }) => {
  const id = params.id; // Get the project ID from URL params
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]); // Store project expenses
  const [showExpenseForm, setShowExpenseForm] = useState(false); // Control form visibility
  const [newExpense, setNewExpense] = useState({ payee: "", description: "", amount: "" });
  const [assigning, setAssigning] = useState(false); // State for assigning contractor
  const [selectedContractor, setSelectedContractor] = useState(""); // State for contractor assignment

  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

  const getWeb3Instance = useCallback(() => {
    if (typeof window !== "undefined" && window.ethereum) {
      return new Web3(window.ethereum); // Use MetaMask's provider
    } else {
      const network = process.env.NEXT_PUBLIC_ETHEREUM_NETWORK;
      const infuraApiKey = process.env.NEXT_PUBLIC_INFURA_API_KEY;
      return new Web3(
        new Web3.providers.HttpProvider(
          `https://${network}.infura.io/v3/${infuraApiKey}`
        )
      );
    }
  }, []);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      if (!id) return;

      try {
        const web3 = getWeb3Instance();
        const instance = new web3.eth.Contract(FundsTrackerABI.abi, contractAddress);

        // Fetch project details
        const projects = await instance.methods.getAllProjects().call();
        const projectData = projects.find((project) => project.id === BigInt(id));

        if (!projectData) {
          console.error("Project not found");
          setLoading(false);
          return;
        }
        setProject(projectData);

        // Fetch expenses for the project
        const expenses = await instance.methods.getAllExpensesByProjectId(id).call();
        setExpenses(expenses);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching project details:", error);
        setLoading(false);
      }
    };

    fetchProjectDetails();
  }, [id, getWeb3Instance]);

  const handleAssignContractor = async () => {
    if (!selectedContractor) return;
    setAssigning(true);

    try {
      const web3 = getWeb3Instance();
      const instance = new web3.eth.Contract(FundsTrackerABI.abi, contractAddress);

      if (!window.ethereum) throw new Error("MetaMask is not installed.");
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const userAccount = accounts[0];

      const transaction = instance.methods.assignContractor(id, selectedContractor);
      const gasEstimate = await transaction.estimateGas({ from: userAccount });

      await transaction.send({ from: userAccount, gas: gasEstimate });

      alert("Contractor assigned successfully!");
      const updatedProjects = await instance.methods.getAllProjects().call();
      const updatedProject = updatedProjects.find((p) => p.id === BigInt(id));
      setProject(updatedProject);
    } catch (error) {
      console.error("Error assigning contractor:", error);
      alert("Failed to assign contractor.");
    } finally {
      setAssigning(false);
    }
  };

  const handleAddExpense = async () => {
    const { payee, description, amount } = newExpense;
    if (!payee || !description || !amount) return;

    try {
      const web3 = getWeb3Instance();
      const instance = new web3.eth.Contract(FundsTrackerABI.abi, contractAddress);

      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const userAccount = accounts[0];

      const weiAmount = web3.utils.toWei(amount, "ether");

      const transaction = instance.methods.incurExpense(id, description, payee, weiAmount);
      const gasEstimate = await transaction.estimateGas({ from: userAccount });

      await transaction.send({ from: userAccount, gas: gasEstimate });

      alert("Expense added successfully!");

      const updatedExpenses = await instance.methods.getAllExpensesByProjectId(id).call();
      setExpenses(updatedExpenses);
      setShowExpenseForm(false);
      setNewExpense({ payee: "", description: "", amount: "" });
    } catch (error) {
      // Check for "Insufficient contract balance" in the error message
      if (error.message.includes("Insufficient contract balance")) {
          alert("Cannot add expense: Insufficient contract balance. Please ensure there are enough funds in the contract.");
      } else {
          alert("Failed to add expense. Check the console for more details.");
      }
      console.error("Error adding expense:", error);
    }
  };

  if (loading) return <Loader />;

  if (!project) return <div>Project not found.</div>;

  const isContractorAssigned = project.contractor !== "0x0000000000000000000000000000000000000000";

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">{project.name}</h1>
      <p><strong>Budget:</strong> {convertWeiToEther(project.budget)} ETH</p>
      <p><strong>Spent:</strong> {convertWeiToEther(project.spent)} ETH</p>
      <p><strong>Description:</strong> {project.description}</p>
      <p><strong>Funded:</strong> {project.funded ? "Yes" : "No"}</p>
      <p><strong>Completed:</strong> {project.completed ? "Yes" : "No"}</p>

      <div className="mt-4">
        {isContractorAssigned ? (
          <p><strong>Assigned Contractor:</strong> {project.contractor}</p>
        ) : (
          <>
            <label className="block text-sm font-medium text-gray-700">
              Assign Contractor:
            </label>
            <input
              type="text"
              placeholder="Enter Contractor's Address"
              value={selectedContractor}
              onChange={(e) => setSelectedContractor(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            />
            <button
              onClick={handleAssignContractor}
              disabled={assigning || !selectedContractor}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
            >
              {assigning ? "Assigning..." : "Assign Contractor"}
            </button>
          </>
        )}
      </div>

      <h2 className="text-2xl font-bold mt-6">Expenses</h2>
      <table className="table-auto w-full mt-4 border-collapse border border-gray-300">
        <thead>
          <tr>
            <th className="border border-gray-300 px-4 py-2">ID</th>
            <th className="border border-gray-300 px-4 py-2">Description</th>
            <th className="border border-gray-300 px-4 py-2">Amount (ETH)</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense) => (
            <tr key={expense.id}>
              <td className="border border-gray-300 px-4 py-2">{expense.id}</td>
              <td className="border border-gray-300 px-4 py-2">{expense.description}</td>
              <td className="border border-gray-300 px-4 py-2">{convertWeiToEther(expense.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <button
        onClick={() => setShowExpenseForm(true)}
        className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md"
      >
        Add Expense
      </button>

      {showExpenseForm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-md">
            <h3 className="text-lg font-bold">Add Expense</h3>
            <input
              type="text"
              placeholder="Payee Address"
              value={newExpense.payee}
              onChange={(e) => setNewExpense({ ...newExpense, payee: e.target.value })}
              className="mt-2 block w-full p-2 border border-gray-300 rounded-md"
            />
            <input
              type="text"
              placeholder="Description"
              value={newExpense.description}
              onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
              className="mt-2 block w-full p-2 border border-gray-300 rounded-md"
            />
            <input
              type="number"
              placeholder="Amount (ETH)"
              value={newExpense.amount}
              onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
              className="mt-2 block w-full p-2 border border-gray-300 rounded-md"
            />
            <button
              onClick={handleAddExpense}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md"
            >
              Submit
            </button>
            <button
              onClick={() => setShowExpenseForm(false)}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
