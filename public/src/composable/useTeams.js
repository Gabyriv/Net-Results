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
      teams.value = response.data.data || response.data
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

      // First, create the team
      const response = await axios.post(`${API_URL}/teams`, {
        name: teamData.name
      }, {
        headers: {
          'Authorization': `Bearer ${user.value.token}`
        },
        withCredentials: true
      })
      
      // Get the created team
      const teamToAdd = response.data.data || response.data;
      
      // If we have players to add, make a second request
      if ((teamData.playerIds && teamData.playerIds.length > 0) || 
          (teamData.newPlayers && teamData.newPlayers.length > 0)) {
        try {
          // Map the new players to the format expected by the backend
          const mappedNewPlayers = (teamData.newPlayers || []).map(player => ({
            name: player.name || player.displayName,
            jerseyNumber: player.number
          }));
          
          // Add players to the team
          const playersResponse = await axios.post(`${API_URL}/teams/${teamToAdd.id}/players`, {
            playerIds: teamData.playerIds || [],
            newPlayers: mappedNewPlayers
          }, {
            headers: {
              'Authorization': `Bearer ${user.value.token}`
            },
            withCredentials: true
          })
          
          // Update the team with the added players
          if (playersResponse.data.data) {
            teamToAdd.players = playersResponse.data.data.players
          }
        } catch (playerError) {
          console.error('Error adding players to team:', playerError)
          // Continue even if adding players fails
        }
      }
      
      // Add the new team to the teams list
      if (!teams.value) {
        teams.value = [];
      }
      
      teams.value.push(teamToAdd);
      return teamToAdd;
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

      // Map the new players to the format expected by the backend
      const mappedNewPlayers = (teamData.newPlayers || []).map(player => ({
        name: player.name || player.displayName,
        jerseyNumber: player.number
      }));

      const response = await axios.put(`${API_URL}/teams/${teamId}`, {
        name: teamData.name,
        playerIds: teamData.playerIds || [],
        newPlayers: mappedNewPlayers
      }, {
        headers: {
          'Authorization': `Bearer ${user.value.token}`
        },
        withCredentials: true
      })
      
      // Update the team in the teams list
      const index = teams.value.findIndex(team => team.id === teamId)
      const updatedTeam = response.data.data || response.data;
      if (index !== -1) {
        teams.value[index] = updatedTeam;
      }
      
      return updatedTeam;
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
