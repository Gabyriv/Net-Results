import { ref } from 'vue'
import axios from 'axios'

// API base URL - use the port detected from the backend server
const API_URL = 'http://localhost:3000/api'

export function useGames() {
  const games = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Configure axios defaults for CORS
  axios.defaults.withCredentials = true

  /**
   * Fetch all games from the API
   */
  const fetchGames = async () => {
    loading.value = true
    error.value = null
    
    try {
      // Use the unauthenticated endpoint for listing games
      const response = await axios.get(`${API_URL}/games/list`)
      
      if (response.data && response.data.success) {
        games.value = response.data.data
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      console.error('Error fetching games:', err)
      error.value = 'Failed to load games. Please try again.'
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch a single game by ID
   * @param {number} id - Game ID to fetch
   * @returns {Promise<Object>} - Game data or null if error
   */
  const fetchGameById = async (id) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.get(`${API_URL}/games/${id}`)
      
      if (response.data && response.data.success) {
        return response.data.data
      } else {
        throw new Error('Invalid response format')
      }
    } catch (err) {
      console.error(`Error fetching game ${id}:`, err)
      error.value = 'Failed to load game. Please try again.'
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Create a new game
   * @param {Object} gameData - Game data to create
   * @returns {Promise<Object>} - Created game or null if error
   */
  const createGame = async (gameData) => {
    loading.value = true
    error.value = null
    
    try {
      console.log('Creating game with data:', gameData);
      
      // Use the unauthenticated endpoint for creating games
      const response = await axios.post(`${API_URL}/games/create`, gameData)
      
      if (response.data && response.data.success) {
        // Add the new game to the games array
        games.value = [response.data.data, ...games.value]
        return response.data.data
      } else {
        console.error('Error response from server:', response.data);
        throw new Error(response.data?.error || 'Failed to create game')
      }
    } catch (err) {
      console.error('Error creating game:', err);
      
      if (err.response) {
        console.error('Response status:', err.response.status);
        console.error('Response data:', err.response.data);
        error.value = err.response.data?.error || 'Failed to create game. Please try again.';
      } else if (err.request) {
        console.error('No response received:', err.request);
        error.value = 'Server did not respond. Please check your connection and try again.';
      } else {
        console.error('Error message:', err.message);
        error.value = 'Failed to create game. Please try again.';
      }
      
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Update a game's score and stats
   * @param {number} id - Game ID to update
   * @param {Object} gameData - Updated game data
   * @returns {Promise<Object>} - Updated game or null if error
   */
  const updateGameScore = async (id, gameData) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.put(`${API_URL}/games/${id}/score`, gameData)
      
      if (response.data && response.data.success) {
        // Update the game in the games array
        const index = games.value.findIndex(g => g.id === id)
        if (index !== -1) {
          games.value[index] = response.data.data
        }
        return response.data.data
      } else {
        throw new Error(response.data?.error || 'Failed to update game')
      }
    } catch (err) {
      console.error(`Error updating game ${id}:`, err)
      error.value = err.response?.data?.error || 'Failed to update game. Please try again.'
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    games,
    loading, 
    error,
    fetchGames,
    fetchGameById,
    createGame,
    updateGameScore
  }
} 