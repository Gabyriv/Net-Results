<template>
  <div class="bg-white rounded-lg shadow-lg p-4">
    <!-- Game Header -->
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-xl font-bold">{{ game.game }}</h2>
      <div class="text-sm text-gray-500">{{ formatDate(game.created_at) }}</div>
    </div>

    <!-- Match Complete Banner -->
    <div v-if="matchComplete" class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4 text-center">
      <p class="font-bold text-lg">Match Complete!</p>
      <p>{{ setsWon.home > setsWon.away ? game.myTeam : game.oppTeam }} wins the match!</p>
      <p class="mt-2 text-sm">
        {{ setsWon.home > setsWon.away ? game.myTeam : game.oppTeam }} won {{ setsWon.home > setsWon.away ? setsWon.home : setsWon.away }} 
        out of {{ Math.ceil(game.maxSets / 2) }} required sets in a Best of {{ game.maxSets }} format
      </p>
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
        <!-- Progress bar for home team -->
        <div class="flex justify-center space-x-2">
          <button 
            @click="updateScore('home', -1)" 
            :disabled="matchComplete"
            class="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-full"
            :class="{ 'opacity-50 cursor-not-allowed': matchComplete }"
          >
            <span class="material-icons">remove</span>
          </button>
          <button 
            @click="updateScore('home', 1)" 
            :disabled="matchComplete"
            class="bg-green-100 hover:bg-green-200 text-green-700 p-2 rounded-full"
            :class="{ 'opacity-50 cursor-not-allowed': matchComplete }"
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
              :disabled="matchComplete"
              class="w-6 h-6 rounded-full"
              :class="[
                timeouts.home[i-1] ? 'bg-red-500' : 'bg-gray-300 hover:bg-gray-400',
                matchComplete ? 'opacity-50 cursor-not-allowed' : ''
              ]"
            >
            </button>
          </div>
        </div>
        <button 
          @click="toggleServing('home')" 
          :disabled="matchComplete"
          class="mt-4 px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded"
          :class="{ 'opacity-50 cursor-not-allowed': matchComplete }"
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
        <!-- Progress bar for away team -->
        <div class="flex justify-center space-x-2">
          <button 
            @click="updateScore('away', -1)" 
            :disabled="matchComplete"
            class="bg-red-100 hover:bg-red-200 text-red-700 p-2 rounded-full"
            :class="{ 'opacity-50 cursor-not-allowed': matchComplete }"
          >
            <span class="material-icons">remove</span>
          </button>
          <button 
            @click="updateScore('away', 1)" 
            :disabled="matchComplete"
            class="bg-green-100 hover:bg-green-200 text-green-700 p-2 rounded-full"
            :class="{ 'opacity-50 cursor-not-allowed': matchComplete }"
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
              :disabled="matchComplete"
              class="w-6 h-6 rounded-full"
              :class="[
                timeouts.away[i-1] ? 'bg-red-500' : 'bg-gray-300 hover:bg-gray-400',
                matchComplete ? 'opacity-50 cursor-not-allowed' : ''
              ]"
            >
            </button>
          </div>
        </div>
        <button 
          @click="toggleServing('away')" 
          :disabled="matchComplete"
          class="mt-4 px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded"
          :class="{ 'opacity-50 cursor-not-allowed': matchComplete }"
        >
          Service
        </button>
      </div>
    </div>

    <!-- Set Controls and History -->
    <div class="border-t pt-4">
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-bold">
          Current Set: {{ currentSetIndex + 1 }}
          <span v-if="matchComplete" class="text-sm text-green-600 ml-2">(Match Complete)</span>
          <span v-else class="text-sm text-blue-600 ml-2">(First to {{ currentSetTargetScore }})</span>
        </h3>
        <div>
          <button 
            @click="finishSet" 
            :disabled="matchComplete || !canFinishSet"
            class="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded-lg text-sm mr-2"
            :class="{ 'opacity-50 cursor-not-allowed': matchComplete || !canFinishSet }"
            :title="!canFinishSet && !matchComplete ? 'A team must win by at least 2 points' : ''"
          >
            Finish Set
          </button>
          <button 
            @click="resetSet" 
            :disabled="matchComplete"
            class="bg-gray-200 hover:bg-gray-300 text-gray-700 py-1 px-3 rounded-lg text-sm"
            :class="{ 'opacity-50 cursor-not-allowed': matchComplete }"
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
              <th class="py-2 px-4 border-b border-gray-200 bg-gray-50 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(set, index) in setHistory" :key="`set-${index}`" class="border-b border-gray-200">
              <td class="py-2 px-4 text-sm text-gray-500">
                Set {{ index + 1 }}
                <span class="text-xs text-gray-400">(to {{ getTargetScoreForSet(index) }})</span>
              </td>
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
              <td class="py-2 px-4 text-center text-sm">
                <span 
                  v-if="isSetAfterMatchComplete(index)"
                  class="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium"
                >
                  Extra Set
                </span>
                <span 
                  v-else-if="isSetDecisive(index)"
                  class="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium"
                >
                  Match Point
                </span>
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
        {{ isSaving ? 'Saving...' : (matchComplete ? 'Save Completed Match' : 'Save Game') }}
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
      
      // Only count sets up to the maximum allowed by the match format
      const maxAllowedSets = game.value.maxSets;
      
      setHistory.value.slice(0, maxAllowedSets).forEach(set => {
        if (set.homeScore > set.awayScore) result.home++
        else if (set.awayScore > set.homeScore) result.away++
      })
      
      return result
    })
    
    // Determine if the match is complete based on maxSets
    const matchComplete = computed(() => {
      // Calculate sets needed to win (best of 3 = 2 sets, best of 5 = 3 sets)
      const setsToWin = Math.ceil(game.value.maxSets / 2);
      
      // Match is complete if either team has won enough sets
      return setsWon.value.home >= setsToWin || setsWon.value.away >= setsToWin;
    })
    
    // Helper function to determine if a set was played after the match was technically complete
    const isSetAfterMatchComplete = (setIndex) => {
      // If this set is beyond the maximum allowed sets, it's definitely an extra set
      if (setIndex >= game.value.maxSets) {
        return true;
      }
      
      const setsToWin = Math.ceil(game.value.maxSets / 2);
      let homeWins = 0;
      let awayWins = 0;
      
      // Count set wins up to the current set
      for (let i = 0; i <= setIndex; i++) {
        if (i === setIndex) break; // Don't count the current set
        
        if (setHistory.value[i].homeScore > setHistory.value[i].awayScore) {
          homeWins++;
        } else if (setHistory.value[i].awayScore > setHistory.value[i].homeScore) {
          awayWins++;
        }
        
        // Check if match was already complete before this set
        if (homeWins >= setsToWin || awayWins >= setsToWin) {
          return true;
        }
      }
      
      return false;
    }
    
    // Helper function to determine if a set was the decisive one (match point)
    const isSetDecisive = (setIndex) => {
      const setsToWin = Math.ceil(game.value.maxSets / 2);
      let homeWins = 0;
      let awayWins = 0;
      
      // Count set wins up to but not including the current set
      for (let i = 0; i < setIndex; i++) {
        if (setHistory.value[i].homeScore > setHistory.value[i].awayScore) {
          homeWins++;
        } else if (setHistory.value[i].awayScore > setHistory.value[i].homeScore) {
          awayWins++;
        }
      }
      
      // Now check if this set made one team reach the winning threshold
      if (setHistory.value[setIndex].homeScore > setHistory.value[setIndex].awayScore) {
        homeWins++;
      } else if (setHistory.value[setIndex].awayScore > setHistory.value[setIndex].homeScore) {
        awayWins++;
      }
      
      // If after this set, the match was complete, and wasn't already complete, this was the decisive set
      return (homeWins === setsToWin || awayWins === setsToWin) && !isSetAfterMatchComplete(setIndex);
    }
    
    // Determine the target score for the current set
    const currentSetTargetScore = computed(() => {
      // Deciding set (last set of the match) goes to 15, otherwise 25
      const isDecidingSet = currentSetIndex.value + 1 === game.value.maxSets;
      return isDecidingSet ? 15 : 25;
    });
    
    // Helper function to determine the target score for any set
    const getTargetScoreForSet = (setIndex) => {
      // Deciding set (last set of the match) goes to 15, otherwise 25
      const isDecidingSet = setIndex + 1 === game.value.maxSets;
      return isDecidingSet ? 15 : 25;
    };
    
    // Format date for display
    const formatDate = (dateString) => {
      const date = new Date(dateString)
      return date.toLocaleDateString()
    }
    
    // Update score
    const updateScore = (team, points) => {
      // Prevent scoring if match is complete
      if (matchComplete.value) {
        alert('Match is already complete. Cannot update score.');
        return;
      }
      
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
      // Prevent changing serve if match is complete
      if (matchComplete.value) {
        alert('Match is already complete. Cannot change serving team.');
        return;
      }
      
      isServing.value = team
    }
    
    // Toggle a timeout for a team
    const toggleTimeout = (team, index) => {
      // Prevent timeout changes if match is complete
      if (matchComplete.value) {
        alert('Match is already complete. Cannot change timeouts.');
        return;
      }
      
      timeouts[team][index] = !timeouts[team][index]
    }
    
    // Check if a set can be finished (a team must win by at least 2 points)
    const canFinishSet = computed(() => {
      const homeScore = currentSet.homeScore;
      const awayScore = currentSet.awayScore;
      
      // Determine if this is a deciding set (3rd set in best of 3, or 5th set in best of 5)
      const isDecidingSet = currentSetIndex.value + 1 === game.value.maxSets;
      
      // Points needed based on set type
      const pointsNeeded = isDecidingSet ? 15 : 25;
      
      // Must win by 2 points and reach minimum points needed
      if ((homeScore >= pointsNeeded || awayScore >= pointsNeeded) && 
          Math.abs(homeScore - awayScore) >= 2) {
        return true;
      }
      
      // For extended sets, still need a 2-point lead
      const minExtendedPoints = isDecidingSet ? 14 : 24;
      if (homeScore >= minExtendedPoints && awayScore >= minExtendedPoints && 
          Math.abs(homeScore - awayScore) >= 2) {
        return true;
      }
      
      return false;
    });
    
    // Finish the current set and start a new one
    const finishSet = () => {
      // Check if the set can be finished (need to win by 2)
      if (!canFinishSet.value) {
        alert('A team must win by at least 2 points to finish a set.');
        return;
      }
      
      // Add the current set to history
      setHistory.value.push({
        homeScore: currentSet.homeScore,
        awayScore: currentSet.awayScore
      })
      
      // Auto-save after finishing a set
      saveGame()
      
      // Check if the match is complete
      if (matchComplete.value) {
        alert(`Match complete! ${setsWon.value.home > setsWon.value.away ? game.value.myTeam : game.value.oppTeam} wins!`);
        
        // Auto-exit after a short delay (2 seconds) to give user time to see the completion message
        setTimeout(() => {
          emit('exit');
        }, 2000);
        
        return;
      }
      
      // Check if we've already played all sets for this match format
      if (setHistory.value.length >= game.value.maxSets) {
        alert(`Maximum number of sets (${game.value.maxSets}) for this match format has been reached.`);
        return;
      }
      
      // Reset scores and timeouts for the next set
      currentSet.homeScore = 0
      currentSet.awayScore = 0
      timeouts.home = [false, false]
      timeouts.away = [false, false]
      
      // Increment set index
      currentSetIndex.value++
      
      // Alternate serve for new set
      isServing.value = isServing.value === 'home' ? 'away' : 'home'
    }
    
    // Reset the current set
    const resetSet = () => {
      // Don't allow reset if match is complete
      if (matchComplete.value) {
        alert('Match is already complete. Cannot reset the current set.');
        return;
      }
      
      if (confirm('Are you sure you want to reset the current set?')) {
        currentSet.homeScore = 0
        currentSet.awayScore = 0
        timeouts.home = [false, false]
        timeouts.away = [false, false]
      }
    }
    
    // Load game data
    const loadGame = async () => {
      if (!props.gameId) {
        console.error('Cannot load game: No gameId provided', props.gameId)
        return
      }
      
      console.log('Loading game data for ID:', props.gameId)
      
      try {
        // Fetch the game
        const gameData = await realtimeService.getGameState(props.gameId)
        
        if (gameData) {
          game.value = gameData
          console.log('Loaded game data:', gameData)
          
          // If we have set scores saved, restore them
          if (gameData.setScores) {
            try {
              // Handle different formats of setScores (string, object, or array)
              let scores;
              
              if (typeof gameData.setScores === 'string') {
                // If it's a string, try to parse it
                scores = JSON.parse(gameData.setScores);
                console.log('Parsed setScores from string:', scores);
              } else if (typeof gameData.setScores === 'object') {
                // If it's already an object (from Prisma's JSON fields)
                scores = gameData.setScores;
                console.log('Using setScores as object:', scores);
              } else {
                console.warn('Unexpected setScores data type:', typeof gameData.setScores);
                scores = [];
              }
              
              // Ensure it's an array
              if (!Array.isArray(scores)) {
                console.warn('setScores is not an array, using empty array instead:', scores);
                scores = [];
              }
              
              // Handle the set history
              if (scores.length > 0) {
                // Last set is the current set
                const lastSet = scores.pop();
                
                if (lastSet) {
                  if (lastSet.inProgress) {
                    // Restore the current set
                    currentSet.homeScore = lastSet.homeScore || 0;
                    currentSet.awayScore = lastSet.awayScore || 0;
                    console.log('Restored current set:', currentSet);
                  } else {
                    // It's a completed set, add to history
                    scores.push(lastSet);
                    console.log('Added complete set to history');
                  }
                }
                
                setHistory.value = scores;
                currentSetIndex.value = scores.length;
                console.log('Set history updated, current set index:', currentSetIndex.value);
              }
            } catch (e) {
              console.error('Error processing set scores:', e);
            }
          }
          
          // Process setsWon data if available
          if (gameData.setsWon) {
            try {
              let setsWonData;
              
              if (typeof gameData.setsWon === 'string') {
                setsWonData = JSON.parse(gameData.setsWon);
                console.log('Parsed setsWon from string:', setsWonData);
              } else if (typeof gameData.setsWon === 'object') {
                setsWonData = gameData.setsWon;
                console.log('Using setsWon as object:', setsWonData);
              }
              
              // We don't need to update setsWon since it's a computed property
              // that's calculated from setHistory
            } catch (e) {
              console.error('Error processing setsWon data:', e);
            }
          }
        }
      } catch (error) {
        console.error('Error loading game:', error);
        alert('Error loading game data. Please try refreshing the page.');
      }
    }
    
    // Save the game state
    const saveGame = async () => {
      if (!props.gameId) {
        console.error('Cannot save game: No gameId provided', props.gameId);
        alert('Error: Game ID is missing. Please refresh the page and try again.');
        return;
      }
      
      isSaving.value = true;
      console.log('Saving game with ID:', props.gameId);
      
      try {
        // Calculate total points from set history and current set
        let myTotalPts = currentSet.homeScore;
        let oppTotalPts = currentSet.awayScore;
        
        setHistory.value.forEach(set => {
          myTotalPts += set.homeScore;
          oppTotalPts += set.awayScore;
        });
        
        // Create an array of all sets including current
        const allSets = [
          ...setHistory.value, 
          {
            homeScore: currentSet.homeScore,
            awayScore: currentSet.awayScore,
            inProgress: true
          }
        ];
        
        // Ensure all numeric values are proper numbers
        const gameId = parseInt(props.gameId);
        const myPts = Number(myTotalPts);
        const oppPts = Number(oppTotalPts);
        const currentSetNum = Number(currentSetIndex.value + 1);
        
        // Make sure setScores is a proper array before stringifying
        let setScoresString;
        try {
          // Determine how many total sets there should be based on maxSets
          const totalSets = game.value.sets;
          
          // First ensure we have a valid array for the played sets
          const validSets = allSets.map(set => ({
            homeScore: Number(set.homeScore || 0),
            awayScore: Number(set.awayScore || 0),
            inProgress: !!set.inProgress
          }));
          
          // If match is complete, ensure all sets from the game are represented
          // and mark unplayed sets appropriately
          if (matchComplete.value && validSets.length < totalSets) {
            // How many sets were actually needed to determine the winner
            const setsToWin = Math.ceil(game.value.maxSets / 2);
            const setsPlayed = setHistory.value.length;
            
            // If a team already won, add placeholder sets for remaining unplayed sets
            if ((setsWon.value.home >= setsToWin || setsWon.value.away >= setsToWin) && setsPlayed < totalSets) {
              // Add empty sets marked as "not played" for the remaining sets
              for (let i = setsPlayed; i < totalSets; i++) {
                validSets.push({
                  homeScore: 0,
                  awayScore: 0,
                  notPlayed: true,
                  inProgress: false
                });
              }
            }
          }
          
          setScoresString = JSON.stringify(validSets);
          console.log('Formatted setScores as JSON string:', setScoresString);
        } catch (e) {
          console.error('Error stringifying setScores:', e);
          setScoresString = '[]'; // Fallback to empty array
        }
        
        // Make sure setsWon is a proper object
        let setsWonString;
        try {
          const validSetsWon = {
            home: Number(setsWon.value.home || 0),
            away: Number(setsWon.value.away || 0)
          };
          setsWonString = JSON.stringify(validSetsWon);
          console.log('Formatted setsWon as JSON string:', setsWonString);
        } catch (e) {
          console.error('Error stringifying setsWon:', e);
          setsWonString = '{"home":0,"away":0}'; // Fallback to zeros
        }
        
        // Update the game data - only include fields defined in GameUpdateSchema
        const gameData = {
          myPts,
          oppPts,
          setScores: setScoresString,
          setsWon: setsWonString,
          currentSet: currentSetNum
        };
        
        console.log('Updating game with data:', gameData);
        const updatedGame = await realtimeService.updateGame(gameId, gameData);
        
        if (updatedGame) {
          console.log('Game updated successfully:', updatedGame);
          emit('updated', updatedGame);
        }
      } catch (error) {
        console.error('Failed to save game:', error);
        alert('Failed to save game. Please try again.');
      } finally {
        isSaving.value = false;
      }
    }
    
    // Set up real-time subscription
    let subscription = null
    
    const setupRealtimeSubscription = () => {
      if (!props.gameId) {
        console.error('Cannot set up subscription: Invalid gameId', props.gameId)
        return
      }
      
      console.log('Setting up realtime subscription for game ID:', props.gameId)
      
      subscription = realtimeService.subscribeToGame(props.gameId, (updatedGame) => {
        // Only update if this is not our own update
        if (!isSaving.value) {
          console.log('Received real-time update for game:', updatedGame);
          game.value = updatedGame
          
          // We don't need to manually update scores since loadGame will handle it
          // when we call it with the updated game data
          loadGame();
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
      matchComplete,
      canFinishSet,
      formatDate,
      updateScore,
      toggleServing,
      toggleTimeout,
      finishSet,
      resetSet,
      saveGame,
      isSetAfterMatchComplete,
      isSetDecisive,
      currentSetTargetScore,
      getTargetScoreForSet
    }
  }
}
</script> 