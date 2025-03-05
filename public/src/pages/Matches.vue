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
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-gray-700 mb-1">My Team</label>
                <input 
                  v-model="newGame.myTeam" 
                  type="text" 
                  required
                  class="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Team A"
                />
              </div>
              <div>
                <label class="block text-gray-700 mb-1">Opponent Team</label>
                <input 
                  v-model="newGame.oppTeam" 
                  type="text" 
                  required
                  class="w-full border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Team B"
                />
              </div>
            </div>
            
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
          class="bg-white p-6 rounded-lg shadow-lg border-l-4 border-blue-500"
        >
          <h2 class="text-xl font-bold mb-2">{{ game.game }}</h2>
          <div class="flex justify-between mb-2">
            <div class="text-center flex-1">
              <p class="font-bold text-gray-700">{{ game.myTeam }}</p>
            </div>
            <div class="text-center text-gray-500 flex items-center">
              <span>vs</span>
            </div>
            <div class="text-center flex-1">
              <p class="font-bold text-gray-700">{{ game.oppTeam }}</p>
            </div>
          </div>
          <div class="flex justify-between mt-4">
            <div class="text-sm text-gray-500">
              <p>Sets: {{ game.sets }}</p>
            </div>
            <div class="text-sm text-gray-500">
              <p>{{ formatDate(game.created_at) }}</p>
            </div>
            <router-link 
              :to="`/volleyball-scoring/${game.id}`" 
              class="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Start Scoring
            </router-link>
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
    </div>
  </DashboardLayout>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import { useGames } from '../composable/useGames'

export default {
  name: 'Matches',
  components: {
    DashboardLayout
  },
  setup() {
    const { games, loading, error, fetchGames, createGame } = useGames()
    const searchQuery = ref('')
    const showCreateForm = ref(false)
    
    // New game form data
    const newGame = ref({
      game: '',
      myTeam: '',
      oppTeam: '',
      sets: 3
    })
    
    // Auto-generate game name when team names change
    watch([() => newGame.value.myTeam, () => newGame.value.oppTeam], ([myTeam, oppTeam]) => {
      if (myTeam && oppTeam) {
        newGame.value.game = `${myTeam} vs ${oppTeam}`
      } else if (myTeam) {
        newGame.value.game = `${myTeam} vs ...`
      } else if (oppTeam) {
        newGame.value.game = `... vs ${oppTeam}`
      } else {
        newGame.value.game = ''
      }
    })
    
    // Reset error and form when opening the modal
    const openCreateForm = () => {
      resetForm()
      error.value = '' // Clear any previous errors
      showCreateForm.value = true
    }
    
    // Close form and clear errors
    const closeCreateForm = () => {
      error.value = '' // Clear errors when closing
      showCreateForm.value = false
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
    
    // Handle form submission
    const handleCreateGame = async () => {
      error.value = '' // Clear any previous errors
      
      try {
        // Set default point values to 0
        const gameData = {
          ...newGame.value,
          myPts: 0,
          oppPts: 0
        }
        
        const result = await createGame(gameData)
        if (result) {
          // Reset form and close modal on success
          resetForm()
          showCreateForm.value = false
        }
      } catch (err) {
        console.error('Error in form submission:', err)
      }
    }
    
    // Reset form to default values
    const resetForm = () => {
      newGame.value = {
        game: '',
        myTeam: '',
        oppTeam: '',
        sets: 3
      }
    }

    // Fetch games on component mount
    onMounted(() => {
      fetchGames()
    })

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
      closeCreateForm
    }
  }
}
</script>

<style scoped>
/* Add any specific custom styles for your component */
</style>