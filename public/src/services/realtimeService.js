import { createClient } from '@supabase/supabase-js'
import axios from 'axios'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://example.supabase.co'
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'
// Use environment variable if set, otherwise default to relative path
const API_URL = import.meta.env.VITE_API_URL || '/api'

// Initialize Supabase client - only needed for realtime subscriptions
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Configure axios defaults for CORS
axios.defaults.withCredentials = true

// Maximum number of retries for API requests
const MAX_RETRIES = 3

// Initial retry delay in milliseconds
const INITIAL_RETRY_DELAY = 500

// Helper for retrying requests with exponential backoff
const retryRequest = async (requestFn, maxRetries = 3) => {
  let retries = 0;
  let lastError = null;
  
  while (retries < maxRetries) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      retries++;
      console.log(`Request failed (attempt ${retries}/${maxRetries}):`, error.message);
      
      if (retries >= maxRetries) break;
      
      // Exponential backoff with jitter
      const delay = Math.min(1000 * Math.pow(2, retries), 10000) + Math.random() * 1000;
      console.log(`Retrying in ${Math.round(delay / 1000)} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

class RealtimeService {
  /**
   * Subscribe to game updates
   * @param {number} gameId - The ID of the game to subscribe to
   * @param {Function} callback - Callback function when the game is updated
   * @returns {object} - Subscription object with unsubscribe method
   */
  subscribeToGame(gameId, callback) {
    if (!gameId) {
      console.error('Cannot subscribe to game: Invalid gameId', gameId)
      return { unsubscribe: () => {} }
    }

    console.log('Subscribing to game updates for ID:', gameId)
    
    try {
      // Subscribe to changes on the games table for this specific game ID
      const subscription = supabase
        .channel(`game-${gameId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'Game',
            filter: `id=eq.${gameId}`
          },
          (payload) => {
            console.log('Received realtime update:', payload);
            callback(payload.new)
          }
        )
        .subscribe((status) => {
          console.log('Supabase subscription status:', status);
        });

      // Return an object that allows unsubscribing
      return {
        unsubscribe: () => {
          console.log('Unsubscribing from game updates for ID:', gameId);
          supabase.removeChannel(subscription);
        }
      }
    } catch (error) {
      console.error('Error setting up subscription:', error);
      return { unsubscribe: () => {} };
    }
  }

  /**
   * Update a game's scoring information in real-time
   * @param {number} gameId - The ID of the game to update
   * @param {object} gameData - The updated game data
   * @returns {Promise<object>} - The updated game data
   */
  async updateGame(gameId, gameData) {
    if (!gameId) {
      throw new Error('Cannot update game: Invalid gameId');
    }
    
    return retryRequest(async () => {
      try {
        const url = `/games/${gameId}`;
        console.log(`Sending PUT request to ${url} with data:`, JSON.stringify(gameData));
        
        const response = await axios.put(url, gameData, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        
        console.log('Update response:', response.status, response.statusText);
        
        if (response.data && response.data.success) {
          return response.data.data;
        } else {
          console.error('API returned error:', response.data);
          throw new Error(response.data?.error || 'Failed to update game');
        }
      } catch (error) {
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error('Error response:', error.response.status, error.response.data);
          throw new Error(`Server error ${error.response.status}: ${error.response.data?.error || 'Unknown error'}`);
        } else if (error.request) {
          // The request was made but no response was received
          console.error('No response received:', error.request);
          throw new Error('No response from server - check network connection');
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error('Request setup error:', error.message);
          throw error;
        }
      }
    });
  }

  /**
   * Get the current state of a game
   * @param {number} gameId - The ID of the game to get
   * @returns {Promise<object>} - The current game data
   */
  async getGameState(gameId) {
    if (!gameId) {
      throw new Error('Cannot get game state: Invalid gameId');
    }
    
    return retryRequest(async () => {
      try {
        const url = `/games/${gameId}`;
        console.log(`Sending GET request to ${url}`);
        
        const response = await axios.get(url, {
          headers: {
            'Accept': 'application/json'
          }
        });
        
        console.log('Get response:', response.status, response.statusText);
        
        if (response.data && response.data.success) {
          console.log('Game data received:', response.data.data);
          return response.data.data;
        } else {
          console.error('API returned error:', response.data);
          throw new Error(response.data?.error || 'Failed to get game state');
        }
      } catch (error) {
        if (error.response) {
          console.error('Error response:', error.response.status, error.response.data);
          throw new Error(`Server error ${error.response.status}: ${error.response.data?.error || 'Unknown error'}`);
        } else if (error.request) {
          console.error('No response received:', error.request);
          throw new Error('No response from server - check network connection');
        } else {
          console.error('Request setup error:', error.message);
          throw error;
        }
      }
    });
  }
}

export const realtimeService = new RealtimeService()

/**
 * Updates a game's state in the database
 * @param {string} gameId - The ID of the game to update
 * @param {Object} gameData - The updated game data
 * @returns {Promise<Object>} - The updated game data from the server
 */
export const updateGameScore = async (gameId, gameData) => {
  if (!gameId) {
    console.error('updateGameScore: No gameId provided');
    return null;
  }

  let retries = 0;
  let delay = INITIAL_RETRY_DELAY;

  while (retries <= MAX_RETRIES) {
    try {
      const url = `/games/${gameId}`;
      console.log(`Attempting to update game ${gameId} at ${url}`, gameData);

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(gameData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error(`Error updating game (${response.status}):`, errorData);
        throw new Error(`Failed to update game: ${errorData.message || response.statusText}`);
      }

      const updatedGame = await response.json();
      console.log('Game updated successfully:', updatedGame);
      return updatedGame;
    } catch (error) {
      console.error(`Attempt ${retries + 1}/${MAX_RETRIES + 1} failed:`, error.message);
      
      if (retries === MAX_RETRIES) {
        console.error('Maximum retries reached. Giving up.');
        throw error;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Double the delay for next retry
      retries++;
    }
  }
};

/**
 * Gets the current state of a game from the database
 * @param {string} gameId - The ID of the game to fetch
 * @returns {Promise<Object>} - The game data from the server
 */
export const getGameState = async (gameId) => {
  if (!gameId) {
    console.error('getGameState: No gameId provided');
    return null;
  }

  let retries = 0;
  let delay = INITIAL_RETRY_DELAY;

  while (retries <= MAX_RETRIES) {
    try {
      const url = `/games/${gameId}`;
      console.log(`Fetching game state for ${gameId} from ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error(`Error fetching game (${response.status}):`, errorData);
        throw new Error(`Failed to fetch game: ${errorData.message || response.statusText}`);
      }

      const gameData = await response.json();
      console.log('Game state retrieved successfully:', gameData);
      return gameData;
    } catch (error) {
      console.error(`Attempt ${retries + 1}/${MAX_RETRIES + 1} failed:`, error.message);
      
      if (retries === MAX_RETRIES) {
        console.error('Maximum retries reached. Giving up.');
        throw error;
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Double the delay for next retry
      retries++;
    }
  }
};

// Exported object with all service methods
export default {
  updateGameScore,
  getGameState
}; 