<template>
  <div class="bg-white rounded-lg shadow-lg p-4">
    <!-- Game Header -->
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-xl font-bold">{{ game.game }}</h2>
      <div class="text-sm text-gray-500">{{ formatDate(game.created_at) }}</div>
    </div>

    <!-- Scoreboard -->
    <div class="grid grid-cols-2 gap-8 mb-6">
      <!-- Home Team -->
      <div 
        class="text-center p-4 rounded-lg" 
        :class="isServing === 'home' ? 'bg-blue-100 border border-blue-300' : 'bg-gray-50'"
      >
        <div class="flex justify-center items-center mb-2">
          <h3 class="text-lg font-bold">{{ game.myTeam }}</h3>
          <div v-if="isServing === 'home'" class="ml-2 text-blue-600">
            <span class="material-icons text-sm">sports_volleyball</span>
          </div>
        </div>
        <div class="text-5xl font-bold mb-4">{{ currentSet.homeScore }}</div>
        <div class="flex justify-center space-x-2">
          <button 
            @click="updateScore('home', -1)" 
            class="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-full"
          >
            <span class="material-icons">remove</span>
          </button>
          <button 
            @click="updateScore('home', 1)" 
            class="bg-green-100 hover:bg-green-200 text-green-700 p-2 rounded-full"
          >
            <span class="material-icons">add</span>
          </button>
        </div>
        <div class="mt-4">
          <div class="text-sm font-semibold mb-1">Sets Won</div>
          <div class="text-2xl font-bold">{{ setsWon.home }}</div>
        </div>
        <div class="mt-4">
          <div class="text-sm font-semibold mb-1">Timeouts</div>
          <div class="flex justify-center space-x-2">
            <button 
              v-for="i in 2" :key="`home-timeout-${i}`" 
              @click="toggleTimeout('home', i-1)"
              class="w-6 h-6 rounded-full"
              :class="timeouts.home[i-1] ? 'bg-red-500' : 'bg-gray-300 hover:bg-gray-400'"
            >
            </button>
          </div>
        </div>
        <button 
          @click="toggleServing('home')" 
          class="mt-4 px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded"
        >
          Service
        </button>
      </div>

      <!-- Away Team -->
      <div 
        class="text-center p-4 rounded-lg" 
        :class="isServing === 'away' ? 'bg-blue-100 border border-blue-300' : 'bg-gray-50'"
      >
        <div class="flex justify-center items-center mb-2">
          <h3 class="text-lg font-bold">{{ game.oppTeam }}</h3>
          <div v-if="isServing === 'away'" class="ml-2 text-blue-600">
            <span class="material-icons text-sm">sports_volleyball</span>
          </div>
        </div>
        <div class="text-5xl font-bold mb-4">{{ currentSet.awayScore }}</div>
        <div class="flex justify-center space-x-2">
          <button 
            @click="updateScore('away', -1)" 
            class="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-full"
          >
            <span class="material-icons">remove</span>
          </button>
          <button 
            @click="updateScore('away', 1)" 
            class="bg-green-100 hover:bg-green-200 text-green-700 p-2 rounded-full"
          >
            <span class="material-icons">add</span>
          </button>
        </div>
        <div class="mt-4">
          <div class="text-sm font-semibold mb-1">Sets Won</div>
          <div class="text-2xl font-bold">{{ setsWon.away }}</div>
        </div>
        <div class="mt-4">
          <div class="text-sm font-semibold mb-1">Timeouts</div>
          <div class="flex justify-center space-x-2">
            <button 
              v-for="i in 2" :key="`away-timeout-${i}`" 
              @click="toggleTimeout('away', i-1)"
              class="w-6 h-6 rounded-full"
              :class="timeouts.away[i-1] ? 'bg-red-500' : 'bg-gray-300 hover:bg-gray-400'"
            >
            </button>
          </div>
        </div>
        <button 
          @click="toggleServing('away')" 
          class="mt-4 px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded"
        >
          Service
        </button>
      </div>
    </div>

    <!-- Set Controls and History -->
    <div class="border-t pt-4">
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-bold">Current Set: {{ currentSetIndex + 1 }}</h3>
        <div>
          <button 
            @click="finishSet" 
            class="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded-lg text-sm mr-2"
          >
            Finish Set
          </button>
          <button 
            @click="resetSet" 
            class="bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 px-3 rounded-lg text-sm"
          >
            Reset Set
          </button>
        </div>
      </div>

      <!-- Set History -->
      <div class="overflow-x-auto">
        <table class="min-w-full bg-white">
          <thead>
            <tr>
              <th class="py-2 px-4 border-b border-gray-200 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Set
              </th>
              <th class="py-2 px-4 border-b border-gray-200 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                {{ game.myTeam }}
              </th>
              <th class="py-2 px-4 border-b border-gray-200 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                {{ game.oppTeam }}
              </th>
              <th class="py-2 px-4 border-b border-gray-200 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Winner
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(set, index) in setHistory" :key="`set-${index}`" class="border-b border-gray-200">
              <td class="py-2 px-4 text-sm text-gray-500">Set {{ index + 1 }}</td>
              <td class="py-2 px-4 text-center font-medium" :class="set.homeScore > set.awayScore ? 'text-green-600' : 'text-gray-900'">
                {{ set.homeScore }}
              </td>
              <td class="py-2 px-4 text-center font-medium" :class="set.awayScore > set.homeScore ? 'text-green-600' : 'text-gray-900'">
                {{ set.awayScore }}
              </td>
              <td class="py-2 px-4 text-center text-sm">
                <span v-if="set.homeScore > set.awayScore" class="text-green-600 font-medium">{{ game.myTeam }}</span>
                <span v-else-if="set.awayScore > set.homeScore" class="text-green-600 font-medium">{{ game.oppTeam }}</span>
                <span v-else class="text-gray-400">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Save and Exit -->
    <div class="flex justify-end space-x-3 mt-6 pt-4 border-t">
      <button 
        @click="$emit('exit')" 
        class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg"
      >
        Exit
      </button>
      <button 
        @click="saveGame" 
        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center"
      >
        <span v-if="isSaving" class="material-icons animate-spin mr-2">refresh</span>
        <span v-else class="material-icons mr-2">save</span>
        {{ isSaving ? 'Saving...' : 'Save Game' }}
      </button>
    </div>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { realtimeService } from '../services/realtimeService'
import { useGames } from '../composable/useGames'

export default {
  name: 'VolleyballScoreboard',
  props: {
    gameId: {
      type: [Number, String],
      required: true
    }
  },
  emits: ['exit', 'updated'],
  setup(props, { emit }) {
    const { updateGameScore } = useGames()
    const game = ref({
      id: null,
      game: '',
      myTeam: '',
      oppTeam: '',
      myPts: 0,
      oppPts: 0,
      sets: 3,
      created_at: new Date()
    })
    
    const isSaving = ref(false)
    const isServing = ref('home') // 'home' or 'away'
    
    // Set tracking
    const currentSetIndex = ref(0)
    const setHistory = ref([])
    const currentSet = reactive({
      homeScore: 0,
      awayScore: 0
    })
    
    // Timeouts tracking (2 per team per set)
    const timeouts = reactive({
      home: [false, false],
      away: [false, false]
    })
    
    // Computed properties
    const setsWon = computed(() => {
      const result = { home: 0, away: 0 }
      
      setHistory.value.forEach(set => {
        if (set.homeScore > set.awayScore) result.home++
        else if (set.awayScore > set.homeScore) result.away++
      })
      
      return result
    })
    
    // Format date for display
    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleDateString()
    }
    
    // Update score
    const updateScore = (team, points) => {
      if (team === 'home') {
        const newScore = currentSet.homeScore + points
        if (newScore >= 0) currentSet.homeScore = newScore
      } else {
        const newScore = currentSet.awayScore + points
        if (newScore >= 0) currentSet.awayScore = newScore
      }
      
      // If a team scores, they get the serve unless they already have it
      if (points > 0 && isServing.value !== team) {
        isServing.value = team
      }
    }
    
    // Toggle which team is serving
    const toggleServing = (team) => {
      isServing.value = team
    }
    
    // Toggle a timeout for a team
    const toggleTimeout = (team, index) => {
      timeouts[team][index] = !timeouts[team][index]
    }
    
    // Finish the current set and start a new one
    const finishSet = () => {
      // Add the current set to history
      setHistory.value.push({
        homeScore: currentSet.homeScore,
        awayScore: currentSet.awayScore
      })
      
      // Reset scores and timeouts for the next set
      currentSet.homeScore = 0
      currentSet.awayScore = 0
      timeouts.home = [false, false]
      timeouts.away = [false, false]
      
      // Increment set index
      currentSetIndex.value++
      
      // Alternate serve for new set
      isServing.value = isServing.value === 'home' ? 'away' : 'home'
      
      // Auto-save after finishing a set
      saveGame()
    }
    
    // Reset the current set
    const resetSet = () => {
      if (confirm('Are you sure you want to reset the current set?')) {
        currentSet.homeScore = 0
        currentSet.awayScore = 0
        timeouts.home = [false, false]
        timeouts.away = [false, false]
      }
    }
    
    // Save the game state
    const saveGame = async () => {
      isSaving.value = true
      
      try {
        // Calculate total points from set history and current set
        let myTotalPts = currentSet.homeScore
        let oppTotalPts = currentSet.awayScore
        
        setHistory.value.forEach(set => {
          myTotalPts += set.homeScore
          oppTotalPts += set.awayScore
        })
        
        // Update the game data
        const gameData = {
          id: game.value.id,
          myPts: myTotalPts,
          oppPts: oppTotalPts,
          setScores: JSON.stringify([...setHistory.value, {
            homeScore: currentSet.homeScore,
            awayScore: currentSet.awayScore,
            inProgress: true
          }]),
          setsWon: JSON.stringify(setsWon.value)
        }
        
        await updateGameScore(game.value.id, gameData)
        emit('updated', gameData)
      } catch (error) {
        console.error('Failed to save game:', error)
        alert('Failed to save game. Please try again.')
      } finally {
        isSaving.value = false
      }
    }
    
    // Load game data
    const loadGame = async () => {
      try {
        // Fetch the game
        const gameData = await realtimeService.getGameState(props.gameId)
        
        if (gameData) {
          game.value = gameData
          
          // If we have set scores saved, restore them
          if (gameData.setScores) {
            try {
              const scores = JSON.parse(gameData.setScores)
              
              // Last set is the current set
              const lastSet = scores.pop()
              
              if (lastSet) {
                if (lastSet.inProgress) {
                  // Restore the current set
                  currentSet.homeScore = lastSet.homeScore
                  currentSet.awayScore = lastSet.awayScore
                } else {
                  // It's a completed set, add to history
                  scores.push(lastSet)
                }
              }
              
              setHistory.value = scores
              currentSetIndex.value = scores.length
            } catch (e) {
              console.error('Error parsing set scores:', e)
            }
          }
        }
      } catch (error) {
        console.error('Error loading game:', error)
        alert('Error loading game data. Please try refreshing the page.')
      }
    }
    
    // Set up real-time subscription
    let subscription = null
    
    const setupRealtimeSubscription = () => {
      subscription = realtimeService.subscribeToGame(props.gameId, (updatedGame) => {
        // Only update if this is not our own update
        if (!isSaving.value) {
          game.value = updatedGame
          
          // Check if we need to update scores
          if (updatedGame.setScores) {
            try {
              const scores = JSON.parse(updatedGame.setScores)
              // Last set is the current set if it's marked as in progress
              const lastSet = scores[scores.length - 1]
              
              if (lastSet && lastSet.inProgress) {
                // Restore the current set if it differs from our current state
                if (lastSet.homeScore !== currentSet.homeScore || 
                    lastSet.awayScore !== currentSet.awayScore) {
                  currentSet.homeScore = lastSet.homeScore
                  currentSet.awayScore = lastSet.awayScore
                }
                
                // Remove the in-progress set for history
                setHistory.value = scores.slice(0, -1)
              } else {
                setHistory.value = scores
              }
            } catch (e) {
              console.error('Error parsing updated set scores:', e)
            }
          }
        }
      })
    }
    
    // Clean up on component unmount
    onBeforeUnmount(() => {
      if (subscription) {
        subscription.unsubscribe()
      }
    })
    
    // Auto-save on interval
    let autoSaveInterval
    
    onMounted(async () => {
      await loadGame()
      setupRealtimeSubscription()
      
      // Auto-save every minute
      autoSaveInterval = setInterval(() => {
        saveGame()
      }, 60000) // 1 minute
    })
    
    onBeforeUnmount(() => {
      clearInterval(autoSaveInterval)
    })
    
    return {
      game,
      isSaving,
      isServing,
      currentSetIndex,
      currentSet,
      setHistory,
      timeouts,
      setsWon,
      formatDate,
      updateScore,
      toggleServing,
      toggleTimeout,
      finishSet,
      resetSet,
      saveGame
    }
  }
}
</script> 