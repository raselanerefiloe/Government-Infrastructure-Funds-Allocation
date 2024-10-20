// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

contract UserRoleManagement {
    address public owner;
    mapping(address => bytes32) public roles;

    bytes32 public constant CONTRACTOR_ROLE = keccak256("contractor");
    bytes32 public constant MANAGER_ROLE = keccak256("manager");
    bytes32 public constant OWNER_ROLE = keccak256("owner");
    bytes32 public constant USER_ROLE = keccak256("user");

    event UserAdded(address indexed user);
    event RoleAssigned(address indexed user, bytes32 role);
    event RoleRevoked(address indexed user, bytes32 role);

    address[] public userList;

    constructor() {
        owner = msg.sender;
        roles[owner] = OWNER_ROLE;
        userList.push(owner);
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not authorized: Only owner");
        _;
    }

    modifier onlyRole(bytes32 role) {
        require(roles[msg.sender] == role, "Not authorized: Invalid role");
        _;
    }

    function addUser(address user) external onlyOwner {
        require(user != address(0), "Invalid address");
        roles[user] = USER_ROLE;
        userList.push(user);
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

    function getAllUsers() external view returns (address[] memory, bytes32[] memory) {
        bytes32[] memory userRoles = new bytes32[](userList.length);
        for (uint256 i = 0; i < userList.length; i++) {
            userRoles[i] = roles[userList[i]];
        }
        return (userList, userRoles);
    }
}

contract FundsTracker is UserRoleManagement {
    struct Expense {
        uint256 projectId;
        string description;
        uint256 amount;
        uint256 itemQuantity;
        address payable walletAddress;
        uint256 timestamp;
    }

    struct Project {
        string name;
        uint256 budget;
        uint256 amountReceived;
        bool funded;
        address payable government;
        uint256 startDate;
        uint256 endDate;
        string description;
    }

    struct Contractor {
        string name;
        string description;
        string services;
        address payable walletAddress;
        uint8 rating; // rating can remain as uint8 (1-5)
    }

    struct Payment {
        uint256 amount;
        uint256 projectId;
        uint256 contractorId;
        string description;
        uint256 timestamp;
    }

    Contractor[] public contractors;
    Project[] public projects;
    mapping(uint256 => uint256) public projectContractors;
    mapping(uint256 => Expense[]) public projectExpenses;
    Payment[] public payments;

    event ProjectCreated(uint256 projectId, string name, uint256 budget, address government);
    event FundsReceived(uint256 projectId, uint256 amount);
    event ProjectFunded(uint256 projectId);
    event ContractorAssigned(uint256 projectId, uint256 contractorId);
    event ProjectDatesSet(uint256 projectId, uint256 startDate, uint256 endDate);
    event ExpenseLogged(uint256 projectId, string description, uint256 amount);
    event ContractorCreated(uint256 contractorId, string name);
    event PaymentMade(uint256 paymentId, uint256 amount, uint256 projectId, uint256 contractorId, string description);

    constructor() UserRoleManagement() {}

    function createProject(string calldata name, uint256 budget, address payable government, string calldata description) external {
        require(roles[msg.sender] == MANAGER_ROLE || roles[msg.sender] == OWNER_ROLE, "Not authorized");
        require(government != address(0), "Invalid government address");

        projects.push(Project(name, budget, 0, false, government, 0, 0, description));
        emit ProjectCreated(projects.length - 1, name, budget, government);
    }

    function createContractor(string memory _name, string memory _description, string memory _services, address payable _walletAddress) public {
        contractors.push(Contractor(_name, _description, _services, _walletAddress, 0));
        emit ContractorCreated(contractors.length - 1, _name);
    }

    function assignContractor(uint256 projectId, uint256 contractorId) external {
        require(roles[msg.sender] == MANAGER_ROLE || roles[msg.sender] == OWNER_ROLE, "Not authorized");
        require(projectId < projects.length, "Project does not exist");
        require(contractorId < contractors.length, "Contractor does not exist");
        projectContractors[projectId] = contractorId;
        emit ContractorAssigned(projectId, contractorId);
    }

    function setProjectDates(uint256 projectId, uint256 startDate, uint256 endDate) external {
        require(projectId < projects.length, "Project does not exist");
        require(roles[msg.sender] == MANAGER_ROLE || roles[msg.sender] == OWNER_ROLE, "Unauthorized");
        require(startDate < endDate, "Start date must be before end date");
        projects[projectId].startDate = startDate;
        projects[projectId].endDate = endDate;
        emit ProjectDatesSet(projectId, startDate, endDate);
    }

    function donate(uint256 projectId) external payable {
        require(projectId < projects.length, "Project does not exist");
        require(msg.value > 0, "Must send some ether");

        Project storage project = projects[projectId];
        project.amountReceived += msg.value;
        emit FundsReceived(projectId, msg.value);
        project.government.transfer(msg.value);
        project.funded = true;
        emit ProjectFunded(projectId);
    }

    function logExpense(uint256 projectId, string calldata description, uint256 amount, uint256 itemQuantity, address payable walletAddress) external {
        require(projectId < projects.length, "Project does not exist");
        require(amount > 0, "Invalid amount");
        require(itemQuantity > 0, "Invalid item quantity");
        require(walletAddress != address(0), "Invalid wallet address");
        require(roles[msg.sender] == MANAGER_ROLE || roles[msg.sender] == OWNER_ROLE, "Unauthorized");
        
        Project storage project = projects[projectId];
        require(project.amountReceived >= amount, "Insufficient funds");

        project.government.transfer(amount);
        projectExpenses[projectId].push(Expense(projectId, description, amount, itemQuantity, walletAddress, block.timestamp));
        emit ExpenseLogged(projectId, description, amount);
    }

    function payContractor(uint256 projectId, uint256 contractorId, uint256 amount, string calldata description) external {
        require(roles[msg.sender] == MANAGER_ROLE || roles[msg.sender] == OWNER_ROLE, "Not authorized");
        require(projectId < projects.length, "Project does not exist");
        require(contractorId < contractors.length, "Contractor does not exist");
        require(amount > 0, "Amount must be greater than zero");

        Project storage project = projects[projectId];
        require(project.amountReceived >= amount, "Insufficient funds");

        project.government.transfer(amount);
        contractors[contractorId].walletAddress.transfer(amount);

        payments.push(Payment(amount, projectId, contractorId, description, block.timestamp));
        emit PaymentMade(payments.length - 1, amount, projectId, contractorId, description);
    }

    function getPaymentsByProjectId(uint256 projectId) external view returns (Payment[] memory) {
        require(projectId < projects.length, "Project does not exist");
        uint256 count = 0;

        for (uint256 i = 0; i < payments.length; i++) {
            if (payments[i].projectId == projectId) {
                count++;
            }
        }

        Payment[] memory projectPayments = new Payment[](count);
        uint256 index = 0;

        for (uint256 i = 0; i < payments.length; i++) {
            if (payments[i].projectId == projectId) {
                projectPayments[index] = payments[i];
                index++;
            }
        }

        return projectPayments;
    }

    function getExpensesByProjectId(uint256 projectId) external view returns (Expense[] memory) {
        require(projectId < projects.length, "Project does not exist");
        return projectExpenses[projectId];
    }
    // Function to fetch all projects
    function getAllProjects() public view returns (Project[] memory) {
        return projects;
    }

    // Function to fetch all contractors
    function getAllContractors() public view returns (Contractor[] memory) {
        return contractors;
    }
    // Function to get the contractor associated with a project
    function getContractorByProjectId(uint256 projectId) external view returns (Contractor memory) {
        require(projectId < projects.length, "Project does not exist");
        uint256 contractorId = projectContractors[projectId];
        require(contractorId < contractors.length, "No contractor assigned to this project");
        return contractors[contractorId];
    }
}
