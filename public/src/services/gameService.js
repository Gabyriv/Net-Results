import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

export const gameService = {
  // Get all games
  getAllGames: async () => {
    try {
      const response = await axios.get(`${API_URL}/games/list`);
      return response.data.data;
    } catch (error) {
      console.error('Error fetching games:', error);
      throw error;
    }
  },

  // Get games by team ID
  getGamesByTeam: async (teamName) => {
    try {
      // If no team name is provided, return all games
      if (!teamName) {
        return gameService.getAllGames();
      }
      
      // Fetch all games and filter by the team name client-side
      // This assumes the backend doesn't have a dedicated endpoint for filtering
      const allGames = await gameService.getAllGames();
      return allGames.filter(game => 
        game.myTeam === teamName
      );
    } catch (error) {
      console.error('Error fetching games by team:', error);
      throw error;
    }
  },

  // Create a new game
  createGame: async (gameData) => {
    try {
      const response = await axios.post(`${API_URL}/games/create`, gameData);
      return response.data.data;
    } catch (error) {
      console.error('Error creating game:', error);
      throw error;
    }
  },

  // Update game score (we'll need this for real-time updates)
  updateGame: async (id, gameData) => {
    try {
      const response = await axios.put(`${API_URL}/games/${id}`, gameData);
      return response.data.data;
    } catch (error) {
      console.error('Error updating game:', error);
      throw error;
    }
  },

  // Delete a game
  deleteGame: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/games/${id}`);
      return response.data.success;
    } catch (error) {
      console.error('Error deleting game:', error);
      throw error;
    }
  }
}; 