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
   * @param {Object} options - Options for fetching games
   * @param {boolean} options.myGames - When true, fetch only games created by the current user
   */
  const fetchGames = async (options = {}) => {
    loading.value = true
    error.value = null
    
    try {
      // If myGames is true, use the authenticated endpoint that filters for user's games
      const endpoint = options.myGames 
        ? `${API_URL}/games/my-games` 
        : `${API_URL}/games/list`
      
      const response = await axios.get(endpoint)
      
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
   * Fetch only games created by the current user
   */
  const fetchMyGames = async () => {
    return fetchGames({ myGames: true })
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
      
      // Use the provided data without additional transformation
      // The calling component should provide all fields in the correct format
      
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
        
        // Extract the detailed error message
        const errorData = err.response.data;
        let errorMessage;
        
        if (errorData && errorData.error) {
          // Handle various error formats
          if (typeof errorData.error === 'string') {
            errorMessage = errorData.error;
          } else if (typeof errorData.error === 'object') {
            // Handle nested error objects (like validation errors)
            errorMessage = 'Validation error: ';
            for (const field in errorData.error) {
              if (errorData.error[field]._errors) {
                errorMessage += `${field}: ${errorData.error[field]._errors.join(', ')}. `;
              }
            }
          } else {
            errorMessage = 'Failed to create game. Please try again.';
          }
        } else {
          errorMessage = 'Server error. Please try again.';
        }
        
        error.value = errorMessage;
      } else if (err.request) {
        console.error('No response received:', err.request);
        error.value = 'Server did not respond. Please check your connection and try again.';
      } else {
        console.error('Error message:', err.message);
        error.value = err.message || 'Failed to create game. Please try again.';
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
      // Update to use the correct endpoint without /score
      const response = await axios.put(`${API_URL}/games/${id}`, gameData)
      
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

  /**
   * Delete a game
   * @param {number} id - Game ID to delete
   * @returns {Promise<boolean>} - Success status
   */
  const deleteGame = async (id) => {
    loading.value = true
    error.value = null
    
    try {
      const response = await axios.delete(`${API_URL}/games/${id}`)
      
      if (response.data && response.data.success) {
        // Remove the game from the games array
        games.value = games.value.filter(game => game.id !== id)
        return true
      } else {
        throw new Error(response.data?.error || 'Failed to delete game')
      }
    } catch (err) {
      console.error(`Error deleting game ${id}:`, err)
      error.value = err.response?.data?.error || 'Failed to delete game. Please try again.'
      return false
    } finally {
      loading.value = false
    }
  }

  return {
    games,
    loading, 
    error,
    fetchGames,
    fetchMyGames,
    fetchGameById,
    createGame,
    updateGameScore,
    deleteGame
  }
} 