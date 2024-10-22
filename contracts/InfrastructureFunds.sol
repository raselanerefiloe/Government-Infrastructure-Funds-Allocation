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

    struct Contribution {
        uint256 projectId; // Include projectId in the struct
        address contributor;
        uint256 amount; // stored in wei
        uint256 timestamp;
    }

    mapping(uint256 => Project) public projects;
    mapping(uint256 => Expense) public expenses;
    mapping(uint256 => Contribution[]) public projectContributions; // Contributions per project

    uint256 public projectCount;
    uint256 public expenseCount;

    // Use a multiplier to simulate floating-point values with 18 decimal precision
    uint256 private constant DECIMALS = 1e18; // 10^18 for 18 decimal places

    event ProjectCreated(uint256 projectId, string name, address contractor, uint256 budget);
    event ContractorAssigned(uint256 projectId, address contractor);
    event FundsReceived(address contributor, uint256 amount, uint256 projectId);
    event ContractorPaid(uint256 projectId, address contractor, uint256 amount);
    event ExpenseIncurred(uint256 projectId, uint256 expenseId, string description, uint256 amount);

    constructor() {}

    // Function to create a project with a specified budget (supports decimals as wei)
    function createProject(string memory _name, uint256 _budgetInEther) external {
        require(_budgetInEther > 0, "Budget must be greater than 0");

        // Convert _budgetInEther to wei (fixed-point arithmetic)
        uint256 budgetInWei = _budgetInEther * DECIMALS;

        projectCount++;
        projects[projectCount] = Project(
            projectCount,
            _name,
            address(0),
            budgetInWei, // Store budget in wei
            0,
            false,
            false
        );

        emit ProjectCreated(projectCount, _name, address(0), budgetInWei);
    }


    // Function to assign a contractor to a project
    function assignContractor(uint256 _projectId, address _contractor) external {
        require(projects[_projectId].id != 0, "Project does not exist");
        require(projects[_projectId].contractor == address(0), "Contractor already assigned");

        projects[_projectId].contractor = _contractor;
        emit ContractorAssigned(_projectId, _contractor);
    }

    // Function to receive funds for a specific project and store contribution details
    function receiveFunds(uint256 _projectId) external payable {
        require(msg.value > 0, "Must send funds");
        require(projects[_projectId].id != 0, "Project does not exist");

        // Store contribution details with projectId
        projectContributions[_projectId].push(Contribution({
            projectId: _projectId,
            contributor: msg.sender,
            amount: msg.value,
            timestamp: block.timestamp
        }));

        // Mark project as funded if contributions are made
        projects[_projectId].funded = true;

        emit FundsReceived(msg.sender, msg.value, _projectId);
    }

    // Function to pay a contractor with ETH
    // Function to pay a contractor from the contract's balance
    function payContractor(uint256 _projectId, uint256 _amountInEther) external {
        require(projects[_projectId].contractor != address(0), "Contractor not assigned");
        require(_amountInEther > 0, "Amount must be greater than 0");
        require(projects[_projectId].spent + _amountInEther <= projects[_projectId].budget, "Exceeds budget");
        require(address(this).balance >= _amountInEther, "Insufficient contract balance");

        // Convert _amountInEther to wei (fixed-point arithmetic)
        uint256 amountInWei = _amountInEther * DECIMALS;

        // Record the payment as an expense
        expenseCount++;
        expenses[expenseCount] = Expense(_projectId, expenseCount, "Payment to Contractor", amountInWei);
        projects[_projectId].spent += amountInWei;

        // Transfer funds to the contractor from the contract's balance
        payable(projects[_projectId].contractor).transfer(amountInWei);

        emit ContractorPaid(_projectId, projects[_projectId].contractor, amountInWei);
        emit ExpenseIncurred(_projectId, expenseCount, "Payment to Contractor", amountInWei);
    }


    // Function to incur an expense for a project and pay to a specified address
    function incurExpense(uint256 _projectId, string memory _description, address _payee, uint256 _amountInEther) external {
        require(projects[_projectId].id != 0, "Project does not exist");
        require(_amountInEther > 0, "Expense must be greater than 0");
        require(projects[_projectId].spent + _amountInEther <= projects[_projectId].budget, "Exceeds budget");
        require(address(this).balance >= _amountInEther, "Insufficient contract balance");

        // Convert _amountInEther to wei (fixed-point arithmetic)
        uint256 amountInWei = _amountInEther * DECIMALS;

        // Record the payment as an expense
        expenseCount++;
        expenses[expenseCount] = Expense(_projectId, expenseCount, _description, amountInWei);
        projects[_projectId].spent += amountInWei;

        // Transfer funds from the contract balance to the specified payee address
        payable(_payee).transfer(amountInWei); // Transfer the specified amount to the payee

        emit ExpenseIncurred(_projectId, expenseCount, _description, amountInWei);
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

    // Function to retrieve all contributions for a specific project by its project ID
    function getContributionsByProjectId(uint256 _projectId)
        external
        view
        returns (Contribution[] memory)
    {
        require(projects[_projectId].id != 0, "Project does not exist");

        // Return the contributions for the specified project
        return projectContributions[_projectId];
    }

    // Function to get the total contributions made by all contributors
    function getAllContributions() external view returns (Contribution[] memory) {
        // Calculate total number of contributions across all projects
        uint256 totalContributions = 0;
        for (uint256 i = 1; i <= projectCount; i++) {
            totalContributions += projectContributions[i].length;
        }

        // Create an array to hold all contributions
        Contribution[] memory allContributions = new Contribution[](totalContributions);
        uint256 index = 0;

        // Loop through each project to collect contributions
        for (uint256 i = 1; i <= projectCount; i++) {
            Contribution[] storage contributionsForProject = projectContributions[i];
            for (uint256 j = 0; j < contributionsForProject.length; j++) {
                allContributions[index] = contributionsForProject[j];
                index++;
            }
        }

        return allContributions;
    }
    // Function to get the contract's balance
    function getContractBalance() external view returns (uint256) {
        return address(this).balance; // Returns the contract's balance
    }
}
