// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

contract InfrastructureFunds {
    struct Project {
        uint256 id;
        string name;
        address contractor;
        uint256 budget; // stored in wei
        uint256 spent;
        bool completed;
        bool funded; // Indicates if the project is funded
    }

    struct Expense {
        uint256 projectId; // Link to the project ID
        uint256 id;
        string description;
        uint256 amount; // stored in wei
    }

    address public governmentWallet;
    mapping(uint256 => Project) public projects;
    mapping(uint256 => Expense) public expenses;
    mapping(address => uint256) public contributions; // Total contributions per address
    mapping(uint256 => uint256) public projectContributions; // Contributions per project

    uint256 public projectCount;
    uint256 public expenseCount;

    event ProjectCreated(uint256 projectId, string name, address contractor, uint256 budget);
    event ContractorAssigned(uint256 projectId, address contractor);
    event FundsReceived(address contributor, uint256 amount, uint256 projectId);
    event ContractorPaid(uint256 projectId, address contractor, uint256 amount);
    event ExpenseIncurred(uint256 projectId, uint256 expenseId, string description, uint256 amount);

    constructor(address _governmentWallet) {
        governmentWallet = _governmentWallet;
    }

    // Function to create a project with a budget in ETH
    function createProject(string memory _name) external payable {
        require(msg.value > 0, "Budget must be greater than 0");

        projectCount++;
        projects[projectCount] = Project(projectCount, _name, address(0), msg.value, 0, false, false);
        emit ProjectCreated(projectCount, _name, address(0), msg.value);
    }

    // Function to assign a contractor to a project
    function assignContractor(uint256 _projectId, address _contractor) external {
        require(projects[_projectId].id != 0, "Project does not exist");
        require(projects[_projectId].contractor == address(0), "Contractor already assigned");

        projects[_projectId].contractor = _contractor;
        emit ContractorAssigned(_projectId, _contractor);
    }

    // Function to receive funds for a specific project
    function receiveFunds(uint256 _projectId) external payable {
        require(msg.value > 0, "Must send funds");
        require(projects[_projectId].id != 0, "Project does not exist");

        contributions[msg.sender] += msg.value;
        projectContributions[_projectId] += msg.value;

        // If the project receives funding, set funded to true
        if (projectContributions[_projectId] > 0) {
            projects[_projectId].funded = true;
        }

        emit FundsReceived(msg.sender, msg.value, _projectId);
    }

    // Function to pay a contractor with ETH
    function payContractor(uint256 _projectId) external payable {
        require(projects[_projectId].contractor != address(0), "Contractor not assigned");
        require(msg.value > 0, "Amount must be greater than 0");
        require(projects[_projectId].spent + msg.value <= projects[_projectId].budget, "Exceeds budget");

        // Record the payment as an expense
        expenseCount++;
        expenses[expenseCount] = Expense(_projectId, expenseCount, "Payment to Contractor", msg.value);
        projects[_projectId].spent += msg.value;

        // Transfer funds to the contractor
        payable(projects[_projectId].contractor).transfer(msg.value);
        emit ContractorPaid(_projectId, projects[_projectId].contractor, msg.value);
        emit ExpenseIncurred(_projectId, expenseCount, "Payment to Contractor", msg.value);
    }

    // Function to incur an expense for a project with ETH
    function incurExpense(uint256 _projectId, string memory _description) external payable {
        require(projects[_projectId].id != 0, "Project does not exist");
        require(msg.value > 0, "Expense must be greater than 0");
        require(projects[_projectId].spent + msg.value <= projects[_projectId].budget, "Exceeds budget");

        expenseCount++;
        expenses[expenseCount] = Expense(_projectId, expenseCount, _description, msg.value);
        projects[_projectId].spent += msg.value;

        emit ExpenseIncurred(_projectId, expenseCount, _description, msg.value);
    }

    // Function to get all expenses by project ID
    function getAllExpensesByProjectId(uint256 _projectId) external view returns (Expense[] memory) {
        require(projects[_projectId].id != 0, "Project does not exist");

        // Count the number of expenses associated with the project
        uint256 count = 0;
        for (uint256 i = 1; i <= expenseCount; i++) {
            if (expenses[i].projectId == _projectId) {
                count++;
            }
        }

        // Create an array to store the expenses for the project
        Expense[] memory projectExpenses = new Expense[](count);
        uint256 index = 0;

        // Fill the array with expenses related to the project
        for (uint256 i = 1; i <= expenseCount; i++) {
            if (expenses[i].projectId == _projectId) {
                projectExpenses[index] = expenses[i];
                index++;
            }
        }

        return projectExpenses;
    }

    // Function to get all projects
    function getAllProjects() external view returns (Project[] memory) {
        Project[] memory allProjects = new Project[](projectCount);
        for (uint256 i = 1; i <= projectCount; i++) {
            allProjects[i - 1] = projects[i];
        }
        return allProjects;
    }

    // Function to get all expenses
    function getAllExpenses() external view returns (Expense[] memory) {
        Expense[] memory allExpenses = new Expense[](expenseCount);
        for (uint256 i = 1; i <= expenseCount; i++) {
            allExpenses[i - 1] = expenses[i];
        }
        return allExpenses;
    }
}