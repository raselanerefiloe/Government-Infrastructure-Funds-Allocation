const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FundsTracker", function () {
    let FundsTracker, fundsTracker, owner, addr1;

    beforeEach(async function () {
        // Deploy the contract before each test
        FundsTracker = await ethers.getContractFactory("FundsTracker");
        fundsTracker = await FundsTracker.deploy(); // Await the deployment here
        await fundsTracker.deployed(); // This line can be removed as await fundsTracker.deploy() already returns the instance
       
        [owner, addr1] = await ethers.getSigners(); // Get accounts
    });

    it("Should set the correct owner", async function () {
        // Assuming your FundsTracker has an owner field, adapt accordingly
        expect(await fundsTracker.owner()).to.equal(owner.address);
    });

    it("Should add a project", async function () {
        await fundsTracker.addProject("Project 1", 1000); // Add a project
        const project = await fundsTracker.getProject(0); // Get the project
        expect(project.name).to.equal("Project 1"); // Check the project name
        expect(project.fundingAmount).to.equal(1000); // Check the funding amount
    });

    // Additional test cases can go here
});
