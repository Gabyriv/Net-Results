<template>
  <DashboardLayout>
    <div class="container mx-auto p-4">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold">Score</h1>
        <router-link 
          to="/matches" 
          class="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-lg flex items-center"
        >
          <span class="material-icons mr-2">arrow_back</span>
          Back to Games
        </router-link>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {{ error }}
        <div class="mt-4">
          <router-link 
            to="/matches" 
            class="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
          >
            Return to Games
          </router-link>
        </div>
      </div>

      <!-- Scoreboard -->
      <div v-else-if="game">
        <VolleyballScoreboard 
          :gameId="gameId" 
          @exit="navigateToGames" 
          @updated="handleGameUpdated"
        />
      </div>
    </div>
  </DashboardLayout>
</template>

<script>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import VolleyballScoreboard from '../components/VolleyballScoreboard.vue'
import { useGames } from '../composable/useGames'

export default {
  name: 'VolleyballScoring',
  components: {
    DashboardLayout,
    VolleyballScoreboard
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const { fetchGameById } = useGames()
    
    // Component state
    const gameId = ref(route.params.id)
    const game = ref(null)
    const loading = ref(true)
    const error = ref(null)
    
    // Load game data
    const loadGame = async () => {
      loading.value = true
      error.value = null
      
      try {
        // Get game ID from route params and ensure it's a valid number
        const id = route.params.id
        if (!id) {
          throw new Error('Game ID is missing')
        }
        
        gameId.value = id
        
        console.log('Loading game with ID:', gameId.value)
        
        // Fetch game data
        const gameData = await fetchGameById(gameId.value)
        
        if (gameData) {
          game.value = gameData
        } else {
          throw new Error('Game not found')
        }
      } catch (err) {
        console.error('Error loading game:', err)
        error.value = `Failed to load game: ${err.message || 'Unknown error'}`
      } finally {
        loading.value = false
      }
    }
    
    // Handle game updates
    const handleGameUpdated = (updatedGame) => {
      game.value = updatedGame
    }
    
    // Navigate back to the games list
    const navigateToGames = () => {
      router.push('/matches')
    }
    
    onMounted(() => {
      loadGame()
    })
    
    return {
      gameId,
      game,
      loading,
      error,
      handleGameUpdated,
      navigateToGames
    }
  }
}
</script> 