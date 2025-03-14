<template>
  <DashboardLayout>
    <div class="container mx-auto p-4">
      <h1 class="text-3xl font-bold mb-4">Games</h1>

      <!-- Create Game Button -->
      <button 
        @click="openCreateForm" 
        class="mb-6 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium flex items-center"
      >
        <span class="material-icons mr-2">add</span> Create New Game
      </button>

      <!-- Create Game Modal -->
      <div v-if="showCreateForm" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold">Create New Game</h2>
            <button @click="closeCreateForm" class="text-gray-500 hover:text-gray-700">
              <span class="material-icons">close</span>
            </button>
          </div>
          
          <!-- Form Error -->
          <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {{ error }}
          </div>
          
          <!-- Create Game Form -->
          <form @submit.prevent="handleCreateGame" class="space-y-4">
            <!-- Teams Section (side by side) -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- My Team Section -->
              <div class="border p-3 rounded-lg border-gray-200">
                <h3 class="font-medium mb-3">My Team</h3>
                <div class="space-y-3">
                  <div>
                    <label class="block text-gray-700 mb-1">Team Name</label>
                    <div class="relative team-suggestions-container">
                      <input 
                        v-model="newGame.myTeam" 
                        type="text" 
                        required
                        class="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter team name or select below"
                        @focus="showMyTeamSuggestions = true"
                      />
                      <div 
                        v-if="showMyTeamSuggestions && teams.length > 0" 
                        class="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                      >
                        <div 
                          v-for="team in teams" 
                          :key="team.id" 
                          @click="selectMyTeam(team)"
                          class="p-2 hover:bg-blue-50 cursor-pointer"
                        >
                          {{ team.name }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Opponent Team Section -->
              <div class="border p-3 rounded-lg border-gray-200">
                <h3 class="font-medium mb-3">Opponent Team</h3>
                <div class="space-y-3">
                  <div>
                    <label class="block text-gray-700 mb-1">Team Name</label>
                    <input 
                      v-model="newGame.oppTeam" 
                      type="text" 
                      required
                      class="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter opponent team name"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Game Name (Auto-generated) -->
            <div>
              <label class="block text-gray-700 mb-1">Game Name</label>
              <input 
                v-model="newGame.game" 
                type="text" 
                readonly
                class="w-full border border-gray-300 rounded-lg p-2 bg-gray-50 focus:outline-none"
                placeholder="Game name is auto-generated from team names"
              />
              <p class="text-xs text-gray-500 mt-1">Game name is auto-generated from team names</p>
            </div>
            
            <!-- Sets -->
            <div>
              <label class="block text-gray-700 mb-1">Sets</label>
              <select 
                v-model.number="newGame.sets" 
                required
                class="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="3">Best of 3</option>
                <option value="5">Best of 5</option>
              </select>
            </div>
            
            <!-- Season -->
            <div>
              <label class="block text-gray-700 mb-1">Season</label>
              <input 
                v-model="newGame.season" 
                type="text" 
                class="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 2024-2025"
              />
              <p class="text-xs text-gray-500 mt-1">Current season format is year-year (e.g., 2024-2025)</p>
            </div>
            
            <!-- Form Actions -->
            <div class="flex justify-end space-x-3 pt-2">
              <button 
                type="button" 
                @click="closeCreateForm"
                class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
              >
                Cancel
              </button>
              <button 
                type="submit"
                :disabled="loading"
                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center"
              >
                <span v-if="loading" class="material-icons animate-spin mr-2">refresh</span>
                {{ loading ? 'Creating...' : 'Create Game' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Search Bar -->
      <div class="mb-4">
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Search games..."
          class="w-full p-2 border border-gray-300 rounded-lg"
        />
      </div>

      <!-- Loading indicator -->
      <div v-if="loading && !games.length" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>

      <!-- Data display -->
      <div v-if="filteredGames.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div 
          v-for="game in filteredGames" 
          :key="game.id" 
          class="bg-white p-6 rounded-lg shadow-lg border-l-4 border-blue-500 cursor-pointer hover:shadow-xl transition-shadow"
          @click="openGameOverview(game)"
        >
          <h2 class="text-2xl font-bold mb-4 text-center py-2">{{ game.game }}</h2>
          
          <div class="flex justify-between mt-4">
            <div class="text-sm text-gray-500">
              <p>Sets: {{ game.sets }} (Best of {{ game.maxSets || game.sets }})</p>
            </div>
            <div class="text-sm text-gray-500">
              <p>{{ formatDate(game.created_at) }}</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- No games found message -->
      <div v-else-if="!loading" class="text-center py-12">
        <p class="text-gray-500 text-lg mb-4">No games found.</p>
        <button 
          @click="openCreateForm"
          class="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium"
        >
          Create your first game
        </button>
      </div>

      <!-- Game Overview Modal -->
      <div v-if="showGameOverview" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-lg shadow-lg p-6 w-full max-w-xl">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold">Game Overview</h2>
            <button @click="closeGameOverview" class="text-gray-500 hover:text-gray-700">
              <span class="material-icons">close</span>
            </button>
          </div>
          
          <div v-if="selectedGame" class="space-y-4">
            <!-- Game Header -->
            <div class="border-b pb-4">
              <h3 class="text-2xl font-bold text-center mb-2">{{ selectedGame.game }}</h3>
              <p class="text-center text-gray-500">Created on {{ formatDate(selectedGame.created_at) }}</p>
            </div>
            
            <!-- Team & Score Information -->
            <div class="flex justify-between items-center py-4">
              <div class="text-center w-2/5">
                <h4 class="text-lg font-bold">{{ selectedGame.myTeam }}</h4>
                <p class="text-3xl font-bold mt-2">{{ selectedGame.myPts || 0 }}</p>
              </div>
              <div class="text-center">
                <span class="text-gray-500">vs</span>
              </div>
              <div class="text-center w-2/5">
                <h4 class="text-lg font-bold">{{ selectedGame.oppTeam }}</h4>
                <p class="text-3xl font-bold mt-2">{{ selectedGame.oppPts || 0 }}</p>
              </div>
            </div>
            
            <!-- Set Scores Table -->
            <div v-if="parsedSetScores.length > 0" class="pt-4 border-t">
              <h4 class="font-bold text-lg mb-2">Set Scores</h4>
              <div class="overflow-x-auto">
                <table class="min-w-full">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Set</th>
                      <th class="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{{ selectedGame.myTeam }}</th>
                      <th class="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">{{ selectedGame.oppTeam }}</th>
                      <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Winner</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white">
                    <tr v-for="(set, index) in parsedSetScores" :key="index" class="border-t border-gray-200">
                      <td class="px-4 py-2 text-left">{{ index + 1 }}</td>
                      <td class="px-4 py-2 text-center font-medium">{{ getHomeScore(set) }}</td>
                      <td class="px-4 py-2 text-center font-medium">{{ getAwayScore(set) }}</td>
                      <td class="px-4 py-2 text-right">
                        <span 
                          :class="getHomeScore(set) > getAwayScore(set) ? 'text-green-600' : 'text-red-600'"
                        >
                          {{ getHomeScore(set) > getAwayScore(set) ? selectedGame.myTeam : selectedGame.oppTeam }}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <!-- Sets Summary -->
              <div class="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p class="text-gray-600 text-sm">Number of Sets:</p>
                  <p class="font-semibold">{{ parsedSetScores.length }} (Best of {{ selectedGame.maxSets || selectedGame.sets }})</p>
                </div>
                <div>
                  <p class="text-gray-600 text-sm">Result:</p>
                  <p class="font-semibold">
                    <span 
                      :class="selectedGame.myPts > selectedGame.oppPts ? 'text-green-600' : 'text-red-600'"
                    >
                      {{ selectedGame.myPts > selectedGame.oppPts ? 'Win' : 'Loss' }}
                    </span>
                  </p>
                </div>
              </div>
            </div>
            
            <!-- Action Buttons -->
            <div class="flex flex-wrap justify-center gap-3 pt-4 border-t">
              <!-- Delete Game Button -->
              <button 
                @click="confirmDelete(selectedGame)"
                class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Delete Confirmation Modal -->
      <div v-if="showDeleteConfirmation" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-lg shadow-lg p-6 max-w-md">
          <div class="mb-4">
            <h2 class="text-xl font-bold text-gray-800">Confirm Deletion</h2>
          </div>
          
          <div class="mb-6">
            <p class="text-gray-600">Are you sure you want to delete <span class="font-semibold">{{ selectedGame?.game }}</span>?</p>
            <p class="text-gray-600 mt-2">This action cannot be undone.</p>
          </div>
          
          <div class="flex justify-end space-x-3">
            <button 
              @click="showDeleteConfirmation = false"
              class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
            >
              Cancel
            </button>
            <button 
              @click="handleDeleteGame"
              :disabled="isDeleting"
              class="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center"
            >
              <span v-if="isDeleting" class="material-icons animate-spin mr-2 text-sm">refresh</span>
              {{ isDeleting ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import { useGames } from '../composable/useGames'
import { useTeams } from '../composable/useTeams'
import { useRouter } from 'vue-router'
import { gameService } from '../services/gameService'

export default {
  name: 'Matches',
  components: {
    DashboardLayout
  },
  setup() {
    const { games, loading, error, fetchMyGames, createGame, deleteGame } = useGames()
    const { teams, fetchTeams } = useTeams()
    const searchQuery = ref('')
    const showCreateForm = ref(false)
    const router = useRouter()
    const isLoading = ref(false)
    
    // Team selection state
    const showMyTeamSuggestions = ref(false)
    
    // Game overview state
    const showGameOverview = ref(false)
    const selectedGame = ref(null)
    
    // Delete confirmation state
    const showDeleteConfirmation = ref(false)
    const isDeleting = ref(false)
    
    // Parse set scores from JSON string
    const parsedSetScores = computed(() => {
      if (!selectedGame.value || !selectedGame.value.setScores) {
        return [];
      }
      
      try {
        // Check if setScores is already an object or a JSON string
        let setScores;
        if (typeof selectedGame.value.setScores === 'string') {
          // If it's a string, parse it as JSON
          setScores = JSON.parse(selectedGame.value.setScores);
        } else {
          // If it's already an object, use it directly
          setScores = selectedGame.value.setScores;
        }
        
        // Return as array if it's an array, otherwise convert from object to array
        let scoresArray = [];
        if (Array.isArray(setScores)) {
          scoresArray = setScores;
        } else if (setScores && typeof setScores === 'object') {
          // Handle if it's stored as an object with keys like "0", "1", "2"
          scoresArray = Object.values(setScores);
        }
        
        // Filter out sets that weren't actually played and limit to maxSets
        scoresArray = scoresArray.filter(set => 
          (getHomeScore(set) > 0 || getAwayScore(set) > 0) && !set.notPlayed && !set.placeholder
        );
        
        // Ensure we never show more sets than the match format allows
        const maxAllowedSets = selectedGame.value.maxSets || selectedGame.value.sets;
        if (scoresArray.length > maxAllowedSets) {
          console.warn(`Found ${scoresArray.length} sets but match format is best of ${maxAllowedSets}. Limiting display.`);
          scoresArray = scoresArray.slice(0, maxAllowedSets);
        }
        
        return scoresArray;
      } catch (error) {
        console.error('Error parsing set scores:', error);
        return [];
      }
    });
    
    // Get the home team's score from a set object, handling different property formats
    const getHomeScore = (set) => {
      if (!set) return 0;
      
      // Check different possible property names for the home score
      if (set.myTeam !== undefined) return set.myTeam;
      if (set.homeScore !== undefined) return set.homeScore;
      
      // If we have an object with myTeam property
      if (set.home !== undefined) return set.home;
      
      return 0;
    };
    
    // Get the away team's score from a set object, handling different property formats
    const getAwayScore = (set) => {
      if (!set) return 0;
      
      // Check different possible property names for the away score
      if (set.oppTeam !== undefined) return set.oppTeam;
      if (set.awayScore !== undefined) return set.awayScore;
      
      // If we have an object with oppTeam property
      if (set.away !== undefined) return set.away;
      
      return 0;
    };
    
    // Select a team from the dropdown
    const selectMyTeam = (team) => {
      newGame.value.myTeam = team.name
      showMyTeamSuggestions.value = false
    }
    
    // Close team suggestions when clicking outside
    const closeMyTeamSuggestions = () => {
      // Use setTimeout to allow the click event to complete first
      setTimeout(() => {
        showMyTeamSuggestions.value = false
      }, 200)
    }
    
    // Initialize: fetch teams and games
    onMounted(async () => {
      fetchGamesData()
      document.addEventListener('click', (e) => {
        const target = e.target
        if (!target.closest('.team-suggestions-container')) {
          closeMyTeamSuggestions()
        }
      })
      
      // Fetch teams
      if (teams.value.length === 0) {
        await fetchTeams({ myTeams: true })
      }
    })
    
    // Open game overview modal
    const openGameOverview = (game) => {
      selectedGame.value = game
      showGameOverview.value = true
    }
    
    // Close game overview modal
    const closeGameOverview = () => {
      showGameOverview.value = false
    }
    
    // New game form data
    const newGame = ref({
      game: '',
      myTeam: '',
      oppTeam: '',
      sets: 3,
      season: ''
    })
    
    // Auto-generate game name when team names change
    watch(() => newGame.value.myTeam, (newVal) => {
      if (newVal && newGame.value.oppTeam) {
        newGame.value.game = `${newVal} vs ${newGame.value.oppTeam}`
      } else if (newVal) {
        newGame.value.game = `${newVal} vs ...`
      } else if (newGame.value.oppTeam) {
        newGame.value.game = `... vs ${newGame.value.oppTeam}`
      } else {
        newGame.value.game = ''
      }
    })
    
    // Watch opponent team name changes
    watch(() => newGame.value.oppTeam, (newVal) => {
      if (newGame.value.myTeam && newVal) {
        newGame.value.game = `${newGame.value.myTeam} vs ${newVal}`
      } else if (newGame.value.myTeam) {
        newGame.value.game = `${newGame.value.myTeam} vs ...`
      } else if (newVal) {
        newGame.value.game = `... vs ${newVal}`
      } else {
        newGame.value.game = ''
      }
    })
    
    // Reset form to default values
    const resetForm = () => {
      newGame.value = {
        game: '',
        myTeam: '',
        oppTeam: '',
        sets: 3,
        season: getCurrentSeason()
      }
      showMyTeamSuggestions.value = false
    }
    
    // Get current season in YYYY-YYYY format
    const getCurrentSeason = () => {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      return `${currentYear}-${currentYear + 1}`;
    }
    
    // Reset error and form when opening the modal
    const openCreateForm = async () => {
      resetForm()
      error.value = '' // Clear any previous errors
      
      // Show the form immediately
      showCreateForm.value = true
      
      // Fetch teams in the background after showing the form
      // This prevents the UI from freezing while waiting for the API call
      setTimeout(async () => {
        try {
          if (teams.value.length === 0) {
            await fetchTeams({ myTeams: true })
          }
        } catch (err) {
          console.error('Error fetching teams:', err)
        }
      }, 100)
    }
    
    // Close form and clear errors
    const closeCreateForm = () => {
      error.value = '' // Clear errors when closing
      showCreateForm.value = false
      showMyTeamSuggestions.value = false
    }
    
    // Handle form submission
    const handleCreateGame = async () => {
      error.value = '' // Clear any previous errors
      
      try {
        // Set default point values to 0
        const gameData = {
          ...newGame.value,
          myPts: 0,
          oppPts: 0,
          // Set maxSets to the same value as sets
          maxSets: newGame.value.sets,
          // Set season if not provided
          season: newGame.value.season || getCurrentSeason(),
          // ServingTeam will use the database default
          // Initialize empty JSON strings for new fields
          setScores: '{}',
          setsWon: '{"home":0,"away":0}',
          currentSet: 1,
          isActive: true
        }
        
        console.log('Sending game data without servingTeam to use default:', gameData);
        
        const result = await createGame(gameData)
        console.log('Game creation result:', result);
        
        if (result && result.id) {
          // Reset form and close modal on success
          resetForm()
          showCreateForm.value = false
          
          // Redirect to the volleyball scoring page for the new game
          console.log('Redirecting to volleyball scoring page with ID:', result.id);
          router.push(`/volleyball-scoring/${result.id}`)
        } else {
          console.error('Invalid game creation result:', result);
          error.value = 'Failed to create game: Invalid response from server'
        }
      } catch (err) {
        console.error('Error in form submission:', err)
        error.value = `Failed to create game: ${err.message || 'Unknown error'}`
      }
    }
    
    // Fetch games from API
    const fetchGamesData = async () => {
      isLoading.value = true
      try {
        // Fetch only the user's games using the gameService
        const myGames = await gameService.getMyGames()
        games.value = myGames
      } catch (error) {
        console.error('Error fetching games:', error)
      } finally {
        isLoading.value = false
      }
    }
    
    // Handle game deletion
    const handleDeleteGame = async () => {
      if (!selectedGame.value || !selectedGame.value.id) {
        return
      }
      
      isDeleting.value = true
      
      try {
        await deleteGame(selectedGame.value.id)
        
        // Close both modals
        showDeleteConfirmation.value = false
        showGameOverview.value = false
        
        // Refresh the games list
        await fetchGamesData()
      } catch (err) {
        console.error('Error deleting game:', err)
        error.value = `Failed to delete game: ${err.message || 'Unknown error'}`
      } finally {
        isDeleting.value = false
      }
    }

    // Open delete confirmation dialog
    const confirmDelete = (game) => {
      selectedGame.value = game
      showDeleteConfirmation.value = true
    }

    // Filter games based on search query
    const filteredGames = computed(() => {
      if (!searchQuery.value) return games.value
      
      const query = searchQuery.value.toLowerCase()
      return games.value.filter(game => 
        game.game.toLowerCase().includes(query) ||
        game.myTeam.toLowerCase().includes(query) ||
        game.oppTeam.toLowerCase().includes(query)
      )
    })
    
    // Format date for display
    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleDateString()
    }

    // Return all the reactive properties and methods
    return { 
      games, 
      loading, 
      error, 
      searchQuery, 
      filteredGames,
      showCreateForm,
      newGame,
      handleCreateGame,
      formatDate,
      resetForm,
      openCreateForm,
      closeCreateForm,
      // Team selection
      teams,
      showMyTeamSuggestions,
      selectMyTeam,
      // Game overview
      showGameOverview,
      selectedGame,
      openGameOverview,
      closeGameOverview,
      parsedSetScores,
      getHomeScore,
      getAwayScore,
      // Delete game
      showDeleteConfirmation,
      isDeleting,
      handleDeleteGame,
      confirmDelete,
      // Fetch games data
      fetchGamesData
    }
  }
}
</script>

<style scoped>
/* Add your styles here */
</style>