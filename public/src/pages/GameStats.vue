<template>
  <DashboardLayout>
    <div class="container mx-auto px-4 py-6">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">Game Statistics</h1>
        <router-link :to="`/matches`" class="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium flex items-center">
          <span class="material-icons mr-2">arrow_back</span> Back to Games
        </router-link>
      </div>
      
      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center p-12">
        <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
      
      <!-- Error State -->
      <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg mb-6">
        <p class="font-medium">Error loading game data</p>
        <p>{{ error }}</p>
      </div>
      
      <!-- Game Details -->
      <div v-else-if="game" class="mb-8">
        <div class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-xl font-semibold mb-4">Game Information</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p class="mb-2"><span class="font-medium">Teams:</span> {{ game.myTeam }} vs {{ game.oppTeam }}</p>
              <p class="mb-2"><span class="font-medium">Score:</span> {{ game.myPts }} - {{ game.oppPts }}</p>
              <p class="mb-2"><span class="font-medium">Sets:</span> {{ game.sets }}/{{ game.maxSets }}</p>
              <p class="mb-2"><span class="font-medium">Season:</span> {{ game.season || getCurrentSeason() }}</p>
            </div>
            <div>
              <p class="mb-2"><span class="font-medium">Date:</span> {{ formatDate(game.created_at) }}</p>
              <p class="mb-2">
                <span class="font-medium">Status:</span> 
                <span :class="game.isActive ? 'text-green-600' : 'text-red-600'">
                  {{ game.isActive ? 'Active' : 'Completed' }}
                </span>
              </p>
              <p class="mb-2">
                <span class="font-medium">Set Scores:</span> 
                <span :class="{'text-red-500': formatSetScores(game.setScores) === 'N/A'}">
                  {{ formatSetScores(game.setScores) }}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Tabs for Team Stats and Player Stats -->
      <div v-if="game" class="mb-6">
        <div class="border-b border-gray-200">
          <nav class="-mb-px flex space-x-8">
            <button 
              @click="activeTab = 'team'" 
              :class="[
                activeTab === 'team' 
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
              ]"
            >
              Team Statistics
            </button>
            <button 
              @click="activeTab = 'player'" 
              :class="[
                activeTab === 'player' 
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
              ]"
            >
              Player Statistics
            </button>
          </nav>
        </div>
      </div>
      
      <!-- Team Stats Content -->
      <div v-if="game && activeTab === 'team'" class="space-y-6">
        <!-- Placeholder for existing team stats components -->
        <p class="text-gray-500 italic text-center p-8">
          Team statistics view not yet implemented.
        </p>
      </div>
      
      <!-- Player Stats Content -->
      <div v-if="game && activeTab === 'player'" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Player Stat Form (only when game is not active) -->
          <PlayerStatForm 
            v-if="!game.isActive && players.length > 0"
            :gameId="gameId" 
            :players="players"
            :canSubmitStats="!game.isActive"
            @stat-submitted="handleStatSubmitted"
          />
          
          <!-- Player Selector for Stats Display -->
          <div class="bg-white rounded-lg shadow-md p-4">
            <h2 class="text-xl font-bold mb-4">View Player Stats</h2>
            
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Select Player</label>
              <select 
                v-model="selectedPlayerId" 
                @change="handlePlayerChange"
                class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                <option disabled value="">Select a player</option>
                <option v-for="player in players" :key="player.id" :value="player.id">
                  {{ player.displayName }}
                </option>
              </select>
            </div>
          </div>
        </div>
        
        <!-- Player Stats Display (when a player is selected) -->
        <PlayerStatsDisplay 
          v-if="selectedPlayerId && selectedPlayerName"
          :playerId="selectedPlayerId"
          :playerName="selectedPlayerName"
          :gameId="gameId"
          :key="statsDisplayKey"
        />
        
        <!-- Player Stats Table -->
        <div v-if="playerStats.length > 0" class="bg-white rounded-lg shadow-md p-4">
          <h2 class="text-xl font-bold mb-4">All Player Stats for this Game</h2>
          
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Player
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stat Type
                  </th>
                  <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th v-if="!game.isActive" scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr v-for="stat in playerStats" :key="`${stat.playerId}-${stat.statType}`">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {{ getPlayerName(stat.playerId) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ formatStatType(stat.statType) }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {{ stat.value }}
                  </td>
                  <td v-if="!game.isActive" class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button 
                      @click="deleteStat(stat.playerId, stat.statType)" 
                      class="text-red-600 hover:text-red-800"
                      title="Delete stat"
                    >
                      <span class="material-icons">delete</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script>
import DashboardLayout from '../layouts/DashboardLayout.vue';
import PlayerStatForm from '../components/stats/PlayerStatForm.vue';
import PlayerStatsDisplay from '../components/stats/PlayerStatsDisplay.vue';

export default {
  name: 'GameStats',
  components: {
    DashboardLayout,
    PlayerStatForm,
    PlayerStatsDisplay
  },
  data() {
    return {
      gameId: this.$route.params.id,
      game: null,
      players: [],
      playerStats: [],
      selectedPlayerId: '',
      activeTab: 'team',
      loading: true,
      error: null,
      statsDisplayKey: 0 // Used to force re-render of stats display component
    }
  },
  computed: {
    selectedPlayerName() {
      if (!this.selectedPlayerId) return '';
      const player = this.players.find(p => p.id === this.selectedPlayerId);
      return player ? player.displayName : '';
    }
  },
  created() {
    this.fetchGameData();
    this.fetchPlayerStats();
  },
  methods: {
    formatDate(dateString) {
      if (!dateString) return 'N/A';
      return new Date(dateString).toLocaleDateString();
    },
    formatStatType(statType) {
      if (!statType) return '';
      return statType.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    },
    getCurrentSeason() {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      return `${currentYear}-${currentYear + 1}`;
    },
    formatSetScores(setScores) {
      if (!setScores) return 'N/A';
      
      try {
        // Parse setScores if it's a string
        let scoresData = setScores;
        if (typeof setScores === 'string') {
          scoresData = JSON.parse(setScores);
        }
        
        // Handle different possible formats of setScores
        let formattedScores = [];
        
        if (Array.isArray(scoresData)) {
          // If it's an array format
          formattedScores = scoresData
            .filter(set => set && !set.placeholder && (set.myTeam !== undefined || set.homeScore !== undefined))
            .map(set => {
              // Handle different property naming conventions
              const homeScore = set.myTeam !== undefined ? set.myTeam : 
                              (set.homeScore !== undefined ? set.homeScore : 0);
              const awayScore = set.oppTeam !== undefined ? set.oppTeam : 
                              (set.awayScore !== undefined ? set.awayScore : 0);
              return `${homeScore}-${awayScore}`;
            });
        } else if (typeof scoresData === 'object') {
          // If it's an object format with keys like "0", "1", "2"
          formattedScores = Object.values(scoresData)
            .filter(set => set && !set.placeholder && (set.myTeam !== undefined || set.homeScore !== undefined))
            .map(set => {
              // Handle different property naming conventions
              const homeScore = set.myTeam !== undefined ? set.myTeam : 
                              (set.homeScore !== undefined ? set.homeScore : 0);
              const awayScore = set.oppTeam !== undefined ? set.oppTeam : 
                              (set.awayScore !== undefined ? set.awayScore : 0);
              
              // Skip empty scores (0-0)
              if (homeScore === 0 && awayScore === 0) return null;
              
              return `${homeScore}-${awayScore}`;
            })
            .filter(score => score !== null); // Filter out null entries
        }
        
        // Don't filter out duplicate scores, as they may be legitimate separate sets
        // with the same score
        return formattedScores.join(', ');
      } catch (error) {
        console.error('Error formatting set scores:', error, setScores);
        
        // Fallback display if setScores is broken
        if (this.game) {
          return `${this.game.myPts} - ${this.game.oppPts} (aggregate)`;
        }
      }
      
      return 'N/A';
    },
    getPlayerName(playerId) {
      const player = this.players.find(p => p.id === playerId);
      return player ? player.displayName : 'Unknown Player';
    },
    handleSetScores(gameData) {
      // Parse set scores if it's a string
      if (typeof gameData.setScores === 'string') {
        try {
          gameData.setScores = JSON.parse(gameData.setScores);
        } catch (e) {
          console.error('Error parsing set scores:', e);
          // If parsing fails, create a default object
          gameData.setScores = {};
        }
      }
      
      // Ensure setScores is an object
      if (!gameData.setScores || typeof gameData.setScores !== 'object') {
        gameData.setScores = {};
      }
      
      // If using array format, convert to object format
      if (Array.isArray(gameData.setScores)) {
        const objectScores = {};
        gameData.setScores.forEach((set, index) => {
          if (set && (set.myTeam !== undefined || set.homeScore !== undefined)) {
            objectScores[index] = set;
          }
        });
        gameData.setScores = objectScores;
      }
      
      // Count total sets played
      const maxSets = gameData.maxSets || 5;
      
      // Clean up the set scores without filtering out sets with same score
      const cleanedScores = {};
      let setIndex = 0;
      
      // Process set scores in order - don't filter out sets with same score
      // Just ensure we have the correct number of sets for the game type
      for (let i = 0; i < Math.max(Object.keys(gameData.setScores).length, maxSets); i++) {
        if (gameData.setScores[i]) {
          const set = gameData.setScores[i];
          
          // Handle different property naming conventions
          const homeScore = set.myTeam !== undefined ? set.myTeam : 
                           (set.homeScore !== undefined ? set.homeScore : 0);
          const awayScore = set.oppTeam !== undefined ? set.oppTeam : 
                           (set.awayScore !== undefined ? set.awayScore : 0);
          
          // Skip empty sets (0-0)
          if (homeScore === 0 && awayScore === 0) continue;
          
          // Include this set if we haven't reached the max
          if (setIndex < maxSets) {
            cleanedScores[setIndex] = set;
            setIndex++;
          }
        }
      }
      
      // For best-of-5, we need exactly 5 sets
      // For best-of-3, we need exactly 3 sets
      // Fill remaining slots with placeholder values
      if (setIndex < maxSets) {
        console.log(`Only found ${setIndex} sets, expected ${maxSets}. Adding placeholders.`);
        
        // Only add placeholders if we have at least one valid set
        if (setIndex > 0) {
          for (let i = setIndex; i < maxSets; i++) {
            // Add placeholder sets that won't show up in formatting
            cleanedScores[i] = { myTeam: 0, oppTeam: 0, placeholder: true };
          }
        }
      }
      
      return cleanedScores;
    },
    async fetchGameData() {
      this.loading = true;
      this.error = null;
      
      try {
        // Fetch game details
        const gameResponse = await fetch(`/games/${this.gameId}`);
        if (!gameResponse.ok) {
          const errorData = await gameResponse.json();
          throw new Error(errorData.error || 'Failed to fetch game details');
        }
        
        const gameData = await gameResponse.json();
        const game = gameData.data;
        
        console.log('Original game data:', JSON.stringify(game));
        
        // Calculate total points from set scores if needed
        let myTotalPoints = 0;
        let oppTotalPoints = 0;
        
        // Process set scores
        game.setScores = this.handleSetScores(game);
        
        console.log('Processed set scores:', JSON.stringify(game.setScores));
        
        // Check if we need to update points
        if (game.myPts === 0 && game.oppPts === 0) {
          // Calculate points from sets
          Object.values(game.setScores).forEach(set => {
            if (!set.placeholder) {
              const homeScore = set.myTeam !== undefined ? set.myTeam : 
                               (set.homeScore !== undefined ? set.homeScore : 0);
              const awayScore = set.oppTeam !== undefined ? set.oppTeam : 
                               (set.awayScore !== undefined ? set.awayScore : 0);
              
              myTotalPoints += homeScore;
              oppTotalPoints += awayScore;
            }
          });
          
          // Update the game points
          if (myTotalPoints > 0 || oppTotalPoints > 0) {
            game.myPts = myTotalPoints;
            game.oppPts = oppTotalPoints;
          }
        }
        
        // Ensure season is set
        if (!game.season) {
          game.season = this.getCurrentSeason();
        }
        
        this.game = game;
        
        // Fetch players for the teams involved in this game
        await this.fetchPlayers();
        
      } catch (error) {
        this.error = error.message;
        console.error('Error fetching game data:', error);
      } finally {
        this.loading = false;
      }
    },
    async fetchPlayers() {
      try {
        // Normally we'd fetch players associated with the teams in this game
        // For now, we'll just fetch all players as an example
        const playersResponse = await fetch('/players');
        if (!playersResponse.ok) {
          const errorData = await playersResponse.json();
          console.error('Error fetching players:', errorData.error);
          return;
        }
        
        const playersData = await playersResponse.json();
        this.players = playersData.data || [];
      } catch (error) {
        console.error('Error fetching players:', error);
      }
    },
    async fetchPlayerStats() {
      try {
        const response = await fetch(`/games/${this.gameId}/player-stats`);
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error fetching player stats:', errorData.error);
          return;
        }
        
        const statsData = await response.json();
        this.playerStats = statsData.data || [];
      } catch (error) {
        console.error('Error fetching player stats:', error);
      }
    },
    handlePlayerChange() {
      // Increment key to force re-render of stats display component
      this.statsDisplayKey++;
    },
    handleStatSubmitted(newStat) {
      // Refresh player stats when a new stat is submitted
      this.fetchPlayerStats();
    },
    async deleteStat(playerId, statType) {
      if (!confirm('Are you sure you want to delete this stat?')) {
        return;
      }
      
      try {
        const response = await fetch(
          `/games/${this.gameId}/player-stats?playerId=${playerId}&statType=${statType}`, 
          { method: 'DELETE' }
        );
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete stat');
        }
        
        // Refresh stats after deletion
        this.fetchPlayerStats();
        
        // Also refresh the stats display if the deleted stat belonged to the selected player
        if (playerId === this.selectedPlayerId) {
          this.statsDisplayKey++;
        }
      } catch (error) {
        console.error('Error deleting player stat:', error);
        alert(`Error: ${error.message}`);
      }
    }
  }
}
</script> 