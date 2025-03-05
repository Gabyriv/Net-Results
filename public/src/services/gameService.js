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
  }
}; 