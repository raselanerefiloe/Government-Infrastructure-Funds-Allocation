
// appwrite.js

import { Client, Account, Databases, ID } from 'appwrite';

export const client = new Client();


client
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('67166ada0006b7b527a8'); 

const account = new Account(client);
const databases = new Databases(client);


// Function to add a project to Appwrite collection
export const addProjectToAppwriteCollection = async (name, description, projectId) => {
    try {
      const databaseId = process.env.NEXT_PUBLIC_DATABASE_ID; // Database ID from environment variables
      const projectsCollectionId = process.env.NEXT_PUBLIC_PROJECTS_COLLECTION_ID; // Collection ID for projects
  
      // Convert BigInt values to strings
      const projectIdString = projectId.toString();

      // Create a new document in the Appwrite projects collection
      await databases.createDocument(
          databaseId, 
          projectsCollectionId, 
          ID.unique(), // Generate a unique ID for the document
          {
              name: name,
              description: description,
              projectId: projectIdString, // Store the project ID as a string
          }
      );
  
      console.log("Project successfully added to Appwrite collection.");
    } catch (error) {
      console.error("Error adding project to Appwrite collection:", error);
      alert("Failed to add project to the database. Please check the console for more details.");
    }
  };