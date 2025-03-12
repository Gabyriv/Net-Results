import { ref } from 'vue'
import axios from 'axios'
import { useAuth } from './useAuth'

// Remove hardcoded API_URL since axios is already configured with base URL
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
      
      const response = await axios.get(`/teams${queryString}`, {
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

      const response = await axios.get(`/players?unassigned=true`, {
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
      const response = await axios.post(`/teams`, {
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
          
          // For large numbers of players, use batch processing
          const BATCH_SIZE = 5; // Process 5 players at a time
          let allPlayers = [];
          
          if (mappedNewPlayers.length > BATCH_SIZE) {
            // Process new players in batches
            for (let i = 0; i < mappedNewPlayers.length; i += BATCH_SIZE) {
              const batch = mappedNewPlayers.slice(i, i + BATCH_SIZE);
              
              const batchResponse = await axios.post(`/teams/${teamToAdd.id}/players`, {
                playerIds: [],
                newPlayers: batch
              }, {
                headers: {
                  'Authorization': `Bearer ${user.value.token}`
                },
                withCredentials: true
              });
              
              if (batchResponse.data.data && batchResponse.data.data.players) {
                allPlayers = [...allPlayers, ...batchResponse.data.data.players];
              }
              
              // Small delay between batches to avoid overwhelming the server
              if (i + BATCH_SIZE < mappedNewPlayers.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
              }
            }
            
            // Add existing players in a separate request if needed
            if (teamData.playerIds && teamData.playerIds.length > 0) {
              const existingPlayersResponse = await axios.post(`/teams/${teamToAdd.id}/players`, {
                playerIds: teamData.playerIds,
                newPlayers: []
              }, {
                headers: {
                  'Authorization': `Bearer ${user.value.token}`
                },
                withCredentials: true
              });
              
              if (existingPlayersResponse.data.data && existingPlayersResponse.data.data.players) {
                allPlayers = [...allPlayers, ...existingPlayersResponse.data.data.players];
              }
            }
            
            // Update the team with all added players
            teamToAdd.players = allPlayers;
          } else {
            // For small numbers of players, use a single request as before
            const playersResponse = await axios.post(`/teams/${teamToAdd.id}/players`, {
              playerIds: teamData.playerIds || [],
              newPlayers: mappedNewPlayers
            }, {
              headers: {
                'Authorization': `Bearer ${user.value.token}`
              },
              withCredentials: true
            });
            
            // Update the team with the added players
            if (playersResponse.data.data) {
              teamToAdd.players = playersResponse.data.data.players;
            }
          }
        } catch (playerError) {
          console.error('Error adding players to team:', playerError);
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
      console.error('Error creating team:', err);
      error.value = {
        message: err.response?.data?.error || 'Failed to create team. Please try again.'
      };
      throw error.value;
    } finally {
      loading.value = false;
    }
  }

  const deleteTeam = async (teamId) => {
    loading.value = true
    error.value = null
    try {
      console.log(`Attempting to delete team with ID: ${teamId}`)
      const response = await axios.delete(`/teams/${teamId}`, {
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

      const response = await axios.put(`/teams/${teamId}`, {
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
