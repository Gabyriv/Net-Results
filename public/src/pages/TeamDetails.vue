<template>
  <div class="bg-blue-100 min-h-screen p-8">
    <div class="max-w-6xl mx-auto">
      <!-- Back button and team header -->
      <div class="flex justify-between items-center mb-8">
        <button 
          @click="$router.back()" 
          class="flex items-center text-blue-600 hover:text-blue-800"
        >
          <span class="material-icons mr-1">arrow_back</span>
          Back to Teams
        </button>
        
        <h1 class="text-3xl font-bold text-center flex-grow">{{ team.name }}</h1>
      </div>
      
      <!-- Loading state -->
      <div v-if="loading" class="text-center py-12">
        <div class="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p class="text-lg text-gray-600">Loading team data...</p>
      </div>
      
      <!-- Error state -->
      <div v-else-if="error" class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-8">
        <p>{{ error }}</p>
        <button 
          @click="loadTeamData" 
          class="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
      
      <!-- Team content -->
      <div v-else>
        <!-- Team Stats Overview -->
        <div class="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 class="text-xl font-bold mb-4">Team Statistics</h2>
          
          <div v-if="playerStats.length > 0" class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-blue-50 rounded-lg p-4">
              <h3 class="text-lg font-semibold mb-2">Total Matches</h3>
              <p class="text-3xl font-bold text-blue-700">{{ uniqueMatches.size }}</p>
            </div>
            
            <div class="bg-green-50 rounded-lg p-4">
              <h3 class="text-lg font-semibold mb-2">Total Points</h3>
              <p class="text-3xl font-bold text-green-700">{{ totalPositiveStats }}</p>
            </div>
            
            <div class="bg-purple-50 rounded-lg p-4">
              <h3 class="text-lg font-semibold mb-2">Team Efficiency</h3>
              <p class="text-3xl font-bold" :class="teamEfficiencyClass">{{ teamEfficiency }}%</p>
            </div>
          </div>
          
          <div v-else class="text-center py-4 text-gray-500">
            No statistics recorded for this team yet.
          </div>
        </div>
        
        <!-- Players Section -->
        <h2 class="text-2xl font-bold mb-4">Players</h2>
        
        <div v-if="team.players && team.players.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <PlayerCard 
            v-for="player in team.players" 
            :key="player.id" 
            :player="player" 
            :allStats="playerStats"
          />
        </div>
        
        <div v-else class="bg-white rounded-lg shadow p-8 text-center">
          <p class="text-gray-500">No players in this team yet.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import PlayerCard from '../components/PlayerCard.vue';

export default {
  components: {
    PlayerCard
  },
  setup() {
    const route = useRoute();
    const teamId = route.params.id;
    
    const team = ref({
      id: null,
      name: '',
      players: []
    });
    
    const loading = ref(true);
    const error = ref(null);
    const playerStats = ref([]);
    
    // Function to load team data
    const loadTeamData = async () => {
      loading.value = true;
      error.value = null;
      
      try {
        // Fetch team data
        const teamResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/teams/${teamId}`);
        
        if (!teamResponse.ok) {
          throw new Error(`Failed to load team data: ${teamResponse.status}`);
        }
        
        const teamData = await teamResponse.json();
        
        if (teamData.success && teamData.data) {
          team.value = teamData.data;
          
          // Load player statistics for all team players
          await loadPlayerStats();
        } else {
          throw new Error(teamData.error || 'Failed to load team data');
        }
      } catch (err) {
        console.error('Error loading team data:', err);
        error.value = err.message;
      } finally {
        loading.value = false;
      }
    };
    
    // Function to load player statistics
    const loadPlayerStats = async () => {
      try {
        const playerIds = team.value.players.map(p => p.id).join(',');
        
        // Fetch stats for all players in the team
        const statsResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/stats/players?playerIds=${playerIds}`);
        
        if (!statsResponse.ok) {
          // If the API doesn't support this endpoint, use a fallback
          console.warn('Stats API endpoint not available, using local storage fallback');
          
          // Try to load any available stats from local storage
          const gamesData = localStorage.getItem('gamestats');
          if (gamesData) {
            try {
              const games = JSON.parse(gamesData);
              
              // Extract player stats from all games
              const allStats = [];
              games.forEach(game => {
                if (game.playerStats) {
                  try {
                    let gameStats = [];
                    if (typeof game.playerStats === 'string') {
                      gameStats = JSON.parse(game.playerStats);
                    } else if (Array.isArray(game.playerStats)) {
                      gameStats = game.playerStats;
                    }
                    
                    // Add match ID to each stat
                    gameStats.forEach(stat => {
                      stat.matchId = game.id;
                      allStats.push(stat);
                    });
                  } catch (e) {
                    console.error('Error parsing game stats:', e);
                  }
                }
                
                // Also check notes field (our fallback storage)
                if (game.notes) {
                  try {
                    if (game.notes.startsWith('[') && game.notes.endsWith(']')) {
                      const noteStats = JSON.parse(game.notes);
                      
                      // Add match ID to each stat
                      noteStats.forEach(stat => {
                        stat.matchId = game.id;
                        allStats.push(stat);
                      });
                    }
                  } catch (e) {
                    console.error('Error parsing notes as stats:', e);
                  }
                }
              });
              
              // Filter to only include stats for players in this team
              playerStats.value = allStats.filter(stat => {
                return team.value.players.some(player => 
                  (player.id === stat.playerId) || 
                  (player.jerseyNumber === stat.playerNumber)
                );
              });
              
              console.log(`Loaded ${playerStats.value.length} stats for team players from local storage`);
            } catch (e) {
              console.error('Error loading stats from local storage:', e);
            }
          }
          return;
        }
        
        // If the API endpoint is available, use the data from it
        const statsData = await statsResponse.json();
        
        if (statsData.success && Array.isArray(statsData.data)) {
          playerStats.value = statsData.data;
        }
      } catch (err) {
        console.error('Error loading player stats:', err);
      }
    };
    
    // Computed properties for team statistics
    const uniqueMatches = computed(() => {
      const matchIds = new Set();
      playerStats.value.forEach(stat => {
        if (stat.matchId) matchIds.add(stat.matchId);
      });
      return matchIds;
    });
    
    const totalPositiveStats = computed(() => {
      return playerStats.value.filter(stat => stat.quality === '+').length;
    });
    
    const totalNegativeStats = computed(() => {
      return playerStats.value.filter(stat => stat.quality === '-').length;
    });
    
    const teamEfficiency = computed(() => {
      const totalPlays = playerStats.value.length;
      if (totalPlays === 0) return 0;
      
      const efficiency = ((totalPositiveStats.value - totalNegativeStats.value) / totalPlays) * 100;
      return Math.round(efficiency);
    });
    
    const teamEfficiencyClass = computed(() => {
      if (teamEfficiency.value > 30) return 'text-green-700';
      if (teamEfficiency.value > 0) return 'text-green-600';
      if (teamEfficiency.value > -20) return 'text-yellow-600';
      return 'text-red-600';
    });
    
    onMounted(() => {
      loadTeamData();
    });
    
    return {
      team,
      loading,
      error,
      playerStats,
      loadTeamData,
      uniqueMatches,
      totalPositiveStats,
      teamEfficiency,
      teamEfficiencyClass
    };
  }
};
</script> 