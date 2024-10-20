# FundsTracker and UserRoleManagement Smart Contract Project

This repository contains a Solidity-based project for managing funds and user roles within a blockchain-based environment. It includes two main components:
- **UserRoleManagement**: A contract for managing user roles and permissions.
- **FundsTracker**: A contract for creating and managing projects, assigning contractors, logging expenses, and handling donations.

## Table of Contents
- [Project Description](#project-description)
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Deployment](#deployment)
- [Usage](#usage)
- [Smart Contract Functions](#smart-contract-functions)
- [Testing](#testing)
- [Contributing](#contributing)
- [License](#license)

## Project Description
This project aims to streamline project funding, contractor management, and expense tracking using blockchain technology. The smart contracts are designed to be deployed on the Ethereum network and include role-based access control to ensure that only authorized users can perform specific actions.

## Features
- **Role Management**: Admins can assign roles like contractor, manager, and owner to different addresses.
- **Project Management**: Create projects, assign contractors, track budgets, and manage funds.
- **Donation Handling**: Accept donations directly to project addresses and update project funding status.
- **Expense Logging**: Log expenses for projects to maintain transparent accounting.
- **Contractor Management**: Create and manage contractor profiles and assign them to projects.

## Prerequisites
Ensure you have the following installed on your development machine:
- [Node.js](https://nodejs.org/) (v14 or later)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Truffle](https://www.trufflesuite.com/) or [Hardhat](https://hardhat.org/) (for testing and deployment)
- [Solidity](https://soliditylang.org/) (v0.8.27 or later)
- [Infura](https://infura.io/) API key (for Ethereum network connection)

## Installation
1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/FundsTracker.git
   cd FundsTracker
