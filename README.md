# ai.work Home Assignment - Confluence Integration API

This project provides an integration with Confluence that supports two main functionalities:
- **List All Pages in a Space:** Retrieve a list of all pages within a specified Confluence space.
- **Get Page Content:** Fetch the content of a specific Confluence page.

The integration uses OAuth2 for authentication and exposes two endpoints:
  - `/pages/space/:spaceKey`: Retrieves all pages for a given space.
  - `/pages/:pageId`: Retrieves the content of a specific page by its ID.

Automated tests for the project include some unit tests and integration tests written in TypeScript using Mocha, Chai.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Project Setup](#project-setup)
- [Running the Application](#running-the-application)
- [Running the Tests](#running-the-tests)

## Prerequisites

- A Confluence account with API access and OAuth2 credentials (see the required configs below)
- Node.js
- npm

## Project Setup

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/Robert-L24/Confluence_integration.git

2. Go to https://developer.atlassian.com/ and create a new Auth2.0 API app.
3. In developer console enter the app settings and add the following permisions:
    - read:page:confluence
    - read:space:confluence

4. Enter "Authorization" tab and set the Callbac URL to:
    - http://localhost:3000/auth/callback
5. Enter "Settings" tab and copy the Client ID and the Secret.
6. Paste the copied values to the .env file, replacing the current values.
**Note: in a production code there would be no .env file and no secret codes inside it in the repository. This is included for an easy testing for you as it is a dummy project.**

## Running the Application

1. Open terminal and go to the project main folder.
2. ```bash
    npm install
3. ```bash
    npm run build
4. ```bash
    npm run start
5. Open a browser http://localhost:3000/pages/space/{YOUR-SPACE-KEY}

## Running the tests
1. Open terminal and go to the project main folder.
2. ```bash
    npm run test