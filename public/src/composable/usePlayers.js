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

  const createNewPlayer = async (playerData) => {
    loading.value = true
    error.value = null
    try {
      // Make sure we have a user and token
      if (!user.value?.token) {
        throw new Error('Authentication required')
      }

      const response = await axios.post(`${API_URL}/players`, playerData, {
        headers: {
          'Authorization': `Bearer ${user.value.token}`
        },
        withCredentials: true
      })
      
      // Add the new player to the local array
      players.value.push(response.data.data)
      
      return response.data.data
    } catch (err) {
      console.error('Error creating player:', err)
      error.value = {
        message: err.response?.data?.error || err.message || 'Failed to create player. Please try again later.'
      }
      throw error.value
    } finally {
      loading.value = false
    }
  }

  const updatePlayerById = async (playerId, playerData) => {
    loading.value = true
    error.value = null
    try {
      // Make sure we have a user and token
      if (!user.value?.token) {
        throw new Error('Authentication required')
      }

      console.log(`Updating player ${playerId} with data:`, playerData)

      const response = await axios.put(`${API_URL}/players/${playerId}`, playerData, {
        headers: {
          'Authorization': `Bearer ${user.value.token}`
        },
        withCredentials: true
      })
      
      console.log('API Response:', response.data)
      
      // Extract the player data from the response
      const updatedPlayer = response.data.data || response.data
      
      // Update the player in the local array
      const index = players.value.findIndex(p => p.id === playerId)
      if (index !== -1) {
        players.value[index] = updatedPlayer
        console.log('Updated local player at index', index, ':', updatedPlayer)
      } else {
        console.log('Player not found in local array, fetching all players')
        await fetchPlayers() // Refresh all players if we can't find this one
      }
      
      return updatedPlayer
    } catch (err) {
      console.error('Error updating player:', err)
      error.value = {
        message: err.response?.data?.error || err.message || 'Failed to update player. Please try again later.'
      }
      throw error.value
    } finally {
      loading.value = false
    }
  }

  const deletePlayerById = async (playerId) => {
    loading.value = true
    error.value = null
    try {
      // Make sure we have a user and token
      if (!user.value?.token) {
        throw new Error('Authentication required')
      }

      console.log(`Deleting player with ID: ${playerId}`)

      const response = await axios.delete(`${API_URL}/players/${playerId}`, {
        headers: {
          'Authorization': `Bearer ${user.value.token}`
        },
        withCredentials: true
      })
      
      console.log(`Delete player response:`, response.data)
      
      // Remove the player from the local array
      players.value = players.value.filter(p => p.id !== playerId)
      
      return true
    } catch (err) {
      console.error('Error deleting player:', err)
      error.value = {
        message: err.response?.data?.error || err.message || 'Failed to delete player. Please try again later.'
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
    removePlayerFromTeam,
    createNewPlayer,
    updatePlayerById,
    deletePlayerById
  }
}
