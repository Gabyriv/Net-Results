import { defineStore } from 'pinia'
import { gameService } from '../services/gameService'
import axios from 'axios'

// API base URL
const API_URL = '/api'

export const useMainStore = defineStore('main', {
  state: () => ({
    matches: [],
    players: [],
    wins: [],
    loading: false,
    error: null
  }),
  actions: {
    // Fetch all matches/games
    async fetchMatches() {
      this.loading = true
      this.error = null
      try {
        const data = await gameService.getAllGames()
        this.matches = data || []
        
        // Calculate wins separately
        this.wins = this.matches.filter(match => match.myPts > match.oppPts)
        return this.matches
      } catch (error) {
        console.error('Error fetching matches:', error)
        this.error = error.message || 'Failed to fetch matches'
        return []
      } finally {
        this.loading = false
      }
    },
    
    // Fetch all players
    async fetchPlayers() {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get(`${API_URL}/players`)
        this.players = response.data || []
        return this.players
      } catch (error) {
        console.error('Error fetching players:', error)
        this.error = error.message || 'Failed to fetch players'
        return []
      } finally {
        this.loading = false
      }
    },
    
    // Fetch dashboard data (matches, players and wins)
    async fetchDashboardData() {
      this.loading = true
      this.error = null
      try {
        // Fetch matches first
        await this.fetchMatches()
        
        // Then fetch players
        await this.fetchPlayers()
        
        return {
          matches: this.matches,
          players: this.players, 
          wins: this.wins
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        this.error = error.message || 'Failed to fetch dashboard data'
        return {
          matches: [],
          players: [],
          wins: []
        }
      } finally {
        this.loading = false
      }
    }
  },
})
