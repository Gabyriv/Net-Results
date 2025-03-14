import axios from 'axios';

/**
 * Fetches the roster for a specific team
 * @param {string} teamIdOrName - The ID or name of the team to fetch
 * @returns {Promise<Array>} - Array of player objects
 */
export const getTeamRoster = async (teamIdOrName) => {
  if (!teamIdOrName) {
    throw new Error('Team ID or name is required');
  }

  try {
    // Get the base URL from environment or use default
    const baseUrl = import.meta.env.VITE_API_URL || '/api';
    
    // Get the auth token from localStorage
    const userStr = localStorage.getItem('user');
    let authToken = null;
    
    if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        if (userData && userData.token) {
          authToken = userData.token;
        }
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
    
    // Include the auth token in headers if available
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    // Try to get from API first using team ID
    let apiUrl = `${baseUrl}/teams/${teamIdOrName}/roster`;
    try {
      let response = await fetch(apiUrl, {
        headers,
        credentials: 'include' // Include cookies for fallback auth
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          return data.data;
        }
      }

      // If ID lookup fails, try by team name
      apiUrl = `${baseUrl}/teams/roster?teamName=${encodeURIComponent(teamIdOrName)}`;
      response = await fetch(apiUrl, {
        headers,
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          return data.data;
        }
      }
      
      // Log the response for debugging
      console.log('API Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      const responseText = await response.text();
      console.log('API Response Text:', responseText);
      
    } catch (apiError) {
      console.warn('API fetch failed, falling back to local storage:', apiError);
      // API fetch failed, continue to local storage options
    }

    // Try to find in localStorage 'teams' data
    const teamsData = localStorage.getItem('teams');
    if (teamsData) {
      const teams = JSON.parse(teamsData);
      console.log('Teams found in localStorage:', teams);
      
      // Try to find by ID first, then by name
      let team = teams.find(t => t.id === teamIdOrName || t._id === teamIdOrName);
      if (!team) {
        team = teams.find(t => t.name === teamIdOrName);
      }
      if (team && Array.isArray(team.players) && team.players.length > 0) {
        console.log('Found team in teams localStorage:', team);
        return team.players.map(normalizePlayerData);
      }
    }

    // Try to find in localStorage 'myTeams' data
    const myTeamsData = localStorage.getItem('myTeams');
    if (myTeamsData) {
      const myTeams = JSON.parse(myTeamsData);
      console.log('Teams found in myTeams localStorage:', myTeams);
      
      // Try to find by ID first, then by name
      let team = myTeams.find(t => t.id === teamIdOrName || t._id === teamIdOrName);
      if (!team) {
        team = myTeams.find(t => t.name === teamIdOrName);
      }
      if (team && Array.isArray(team.players) && team.players.length > 0) {
        console.log('Found team in myTeams localStorage:', team);
        return team.players.map(normalizePlayerData);
      }
    }

    // Check games localStorage for this team's players
    const gamesData = localStorage.getItem('games');
    if (gamesData) {
      const games = JSON.parse(gamesData);
      // Find games with this team ID or name
      const teamGames = games.filter(g => 
        g.teamId === teamIdOrName || 
        g.myTeam === teamIdOrName
      );
      
      if (teamGames.length > 0) {
        console.log('Found games for team:', teamGames.length);
        // Use the most recent game that has players
        for (const game of teamGames) {
          if (game.players && Array.isArray(game.players) && game.players.length > 0) {
            console.log('Found players in game:', game);
            return game.players.map(normalizePlayerData);
          }
        }
      }
    }

    // If we get here, no players were found
    console.warn(`No players found for team: ${teamIdOrName}`);
    return [];
  } catch (error) {
    console.error('Error fetching team roster:', error);
    throw error;
  }
};

/**
 * Normalize player data from different sources to a consistent format
 * @param {Object} player - Player data from any source
 * @returns {Object} - Normalized player object
 */
function normalizePlayerData(player) {
  return {
    id: player.id || player._id || String(Math.random()),
    name: player.name || player.displayName || `Player ${player.number || player.jerseyNumber}`,
    jerseyNumber: player.jerseyNumber || player.number || '0'
  };
} 