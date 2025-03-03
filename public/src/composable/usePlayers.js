import { ref } from 'vue'
import axios from 'axios'
import { useAuth } from './useAuth'

// Use a consistent API URL
const API_URL = '/api'

export function usePlayers() {
  const players = ref([])
  const teams = ref([])
  const error = ref(null)
  const loading = ref(false)
  const { user, getAuthHeader } = useAuth()

  const fetchPlayers = async () => {
    loading.value = true
    error.value = null
    try {
      // Make sure we have a user and token
      if (!user.value?.token) {
        throw new Error('Authentication required')
      }

      const response = await axios.get(`${API_URL}/players`, {
        headers: {
          'Authorization': `Bearer ${user.value.token}`
        },
        withCredentials: true
      })
      players.value = response.data
    } catch (err) {
      console.error('Error fetching players:', err)
      error.value = {
        message: err.response?.data?.error || err.message || 'Failed to load players. Please try again later.'
      }
    } finally {
      loading.value = false
    }
  }

  const fetchTeams = async () => {
    loading.value = true
    error.value = null
    try {
      // Make sure we have a user and token
      if (!user.value?.token) {
        throw new Error('Authentication required')
      }

      const response = await axios.get(`${API_URL}/teams`, {
        headers: {
          'Authorization': `Bearer ${user.value.token}`
        },
        withCredentials: true
      })
      teams.value = response.data
    } catch (err) {
      console.error('Error fetching teams:', err)
      error.value = {
        message: err.response?.data?.error || err.message || 'Failed to load teams. Please try again later.'
      }
    } finally {
      loading.value = false
    }
  }

  const assignPlayerToTeam = async (playerId, teamId) => {
    loading.value = true
    error.value = null
    try {
      // Make sure we have a user and token
      if (!user.value?.token) {
        throw new Error('Authentication required')
      }

      const response = await axios.patch(`${API_URL}/players/${playerId}`, {
        teamId: teamId
      }, {
        headers: {
          'Authorization': `Bearer ${user.value.token}`
        },
        withCredentials: true
      })
      
      // Update the player in the local array
      const playerIndex = players.value.findIndex(p => p.id === playerId)
      if (playerIndex !== -1) {
        players.value[playerIndex] = response.data
      }
      
      return response.data
    } catch (err) {
      console.error('Error assigning player to team:', err)
      error.value = {
        message: err.response?.data?.error || err.message || 'Failed to assign player to team. Please try again later.'
      }
      throw error.value
    } finally {
      loading.value = false
    }
  }

  const removePlayerFromTeam = async (playerId) => {
    loading.value = true
    error.value = null
    try {
      // Make sure we have a user and token
      if (!user.value?.token) {
        throw new Error('Authentication required')
      }

      const response = await axios.patch(`${API_URL}/players/${playerId}`, {
        teamId: null
      }, {
        headers: {
          'Authorization': `Bearer ${user.value.token}`
        },
        withCredentials: true
      })
      
      // Update the player in the local array
      const playerIndex = players.value.findIndex(p => p.id === playerId)
      if (playerIndex !== -1) {
        players.value[playerIndex] = response.data
      }
      
      return response.data
    } catch (err) {
      console.error('Error removing player from team:', err)
      error.value = {
        message: err.response?.data?.error || err.message || 'Failed to remove player from team. Please try again later.'
      }
      throw error.value
    } finally {
      loading.value = false
    }
  }

  return { 
    players, 
    teams,
    error, 
    loading, 
    fetchPlayers,
    fetchTeams,
    assignPlayerToTeam,
    removePlayerFromTeam
  }
}
