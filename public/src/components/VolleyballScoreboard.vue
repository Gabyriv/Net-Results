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
      
      <!-- Show stats summary button -->
      <button 
        v-if="playerStats.length > 0"
        @click="showStatsSummary = !showStatsSummary" 
        class="mt-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        {{ showStatsSummary ? 'Hide Stats Summary' : 'View Match Statistics' }}
      </button>
    </div>
    
    <!-- Match Statistics Summary -->
    <div v-if="matchComplete && showStatsSummary && playerStats.length > 0" class="mb-6">
      <PlayerStatsSummary 
        :stats="playerStats" 
        :teams="{ home: game.myTeam, away: game.oppTeam }" 
      />
    </div>

    <!-- Player Statistics Modal -->
    <div v-if="showStatModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h3 class="text-lg font-bold mb-4">
          {{ selectedPlayer.team === 'home' ? game.myTeam : game.oppTeam }} 
          <span v-if="selectedPlayer.number === 'E'">Error</span>
          <span v-else>
            - {{ selectedPlayer.name || `Player ${selectedPlayer.number}` }}
            <span class="text-sm text-gray-500">(#{{ selectedPlayer.number }})</span>
          </span>
        </h3>
        
        <!-- Stat Type Selection -->
        <div class="mb-4">
          <p class="text-sm text-gray-600 mb-2">Select Stat Type:</p>
          <div class="grid grid-cols-2 gap-2">
            <button 
              v-for="statType in statTypes" 
              :key="statType" 
              @click="selectedStatType = statType"
              class="py-2 px-4 rounded text-sm"
              :class="selectedStatType === statType ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'"
            >
              {{ statType }}
            </button>
          </div>
        </div>
        
        <!-- Stat Quality Selection -->
        <div v-if="selectedStatType" class="mb-6">
          <p class="text-sm text-gray-600 mb-2">Select Result:</p>
          <div class="flex space-x-4 justify-center">
            <button 
              @click="recordStat('+')"
              class="py-3 px-6 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 font-bold text-xl"
            >
              + <span class="text-xs block mt-1">Point</span>
            </button>
            <button 
              @click="recordStat('=')"
              class="py-3 px-6 rounded-lg bg-yellow-100 hover:bg-yellow-200 text-yellow-700 font-bold text-xl"
            >
              = <span class="text-xs block mt-1">Good</span>
            </button>
            <button 
              @click="recordStat('-')"
              class="py-3 px-6 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 font-bold text-xl"
            >
              - <span class="text-xs block mt-1">Error</span>
            </button>
          </div>
        </div>
        
        <div class="flex justify-end space-x-2">
          <button 
            @click="closeStatModal"
            class="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Action Popup -->
    <ActionPopup
      v-if="showActionPopup && dynamicSelectedPlayer"
      :player="dynamicSelectedPlayer"
      :onActionSelect="handleActionSelect"
      :onClose="closePopups"
    />

    <!-- Result Popup -->
    <ResultPopup
      v-if="showResultPopup && selectedAction"
      :action="selectedAction"
      :onResultSelect="handleResultSelect"
      :onClose="closePopups"
    />

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
        
        <!-- Player Selection Section -->
        <div class="mt-4 border-t pt-4">
          <CourtDisplay 
            :players="teamPlayers"
            @player-selected="handlePlayerSelected"
            @toggle-service="toggleServing('home')"
          />
        </div>
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
        
        <!-- Away team players -->
        <div class="mt-4 border-t pt-4">
          <CourtDisplay 
            :players="[]"  
            @player-selected="handleAwayPlayerSelected"
            @toggle-service="toggleServing('away')"
          />
          <!-- Away team has no players to display -->
        </div>
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

    <!-- Player Statistics Tracker -->
    <div class="mb-6" v-if="playerStats.length > 0">
      <PlayerStatsTracker 
        :stats="playerStats" 
        :teams="{ home: game.myTeam, away: game.oppTeam }" 
      />
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
import PlayerStatsTracker from './stats/PlayerStatsTracker.vue'
import PlayerStatsSummary from './stats/PlayerStatsSummary.vue'
import PlayerSquares from './PlayerSquares.vue'
import ActionPopup from './stats/ActionPopup.vue'
import ResultPopup from './stats/ResultPopup.vue'
import { useRouter } from 'vue-router'
import { useTeams } from '../composable/useTeams'
import { teamService } from '../services/teamServiceWrapper'
import VolleyballCourt from './VolleyballCourt.vue'
import CourtDisplay from './CourtDisplay.vue'

export default {
  name: 'VolleyballScoreboard',
  components: {
    PlayerStatsTracker,
    PlayerStatsSummary,
    PlayerSquares,
    ActionPopup,
    ResultPopup,
    VolleyballCourt,
    CourtDisplay
  },
  props: {
    gameId: {
      type: [Number, String],
      required: true
    }
  },
  emits: ['exit', 'updated'],
  setup(props, { emit }) {
    const router = useRouter()
    const { getPlayer, createTeam } = useTeams()
    const { updateGameScore } = useGames()
    
    const game = ref({
      id: null,
      game: '',
      myTeam: '',
      oppTeam: '',
      myPts: 0,
      oppPts: 0,
      maxSets: 3,
      created_at: new Date()
    })

    const playerPositions = ref({
      1: null, // Position 1 (Server)
      2: null, // Position 2 (Front Right)
      3: null, // Position 3 (Front Center)
      4: null, // Position 4 (Front Left)
      5: null, // Position 5 (Back Left)
      6: null  // Position 6 (Back Center)
    })

    const isSaving = ref(false)
    const isServing = ref('home') // 'home' or 'away'

    // Show/hide statistics summary
    const showStatsSummary = ref(false)

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

    // Player statistics tracking
    const showStatModal = ref(false)
    const selectedPlayer = ref({ team: '', number: null })
    const selectedStatType = ref('')
    const statTypes = ['Serve', 'Pass', 'Set', 'Attack', 'Block', 'Dig']

    // Player stats history
    const playerStats = ref([])

    // Roster of team players 
    const teamPlayers = ref([])

    // Sort players by jersey number
    const sortedPlayers = computed(() => {
      return [...teamPlayers.value].sort((a, b) => {
        const numA = parseInt(a.jerseyNumber) || 0;
        const numB = parseInt(b.jerseyNumber) || 0;
        return numA - numB;
      });
    });

    // Court positions (1-6) mapped to player IDs
    const courtPositions = ref({
      1: null, // Position 1 (Server)
      2: null, // Position 2 (Front Right)
      3: null, // Position 3 (Front Center)
      4: null, // Position 4 (Front Left)
      5: null, // Position 5 (Back Left)
      6: null  // Position 6 (Back Center)
    })

    // Function to get player by position
    const getPlayerInPosition = (position) => {
      const playerId = courtPositions.value[position];
      return teamPlayers.value.find(p => p.id === playerId) || null;
    }

    // Function to assign player to position
    const assignPlayerToPosition = (position, playerId) => {
      // Remove player from their current position if they're already on court
      Object.keys(courtPositions.value).forEach(pos => {
        if (courtPositions.value[pos] === playerId) {
          courtPositions.value[pos] = null;
        }
      });
      
      // Assign to new position
      courtPositions.value[position] = playerId;
    }

    // Function to rotate positions clockwise
    const rotatePositions = (team) => {
      if (team === 'home') {
        const temp = courtPositions.value[1];
        courtPositions.value[1] = courtPositions.value[6];
        courtPositions.value[6] = courtPositions.value[5];
        courtPositions.value[5] = courtPositions.value[4];
        courtPositions.value[4] = courtPositions.value[3];
        courtPositions.value[3] = courtPositions.value[2];
        courtPositions.value[2] = temp;
      }
    }

    // Function to load team roster
    const loadTeamRoster = async () => {
      try {
        console.log('Loading team roster for team:', game.value.myTeam);
        
        // First, try to use the teamService.getTeamRoster function to fetch the roster
        if (game.value && game.value.myTeam) {
          try {
            const players = await teamService.getTeamRoster(game.value.myTeam);
            
            if (players && players.length > 0) {
              console.log('Team roster loaded successfully with teamService:', players);
              teamPlayers.value = players;
              return; // Exit early since we found players
            }
          } catch (e) {
            console.error('Error using teamService.getTeamRoster:', e);
            // Fall back to other methods if getTeamRoster fails
          }
        }
        
        // If getTeamRoster failed or returned no players, try localStorage
        const teamsData = localStorage.getItem('teams');
        if (teamsData) {
          try {
            const teams = JSON.parse(teamsData);
            console.log('Teams found in localStorage:', teams);
            
            // Find the team that matches our current game's team name
            const myTeam = teams.find(t => t.name === game.value.myTeam);
            console.log('Team matching game.myTeam:', myTeam);
            
            if (myTeam && Array.isArray(myTeam.players) && myTeam.players.length > 0) {
              // Map the team's players to our expected format
              teamPlayers.value = myTeam.players.map(player => ({
                id: player.id || player._id || String(Math.random()),
                name: player.name || player.displayName || `Player ${player.number || player.jerseyNumber}`,
                jerseyNumber: player.jerseyNumber || player.number || '0'
              }));
              console.log('Team loaded from localStorage. Team name:', game.value.myTeam, 'Players found:', teamPlayers.value.length);
              return; // Exit early since we found players
            }
          } catch (e) {
            console.error('Error parsing local teams data:', e);
          }
        }
        
        // As a last resort, check if we can find the team in 'myTeams' localStorage
        const myTeamsData = localStorage.getItem('myTeams');
        if (myTeamsData) {
          try {
            const myTeams = JSON.parse(myTeamsData);
            console.log('Teams found in myTeams localStorage:', myTeams);
            
            // Find the team that matches our current game's team name
            const myTeam = myTeams.find(t => t.name === game.value.myTeam);
            console.log('Team matching game.myTeam in myTeams:', myTeam);
            
            if (myTeam && Array.isArray(myTeam.players) && myTeam.players.length > 0) {
              // Map the team's players to our expected format
              teamPlayers.value = myTeam.players.map(player => ({
                id: player.id || player._id || String(Math.random()),
                name: player.name || player.displayName || `Player ${player.number || player.jerseyNumber}`,
                jerseyNumber: player.jerseyNumber || player.number || '0'
              }));
              console.log('Team loaded from myTeams localStorage. Players found:', teamPlayers.value.length);
              return; // Exit early since we found players
            }
          } catch (e) {
            console.error('Error parsing myTeams data:', e);
          }
        }
        
        // If we get here, no players were found
        console.warn('No players found for team: ' + game.value.myTeam);
        
        // Try to create the team if it doesn't exist
        try {
          const { createTeam } = useTeams();
          const teamData = {
            name: game.value.myTeam,
            playerIds: [],
            newPlayers: []
          };
          
          console.log('Creating new team:', teamData);
          const newTeam = await createTeam(teamData);
          console.log('Team created successfully:', newTeam);
          
          // Save to localStorage for future use
          const teams = JSON.parse(localStorage.getItem('teams') || '[]');
          teams.push(newTeam);
          localStorage.setItem('teams', JSON.stringify(teams));
          
          // Initialize empty players array
          teamPlayers.value = [];
          
        } catch (createError) {
          console.error('Error creating team:', createError);
        }
        
      } catch (error) {
        console.error('Error loading team roster:', error);
        
        // Set empty array instead of hardcoded players
        teamPlayers.value = [];
        console.log('Error loading team roster, setting empty array');
      }
    };

    // Functions for player statistics
    const openPlayerStatModal = (team, position, playerId = null, playerName = null) => {
      const player = playerId ? teamPlayers.value.find(p => p.id === playerId) : getPlayerInPosition(position);
      
      selectedPlayer.value = { 
        team, 
        number: player ? player.jerseyNumber : position,
        id: player ? player.id : null,
        name: player ? player.name : `Player ${position}`
      };
      selectedStatType.value = '';
      showStatModal.value = true;
    };

    const closeStatModal = () => {
      showStatModal.value = false
    }

    const recordStat = (quality) => {
      // Create a new stat entry with player details
      const newStat = {
        team: selectedPlayer.value.team,
        playerNumber: selectedPlayer.value.number,
        playerId: selectedPlayer.value.id,
        playerName: selectedPlayer.value.name,
        statType: selectedStatType.value,
        quality: quality,
        timestamp: new Date(),
        saved: false // Track whether this stat has been saved to the database
      };
      
      // Add to stats history
      playerStats.value.push(newStat);
      console.log('Recorded stat:', newStat, 'Total stats:', playerStats.value.length);
      
      // Only try to save immediately if we have a real player (not an error entry)
      if (newStat.playerId && newStat.playerNumber !== 'E') {
        console.log('Attempting to immediately save stat for player:', newStat.playerName);
        // Save the stat to the database
        savePlayerStat(newStat).then((result) => {
          // Mark as saved if successful
          newStat.saved = true;
          console.log('Successfully saved stat immediately:', result);
        }).catch(error => {
          // Log error but don't interrupt the game flow
          console.error('Failed to save stat immediately, will retry during next save operation:', error);
        });
      } else {
        console.log('Skipping immediate save for error entry or missing player ID');
      }
      
      // Handle scoring based on the stat
      if (selectedPlayer.value.number === 'E') {
        // If it's an error by the opponent, award a point to the team
        const scoringTeam = selectedPlayer.value.team === 'home' ? 'away' : 'home';
        updateScore(scoringTeam, 1);
      } else if (quality === '+') {
        // Good play with point - award a point to the player's team
        updateScore(selectedPlayer.value.team, 1);
      } else if (quality === '-') {
        // Error - award a point to the opposing team
        const opposingTeam = selectedPlayer.value.team === 'home' ? 'away' : 'home';
        updateScore(opposingTeam, 1);
      }
      
      // Close the modal
      closeStatModal();
    }

    // New function to save player stat to the database
    const savePlayerStat = async (stat) => {
      try {
        // Skip if no player ID
        if (!stat.playerId) {
          console.log('Skipping database save for stat with no player ID', stat);
          return;
        }
        
        // Skip if already saved successfully
        if (stat.saved) {
          console.log('Skipping already saved stat:', stat);
          return;
        }

        // Map of frontend stat types to backend enum values
        const statTypeMap = {
          'Serve': 'SERVE',
          'Pass': 'PASS',
          'Set': 'SET',
          'Attack': 'ATTACK',
          'Block': 'BLOCK',
          'Dig': 'DIG'
        };
        
        // Ensure statType is valid
        const statType = statTypeMap[stat.statType];
        if (!statType) {
          console.error(`Invalid stat type: ${stat.statType}. Valid types are: ${Object.keys(statTypeMap).join(', ')}`);
          return;
        }
        
        // Convert quality to numeric value
        let value;
        if (stat.quality === '+') value = 3; // Point
        else if (stat.quality === '=') value = 2; // Good
        else if (stat.quality === '-') value = 1; // Error
        else {
          console.error(`Invalid quality value: ${stat.quality}. Valid values are: +, =, -`);
          return;
        }
        
        // Make sure we have a game ID before trying to save
        if (!game.value || !game.value.id) {
          console.error('Cannot save player stat: No game ID available');
          return;
        }
        
        // Prepare data for API request - exactly matching backend expectations
        const statData = {
          playerId: stat.playerId,
          statType: statType,
          value: value
        };
        
        console.log('Preparing to save player stat to database:', statData);
        
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
        
        // Construct the full API URL ensuring correct format
        const baseApiUrl = import.meta.env.VITE_API_URL || '/api';
        // Only use baseApiUrl directly when it's the environment variable
        const fullApiUrl = import.meta.env.VITE_API_URL 
          ? `${baseApiUrl.endsWith('/') ? baseApiUrl.slice(0, -1) : baseApiUrl}/games/${game.value.id}/player-stats`
          : `/api/games/${game.value.id}/player-stats`;
        
        // Debug the URL and data being sent
        console.log(`Sending player stat to: ${fullApiUrl}`);
        console.log('Request body:', JSON.stringify(statData));
        
        // Send the API request
        const response = await fetch(fullApiUrl, {
          method: 'POST',
          headers,
          credentials: 'include', // Include cookies for fallback auth
          body: JSON.stringify(statData)
        });
        
        // Get the response as text first for better debugging
        const responseText = await response.text();
        console.log(`Response status: ${response.status} ${response.statusText}`);
        console.log('Response text:', responseText);
        
        // Try to parse the response as JSON for better error details
        let responseJson;
        try {
          responseJson = JSON.parse(responseText);
          console.log('Parsed response:', responseJson);
        } catch (e) {
          console.warn('Could not parse response as JSON:', e);
        }
        
        if (!response.ok) {
          // Get more detailed error information if available
          const errorDetails = responseJson?.error || responseText;
          throw new Error(`Server responded with ${response.status}: ${response.statusText}. Details: ${errorDetails}`);
        }
        
        // Use the parsed JSON if available, otherwise create a simple success object
        const result = responseJson || { success: true, message: 'Stat saved (response was not JSON)' };
        console.log('Successfully saved player stat to database:', result);
        
        // Mark the stat as saved
        stat.saved = true;
        return result;
      } catch (error) {
        console.error('Error saving player stat to database:', error);
        // Don't show alert to user, just log the error
        // We'll still keep the stat in memory so it's not lost
        throw error; // Re-throw to let calling function know about the error
      }
    }

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

    // Finish the current set
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
      try {
        const gameData = await realtimeService.getGameState(props.gameId)
        
        if (gameData) {
          game.value = {
            id: gameData.id,
            game: gameData.game || '',
            myTeam: gameData.myTeam || '',
            oppTeam: gameData.oppTeam || '',
            myPts: gameData.myPts || 0,
            oppPts: gameData.oppPts || 0,
            maxSets: gameData.sets || 3,
            created_at: gameData.created_at || new Date()
          }
          
          console.log('Game loaded:', game.value.myTeam, 'VS', game.value.oppTeam)
          
          // Process set scores if available
          if (gameData.setScores) {
            try {
              let scores;
              
              if (typeof gameData.setScores === 'string') {
                scores = JSON.parse(gameData.setScores);
                console.log('Parsed setScores from string:', scores);
              } else if (Array.isArray(gameData.setScores)) {
                scores = gameData.setScores;
                console.log('Using setScores as array:', scores);
              } else {
                scores = [];
                console.warn('setScores is not a string or array, using empty array');
              }
              
              // Filter out current (in progress) set if present
              scores = scores.filter(set => !set.inProgress && !set.notPlayed);
              
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
          
          // Load player stats and positions if available
          if (gameData.notes) {
            try {
              let data;
              if (typeof gameData.notes === 'string') {
                data = JSON.parse(gameData.notes);
              } else {
                data = gameData.notes;
              }

              if (data.stats) {
                playerStats.value = Array.isArray(data.stats) ? data.stats : [];
              }
              
              // Load saved player positions
              if (data.positions) {
                // Ensure positions is an object with valid position numbers
                const savedPositions = typeof data.positions === 'object' ? data.positions : {};
                // Update each position while maintaining the ref structure
                Object.keys(playerPositions.value).forEach(pos => {
                  playerPositions.value[pos] = savedPositions[pos] || null;
                });
                console.log('Loaded player positions:', playerPositions.value);
              }
            } catch (e) {
              console.error('Error processing player stats and positions:', e);
              playerStats.value = [];
              // Reset positions to default state
              Object.keys(playerPositions.value).forEach(pos => {
                playerPositions.value[pos] = null;
              });
            }
          }
          
          // Process setsWon data if available
          if (gameData.setsWon) {
            try {
              let setsWonData;
              
              if (typeof gameData.setsWon === 'string') {
                setsWonData = JSON.parse(gameData.setsWon);
              } else {
                setsWonData = gameData.setsWon;
              }
              
              if (setsWonData && typeof setsWonData === 'object') {
                // Update reactive setsWon computed value source data
                setHistory.value = setHistory.value.map((set, index) => {
                  return {
                    ...set,
                    winner: set.homeScore > set.awayScore ? 'home' : 'away'
                  };
                });
              }
            } catch (e) {
              console.error('Error processing setsWon:', e);
            }
          }

          // Emit the updated event with the loaded game
          emit('updated', game.value);
        }
      } catch (error) {
        console.error('Error loading game:', error)
      }
    }

    // Set up real-time subscription
    let subscription = null

    const setupRealtimeSubscription = () => {
      if (!props.gameId) {
        console.error('Cannot set up subscription: Invalid gameId', props.gameId)
        return
      }
      
      console.log('Setting up real-time subscription for game ID:', props.gameId)
      
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
      
      if (autoSaveInterval) {
        clearInterval(autoSaveInterval)
      }
    })

    // Auto-save on interval
    let autoSaveInterval = null
    let saveErrorCount = 0 // Track consecutive save errors

    onMounted(async () => {
      console.log('VolleyballScoreboard mounted, loading game and roster...');
      await loadGame();
      console.log('Game loaded:', game.value);
      
      // No need to load roster here as it will be handled by PlayerSquares component
      // and the watch effect if needed
      
      // Rest of the onMounted function
      setupRealtimeSubscription()
      
      // Auto-save every minute, but stop if we encounter too many errors
      autoSaveInterval = setInterval(() => {
        // Only attempt auto-save if we haven't had too many errors
        if (saveErrorCount < 3) {
          saveGame().catch(err => {
            saveErrorCount++;
            console.warn(`Auto-save failed (${saveErrorCount}/3), will ${saveErrorCount < 3 ? 'retry next interval' : 'stop retrying'}`);
            
            // If we've hit the limit, clear the interval
            if (saveErrorCount >= 3) {
              clearInterval(autoSaveInterval);
              console.error('Auto-save disabled due to consecutive errors. Please save manually.');
            }
          });
        }
      }, 60000) // 1 minute
    })

    // Watch for team changes and reload roster only if necessary
    watch(() => game.value.myTeam, async (newTeam, oldTeam) => {
      if (newTeam && newTeam !== oldTeam && !teamPlayers.value.length) {
        console.log('Team changed from', oldTeam, 'to', newTeam, '- reloading roster');
        await loadTeamRoster();
      }
    });

    // Save the game state
    const saveGame = async () => {
      if (isSaving.value) return;
      
      isSaving.value = true;
      const startTime = Date.now();
      let statsSaveAttempted = 0;
      let statsSaveSucceeded = 0;
      let gameUpdateSucceeded = false;
      
      try {
        // Prepare set scores for saving
        let setScoresString = '[]';
        try {
          const setScores = {};
          
          // Add completed sets
          setHistory.value.forEach((set, index) => {
            setScores[index + 1] = {
              homeScore: set.homeScore,
              awayScore: set.awayScore,
              inProgress: false
            };
          });
          
          // Add current set if in progress
          if (!matchComplete.value) {
            setScores[currentSetIndex.value + 1] = {
              homeScore: currentSet.homeScore,
              awayScore: currentSet.awayScore,
              inProgress: true
            };
          }
          
          setScoresString = JSON.stringify(setScores);
          console.log('Formatted setScores as JSON string:', setScoresString);
        } catch (e) {
          console.error('Error stringifying setScores:', e);
          setScoresString = '[]'; // Fallback to empty array
        }
        
        // Prepare player stats and positions for saving
        let notesString = '{}'
        try {
          const notesData = {
            stats: playerStats.value,
            positions: playerPositions.value
          };
          notesString = JSON.stringify(notesData);
          
          // Save any unsaved player stats to the database
          if (playerStats.value && playerStats.value.length > 0) {
            console.log(`Saving player stats to database (${playerStats.value.length} total stats)`);
            
            // Count unsaved stats
            const unsavedStats = playerStats.value.filter(stat => !stat.saved && stat.playerId && stat.playerNumber !== 'E');
            console.log(`Found ${unsavedStats.length} unsaved player stats to save`);
            
            // Track stats that failed to save
            statsSaveAttempted = unsavedStats.length;
            
            if (unsavedStats.length > 0) {
              try {
                // Save all player stats in a single batch for improved performance
                await Promise.all(unsavedStats.map(stat => savePlayerStat(stat)));
                statsSaveSucceeded = unsavedStats.length;
                console.log(`Successfully saved all ${statsSaveSucceeded} player stats`);
              } catch (batchError) {
                console.error('Error saving player stats:', batchError);
              }
            }
          }
        } catch (e) {
          console.error('Error processing player stats:', e);
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
          myPts: Number(game.value.myPts),
          oppPts: Number(game.value.oppPts),
          setScores: setScoresString,
          setsWon: setsWonString,
          currentSet: Number(currentSetIndex.value + 1),
          notes: notesString
        };
        
        console.log('Updating game with data:', gameData);
        
        try {
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
          
          // Construct the correct API URL
          const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';
          const url = `${apiBaseUrl}/games/${game.value.id}`;
          
          console.log('Sending PUT request to:', url);
          
          const response = await fetch(url, {
            method: 'PUT',
            headers,
            credentials: 'include', // Include cookies for fallback auth
            body: JSON.stringify(gameData)
          });
          
          // Read the response and provide detailed error information if needed
          const responseText = await response.text();
          console.log(`Game update response: ${response.status} ${response.statusText}`);
          
          let responseJson;
          try {
            if (responseText) {
              responseJson = JSON.parse(responseText);
              console.log('Game update parsed response:', responseJson);
            }
          } catch (e) {
            console.warn('Could not parse game update response as JSON:', e);
          }
          
          if (!response.ok) {
            const errorDetails = responseJson?.error || responseText;
            throw new Error(`Server responded with ${response.status}: ${response.statusText}. Details: ${errorDetails}`);
          }
          
          gameUpdateSucceeded = true;
          
          // Log success message instead of showing alert
          const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
          console.log(`Game saved successfully in ${totalTime}s. ${statsSaveSucceeded} of ${statsSaveAttempted} player stats saved.`);
        } catch (error) {
          console.error('Error saving game:', error);
          throw error;
        }
      } catch (error) {
        console.error('Failed to save game:', error);
        
        // Log error message instead of showing alert
        if (gameUpdateSucceeded) {
          console.warn(`Game state was saved, but ${statsSaveAttempted - statsSaveSucceeded} of ${statsSaveAttempted} player stats failed to save.`);
        } else {
          console.error('Failed to save game. Please try again or consider saving a backup of your data.');
        }
      } finally {
        isSaving.value = false;
      }
    }

    // Dynamic player tracking state
    const showActionPopup = ref(false)
    const showResultPopup = ref(false)
    const selectedAction = ref(null)
    const dynamicSelectedPlayer = ref(null)
    const activeTeamId = computed(() => {
      // Get the team ID from the teamPlayers data
      if (game.value && game.value.teamId) {
        return game.value.teamId;
      }
      // If no teamId in game data, try to find it in localStorage
      const teamsData = localStorage.getItem('teams');
      if (teamsData) {
        try {
          const teams = JSON.parse(teamsData);
          const team = teams.find(t => t.name === game.value.myTeam);
          if (team) {
            return team.id;
          }
        } catch (e) {
          console.error('Error parsing teams data:', e);
        }
      }
      
      // As a fallback, try myTeams in localStorage
      const myTeamsData = localStorage.getItem('myTeams');
      if (myTeamsData) {
        try {
          const myTeams = JSON.parse(myTeamsData);
          const team = myTeams.find(t => t.name === game.value.myTeam);
          if (team) {
            return team.id;
          }
        } catch (e) {
          console.error('Error parsing myTeams data:', e);
        }
      }
      
      console.warn('Could not find team ID for:', game.value.myTeam);
      return null;
    });

    // Handle player selection from PlayerSquares component
    const handlePlayerSelected = (player) => {
      dynamicSelectedPlayer.value = player
      showActionPopup.value = true
    }
    
    // Handle player selection for away team
    const handleAwayPlayerSelected = (player) => {
      // For away team players, just open a basic stat modal
      // Here we're using the position number since away team doesn't have real player data
      openPlayerStatModal('away', player.jerseyNumber);
    }

    // Handle action selection from ActionPopup
    const handleActionSelect = (action) => {
      selectedAction.value = action
      showActionPopup.value = false
      showResultPopup.value = true
    }

    // Handle result selection from ResultPopup
    const handleResultSelect = (result) => {
      // Record the stat with player ID, action, and result
      const newStat = {
        team: 'home', // Assume it's always for the home team
        playerId: dynamicSelectedPlayer.value.id,
        playerName: dynamicSelectedPlayer.value.name,
        playerNumber: dynamicSelectedPlayer.value.jerseyNumber,
        statType: selectedAction.value,
        quality: result,
        timestamp: new Date()
      }
      
      // Add to stats history
      playerStats.value.push(newStat)
      console.log('Recorded stat:', newStat, 'Total stats:', playerStats.value.length)
      
      // Handle scoring based on the result
      if (result === '+') {
        // Good play with point - award a point to the player's team
        updateScore('home', 1)
      } else if (result === '-') {
        // Error - award a point to the opposing team
        updateScore('away', 1)
      }
      
      // Reset state
      closePopups()
    }

    // Close all popups
    const closePopups = () => {
      showActionPopup.value = false
      showResultPopup.value = false
      dynamicSelectedPlayer.value = null
      selectedAction.value = null
    }

    // Return all the reactive properties and methods for the template
    return {
      game,
      playerPositions,
      isSaving,
      isServing,
      showStatsSummary,
      currentSetIndex,
      setHistory,
      currentSet,
      timeouts,
      showStatModal,
      selectedPlayer,
      selectedStatType,
      statTypes,
      playerStats,
      teamPlayers,
      courtPositions,
      getPlayerInPosition,
      assignPlayerToPosition,
      rotatePositions,
      openPlayerStatModal,
      closeStatModal,
      recordStat,
      savePlayerStat,
      setsWon,
      matchComplete,
      isSetAfterMatchComplete,
      isSetDecisive,
      currentSetTargetScore,
      getTargetScoreForSet,
      formatDate,
      updateScore,
      toggleServing,
      toggleTimeout,
      canFinishSet,
      finishSet,
      resetSet,
      loadGame,
      saveGame,
      showActionPopup,
      showResultPopup,
      selectedAction,
      dynamicSelectedPlayer,
      activeTeamId,
      handlePlayerSelected,
      handleAwayPlayerSelected,
      handleActionSelect,
      handleResultSelect,
      closePopups,
      sortedPlayers
    }
  }
}
</script> 