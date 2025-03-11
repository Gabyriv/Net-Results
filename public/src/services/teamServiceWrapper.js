// Import the actual function from the original file
import { getTeamRoster } from './teamService';

// Create a wrapper object that provides the same function
export const teamService = {
  getTeamRoster
};

// Also re-export the original function directly
export { getTeamRoster }; 