import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://example.supabase.co'
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

class RealtimeService {
  /**
   * Subscribe to game updates
   * @param {number} gameId - The ID of the game to subscribe to
   * @param {Function} callback - Callback function when the game is updated
   * @returns {object} - Subscription object with unsubscribe method
   */
  subscribeToGame(gameId, callback) {
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
          callback(payload.new)
        }
      )
      .subscribe()

    // Return an object that allows unsubscribing
    return {
      unsubscribe: () => {
        supabase.removeChannel(subscription)
      }
    }
  }

  /**
   * Update a game's scoring information in real-time
   * @param {number} gameId - The ID of the game to update
   * @param {object} gameData - The updated game data
   * @returns {Promise<object>} - The updated game data
   */
  async updateGame(gameId, gameData) {
    const { data, error } = await supabase
      .from('Game')
      .update(gameData)
      .eq('id', gameId)
      .select()
      .single()

    if (error) {
      console.error('Error updating game:', error)
      throw error
    }

    return data
  }

  /**
   * Get the current state of a game
   * @param {number} gameId - The ID of the game to get
   * @returns {Promise<object>} - The current game data
   */
  async getGameState(gameId) {
    const { data, error } = await supabase
      .from('Game')
      .select('*')
      .eq('id', gameId)
      .single()

    if (error) {
      console.error('Error fetching game state:', error)
      throw error
    }

    return data
  }
}

export const realtimeService = new RealtimeService() 