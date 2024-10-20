// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

contract UserRoleManagement {
    address public owner;

    // Mapping of user addresses to their roles
    mapping(address => bytes32) public roles;

    // Define role constants using keccak256
    bytes32 public constant CONTRACTOR_ROLE = keccak256("contractor");
    bytes32 public constant MANAGER_ROLE = keccak256("manager");
    bytes32 public constant OWNER_ROLE = keccak256("owner");
    bytes32 public constant USER_ROLE = keccak256("user");

    event UserAdded(address indexed user);
    event RoleAssigned(address indexed user, bytes32 role);
    event RoleRevoked(address indexed user, bytes32 role);

    constructor() {
        owner = msg.sender;
        roles[owner] = OWNER_ROLE;
    }

    modifier onlyOwner() {
        require(
            msg.sender == owner,
            "Not authorized: Only owner can perform this action"
        );
        _;
    }

    modifier onlyRole(bytes32 role) {
        require(
            roles[msg.sender] == role,
            "Not authorized: You do not have the required role"
        );
        _;
    }

    function addUser(address user) external onlyOwner {
        require(user != address(0), "Invalid address");
        roles[user] = USER_ROLE; // Assign a general user role
        emit UserAdded(user);
    }

    function assignRole(address user, bytes32 role) external onlyOwner {
        require(user != address(0), "Invalid address");
        roles[user] = role;
        emit RoleAssigned(user, role);
    }

    function revokeRole(address user) external onlyOwner {
        require(user != address(0), "Invalid address");
        bytes32 role = roles[user];
        delete roles[user];
        emit RoleRevoked(user, role);
    }

    function hasRole(address user, bytes32 role) external view returns (bool) {
        return roles[user] == role;
    }
}

contract FundsTracker is UserRoleManagement {
    struct Expense {
        uint256 projectId; // ID of the project associated with this expense
        string description;
        uint256 amount;
        uint256 timestamp;
    }

    struct Project {
        string name;
        uint256 budget;
        uint256 amountReceived;
        bool funded;
        address payable government;
        uint256 startDate; // Start date (set after contractor is assigned)
        uint256 endDate; // End date (set after contractor is assigned)
        string description;
    }

    struct Contractor {
        uint256 id; // Unique ID for the contractor
        string name; // Name of the contractor
        // Additional fields related to contractor can be added here
    }

    Project[] public projects; // Array to hold all projects
    Contractor[] public contractors; // Array to hold all contractors

    // Mapping from project ID to contractor ID
    mapping(uint256 => uint256) public projectContractors; // projectId => contractorId

    // Mapping from project ID to expenses
    mapping(uint256 => Expense[]) public projectExpenses;

    event ProjectCreated(
        uint256 projectId,
        string name,
        uint256 budget,
        address government
    );
    event FundsReceived(uint256 projectId, uint256 amount);
    event ProjectFunded(uint256 projectId);
    event ContractorAssigned(uint256 projectId, uint256 contractorId);
    event ProjectDatesSet(
        uint256 projectId,
        uint256 startDate,
        uint256 endDate
    );
    event ExpenseLogged(uint256 projectId, string description, uint256 amount);
    event ContractorCreated(uint256 contractorId, string name);

    constructor() UserRoleManagement() {}

    function createProject(
        string calldata name,
        uint256 budget,
        address payable government,
        string calldata description
    ) external {
        require(
            roles[msg.sender] == MANAGER_ROLE ||
                roles[msg.sender] == OWNER_ROLE,
            "Not authorized: Only manager or owner can create projects"
        );
        require(government != address(0), "Invalid government address");

        // Initialize a new project and push it to the projects array
        projects.push(
            Project({
                name: name,
                budget: budget,
                amountReceived: 0,
                funded: false,
                government: government,
                startDate: 0,
                endDate: 0,
                description: description
            })
        );
        emit ProjectCreated(projects.length - 1, name, budget, government);
    }

    // Function to create a new contractor
    function createContractor(
        string calldata name
    ) external onlyRole(MANAGER_ROLE) {
        uint256 contractorId = contractors.length; // Generate a unique ID for the contractor
        contractors.push(Contractor({id: contractorId, name: name}));
        emit ContractorCreated(contractorId, name);
    }

    // Function to assign a contractor to a project
    function assignContractor(
        uint256 projectId,
        uint256 contractorId
    ) external onlyRole(MANAGER_ROLE) {
        require(projectId < projects.length, "Project does not exist");
        require(contractorId < contractors.length, "Contractor does not exist");

        projectContractors[projectId] = contractorId; // Associate the contractor with the project
        emit ContractorAssigned(projectId, contractorId);
    }

    function setProjectDates(
        uint256 projectId,
        uint256 startDate,
        uint256 endDate
    ) external {
        require(projectId < projects.length, "Project does not exist");

        // Retrieve the contractor ID from the mapping
        uint256 contractorId = projectContractors[projectId];
        require(
            contractors[contractorId].id == contractorId,
            "Only the assigned contractor can set project dates"
        );
        require(startDate < endDate, "Start date must be before end date");

        projects[projectId].startDate = startDate; // Set the project start date
        projects[projectId].endDate = endDate; // Set the project end date
        emit ProjectDatesSet(projectId, startDate, endDate);
    }

    function donate(uint256 projectId) external payable {
        require(projectId < projects.length, "Project does not exist");
        require(msg.value > 0, "Must send some ether");

        Project storage project = projects[projectId];
        project.amountReceived += msg.value;

        emit FundsReceived(projectId, msg.value);

        // Transfer the funds to the project government immediately upon donation
        project.government.transfer(msg.value);

        // Set the project as funded regardless of the amount received
        project.funded = true;

        emit ProjectFunded(projectId);
    }

    // Function to log an expense against a project (only managers can log expenses)
    function logExpense(
        uint256 projectId,
        string calldata description,
        uint256 amount
    ) external onlyRole(MANAGER_ROLE) {
        require(projectId < projects.length, "Project does not exist");
        require(amount > 0, "Invalid amount");

        projectExpenses[projectId].push(
            Expense({
                projectId: projectId, // Assign the project ID to the expense
                description: description,
                amount: amount,
                timestamp: block.timestamp
            })
        );

        emit ExpenseLogged(projectId, description, amount);
    }

    // Function to get project details
    function getProject(
        uint256 projectId
    ) external view returns (Project memory) {
        require(projectId < projects.length, "Project does not exist");
        return projects[projectId];
    }

    // Function to get expenses for a specific project
    function getProjectExpenses(
        uint256 projectId
    ) external view returns (Expense[] memory) {
        require(projectId < projects.length, "Project does not exist");
        return projectExpenses[projectId];
    }

    // Function to get the count of projects
    function getProjectCount() external view returns (uint256) {
        return projects.length;
    }

    // Function to get the count of contractors
    function getContractorCount() external view returns (uint256) {
        return contractors.length;
    }

    // Function to get contractor details
    function getContractor(
        uint256 contractorId
    ) external view returns (Contractor memory) {
        require(contractorId < contractors.length, "Contractor does not exist");
        return contractors[contractorId];
    }
}
