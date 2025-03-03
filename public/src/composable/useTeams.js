import { ref } from 'vue'
import axios from 'axios'
import { useAuth } from './useAuth'

// API base URL
const API_URL = '/api'

// Configure axios defaults for CORS
axios.defaults.withCredentials = true

export function useTeams() {
  const teams = ref([])
  const availablePlayers = ref([])
  const error = ref(null)
  const loading = ref(false)
  const { user, getAuthHeader } = useAuth()

  const fetchTeams = async (options = {}) => {
    loading.value = true
    error.value = null
    try {
      // Make sure we have a user and token
      if (!user.value?.token) {
        throw new Error('Authentication required')
      }

      // Build query parameters
      const params = new URLSearchParams()
      
      // If myTeams is true, add it to the query
      if (options.myTeams) {
        params.append('myTeams', 'true')
      }
      
      // If managerId is provided, add it to the query
      if (options.managerId) {
        params.append('managerId', options.managerId)
      }
      
      const queryString = params.toString() ? `?${params.toString()}` : ''
      
      const response = await axios.get(`${API_URL}/teams${queryString}`, {
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
      teams.value = []
    } finally {
      loading.value = false
    }
  }

  const fetchAvailablePlayers = async () => {
    loading.value = true
    error.value = null
    try {
      // Make sure we have a user and token
      if (!user.value?.token) {
        throw new Error('Authentication required')
      }

      const response = await axios.get(`${API_URL}/players?unassigned=true`, {
        headers: {
          'Authorization': `Bearer ${user.value.token}`
        },
        withCredentials: true
      })
      availablePlayers.value = response.data
    } catch (err) {
      console.error('Error fetching available players:', err)
      error.value = {
        message: err.response?.data?.error || err.message || 'Failed to load available players. Please try again later.'
      }
      availablePlayers.value = []
    } finally {
      loading.value = false
    }
  }

  const createTeam = async (teamData) => {
    loading.value = true
    error.value = null
    try {
      // Make sure we have the current user
      if (!user.value || !user.value.id) {
        throw new Error('You must be logged in to create a team')
      }

      const response = await axios.post(`${API_URL}/teams`, {
        name: teamData.name,
        playerIds: teamData.playerIds || [],
        newPlayers: teamData.newPlayers || []
      }, {
        headers: {
          'Authorization': `Bearer ${user.value.token}`
        },
        withCredentials: true
      })
      
      // Add the new team to the teams list
      teams.value.push(response.data)
      return response.data
    } catch (err) {
      console.error('Error creating team:', err)
      error.value = {
        message: err.response?.data?.error || 'Failed to create team. Please try again.'
      }
      throw error.value
    } finally {
      loading.value = false
    }
  }

  const deleteTeam = async (teamId) => {
    loading.value = true
    error.value = null
    try {
      console.log(`Attempting to delete team with ID: ${teamId}`)
      const response = await axios.delete(`${API_URL}/teams/${teamId}`, {
        headers: {
          'Authorization': `Bearer ${user.value.token}`
        },
        withCredentials: true
      })
      
      console.log('Delete response:', response.status, response.data)
      
      // Remove the team from the teams list
      teams.value = teams.value.filter(team => team.id !== teamId)
      return { success: true }
    } catch (err) {
      console.error('Error deleting team:', err)
      error.value = {
        message: err.response?.data?.error || 'Failed to delete team. Please try again later.'
      }
      throw error.value
    } finally {
      loading.value = false
    }
  }

  const updateTeam = async (teamId, teamData) => {
    loading.value = true
    error.value = null
    try {
      // Make sure we have the current user
      if (!user.value || !user.value.id) {
        throw new Error('You must be logged in to update a team')
      }

      const response = await axios.put(`${API_URL}/teams/${teamId}`, {
        name: teamData.name,
        playerIds: teamData.playerIds || [],
        newPlayers: teamData.newPlayers || []
      }, {
        headers: {
          'Authorization': `Bearer ${user.value.token}`
        },
        withCredentials: true
      })
      
      // Update the team in the teams list
      const index = teams.value.findIndex(team => team.id === teamId)
      if (index !== -1) {
        teams.value[index] = response.data
      }
      
      return response.data
    } catch (err) {
      console.error('Error updating team:', err)
      error.value = {
        message: err.response?.data?.error || 'Failed to update team. Please try again.'
      }
      throw error.value
    } finally {
      loading.value = false
    }
  }

  return { 
    teams, 
    availablePlayers,
    error, 
    loading, 
    fetchTeams, 
    fetchAvailablePlayers,
    createTeam,
    deleteTeam,
    updateTeam
  }
}
