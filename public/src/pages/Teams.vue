<template>
  <DefaultLayout>
    <div class="bg-blue-200 min-h-screen flex flex-col">
      <div class="container mx-auto p-4 flex-grow">
        <div class="flex justify-between items-center mb-4">
          <h1 class="text-3xl font-bold">
            {{ user?.role === 'Manager' ? 'My Teams' : 'Teams' }}
          </h1>
          
          <!-- Create Team Button - Only visible to managers -->
          <button 
            v-if="user?.role === 'Manager' && !showCreateForm && !showEditForm"
            @click="showCreateForm = true"
            class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Create New Team
          </button>
        </div>

        <!-- Edit Team Form - Only visible when editing a team -->
        <div v-if="showEditForm && editingTeam" id="edit-team-form" class="bg-white p-6 rounded-lg shadow-lg mb-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold">Edit Team</h2>
            <button 
              @click="cancelEditTeam"
              class="text-gray-500 hover:text-gray-700"
              title="Close Form"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <form @submit.prevent="handleUpdateTeam" class="space-y-4">
            <div>
              <label for="teamName" class="block text-lg font-medium text-gray-700">Team Name</label>
              <input 
                type="text" 
                id="teamName" 
                v-model="editingTeam.name" 
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            
            <!-- Player Management Section -->
            <div>
              <div class="flex justify-between items-center mb-2">
                <label class="block text-lg font-medium text-gray-700">Add New Players</label>
                <button 
                  type="button"
                  @click="addNewPlayerToEdit"
                  class="inline-flex items-center px-3 py-1 border border-transparent text-lg leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Player
                </button>
              </div>
              
              <!-- New Players List -->
              <div v-if="!editingTeam.newPlayers || editingTeam.newPlayers.length === 0" class="py-3 text-lg text-gray-500 bg-gray-50 rounded-md px-3 mb-2">
                No new players added. Click "Add Player" to add team members.
              </div>
              
              <div v-else class="space-y-3 mb-4">
                <div v-for="(player, index) in editingTeam.newPlayers" :key="index" class="flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
                  <div class="flex-grow">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <label :for="`edit-player-name-${index}`" class="block text-lg font-medium text-gray-500">Player Name</label>
                        <input 
                          :id="`edit-player-name-${index}`"
                          v-model="player.displayName" 
                          type="text" 
                          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg"
                          placeholder="Enter player name"
                          required
                        />
                      </div>
                      <div>
                        <label :for="`edit-player-number-${index}`" class="block text-lg font-medium text-gray-500">Jersey Number</label>
                        <input 
                          :id="`edit-player-number-${index}`"
                          v-model="player.number" 
                          type="number" 
                          min="0"
                          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg"
                          placeholder="Enter jersey number"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <button 
                    type="button"
                    @click="removePlayerFromEdit(index)"
                    class="text-red-500 hover:text-red-700"
                    title="Remove Player"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <!-- Existing Players Selection -->
              <div v-if="showEditExistingPlayers && availablePlayers.length > 0" class="mt-4">
                <div class="flex justify-between items-center mb-2">
                  <label class="block text-lg font-medium text-gray-700">Manage Existing Players</label>
                  <button 
                    type="button" 
                    @click="showEditExistingPlayers = false"
                    class="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Hide
                  </button>
                </div>
                <div class="max-h-60 overflow-y-auto border border-gray-200 rounded-md p-2">
                  <div v-for="player in availablePlayers" :key="player.id" class="flex items-center py-2 border-b border-gray-100 last:border-0">
                    <input 
                      type="checkbox" 
                      :id="`edit-player-${player.id}`" 
                      :value="player.id" 
                      v-model="editingTeam.playerIds"
                      class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label :for="`edit-player-${player.id}`" class="ml-2 block text-sm text-gray-900">
                      {{ player.displayName || player.user?.displayName || 'Unnamed Player' }}
                    </label>
                  </div>
                </div>
                <p class="mt-1 text-lg text-gray-500">{{ editingTeam.playerIds.length }} existing players selected</p>
              </div>
              
              <div v-else-if="availablePlayers.length > 0" class="mt-4">
                <button 
                  type="button" 
                  @click="showEditExistingPlayers = true"
                  class="text-sm text-blue-600 hover:text-blue-800"
                >
                  Manage existing players ({{ availablePlayers.length }} available)
                </button>
              </div>
            </div>
            
            <div class="flex space-x-4">
              <button 
                type="submit" 
                class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                :disabled="loading"
              >
                <span v-if="loading">Updating...</span>
                <span v-else>Update Team</span>
              </button>
              
              <button 
                type="button"
                @click="cancelEditTeam"
                class="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        <!-- Create Team Form - Only visible to managers and when showCreateForm is true -->
        <div v-if="user?.role === 'Manager' && showCreateForm" class="bg-white p-6 rounded-lg shadow-lg mb-6">
          <div class="flex justify-between items-center mb-4">
            <h2 class="text-xl font-bold">Create New Team</h2>
            <button 
              @click="cancelCreateTeam"
              class="text-gray-500 hover:text-gray-700"
              title="Close Form"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <form @submit.prevent="handleCreateTeam" class="space-y-4">
            <div>
              <label for="teamName" class="block text-lg font-medium text-gray-700">Team Name</label>
              <input 
                type="text" 
                id="teamName" 
                v-model="newTeam.name" 
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg"
                required
              />
            </div>
            
            <!-- Player Selection with Name and Number -->
            <div>
              <div class="flex justify-between items-center mb-2">
                <label class="block text-lg font-medium text-gray-700">Team Players</label>
                <button 
                  type="button"
                  @click="addNewPlayer"
                  class="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Player
                </button>
              </div>
              
              <!-- Player List -->
              <div v-if="newTeam.players.length === 0" class="py-3 text-lg text-gray-500 bg-gray-50 rounded-md px-3 mb-2">
                No players added yet. Click "Add Player" to add team members.
              </div>
              
              <div v-else class="space-y-3 mb-4">
                <div v-for="(player, index) in newTeam.players" :key="index" class="flex items-center space-x-2 p-3 bg-gray-50 rounded-md">
                  <div class="flex-grow">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div>
                        <label :for="`player-name-${index}`" class="block text-lg font-medium text-gray-500">Player Name</label>
                        <input 
                          :id="`player-name-${index}`"
                          v-model="player.name" 
                          type="text" 
                          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg"
                          placeholder="Enter player name"
                          required
                        />
                      </div>
                      <div>
                        <label :for="`player-number-${index}`" class="block text-lg font-medium text-gray-500 text-lg">Jersey Number</label>
                        <input 
                          :id="`player-number-${index}`"
                          v-model="player.number" 
                          type="number" 
                          min="1"
                          max="99"
                          class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg"
                          placeholder="Enter jersey number"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <button 
                    type="button"
                    @click="removePlayer(index)"
                    class="text-red-500 hover:text-red-700"
                    title="Remove Player"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <!-- Existing Players Selection (Optional) -->
              <div v-if="showExistingPlayers && availablePlayers.length > 0" class="mt-4">
                <div class="flex justify-between items-center mb-2">
                  <label class="block text-sm font-medium text-gray-700">Add Existing Players (Optional)</label>
                  <button 
                    type="button" 
                    @click="showExistingPlayers = false"
                    class="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Hide
                  </button>
                </div>
                <div class="max-h-60 overflow-y-auto border border-gray-200 rounded-md p-2">
                  <div v-for="player in availablePlayers" :key="player.id" class="flex items-center py-2 border-b border-gray-100 last:border-0">
                    <input 
                      type="checkbox" 
                      :id="`player-${player.id}`" 
                      :value="player.id" 
                      v-model="newTeam.playerIds"
                      class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label :for="`player-${player.id}`" class="ml-2 block text-sm text-gray-900">
                      {{ player.displayName || player.user?.displayName || 'Unnamed Player' }}
                    </label>
                  </div>
                </div>
                <p class="mt-1 text-xs text-gray-500">{{ newTeam.playerIds.length }} existing players selected</p>
              </div>
              
              <div v-else-if="availablePlayers.length > 0" class="mt-4">
                <button 
                  type="button" 
                  @click="showExistingPlayers = true"
                  class="text-sm text-blue-600 hover:text-blue-800"
                >
                  Show existing players ({{ availablePlayers.length }} available)
                </button>
              </div>
            </div>
            
            <div class="flex space-x-4">
              <button 
                type="submit" 
                class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                :disabled="loading"
              >
                <span v-if="loading">Creating...</span>
                <span v-else>Create Team</span>
              </button>
              
              <button 
                type="button"
                @click="cancelCreateTeam"
                class="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
        
        <!-- Message for players -->
        <div v-if="user?.role === 'Player'" class="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6">
          <p>Players cannot create teams. Please contact a manager to create a team for you.</p>
        </div>

        <!-- Error Message Section -->
        <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <strong class="font-bold">Error!</strong>
          <span class="block sm:inline">{{ error.message }}</span>
        </div>

        <!-- Skeleton Loading -->
        <div v-if="loading && !initialLoadComplete" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="i in skeletonCount" :key="`skeleton-${i}`" class="bg-white p-6 rounded-lg shadow-lg animate-pulse">
            <div class="flex justify-between items-start">
              <div class="flex-grow">
                <div class="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div class="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
                
                <div class="mt-4">
                  <div class="h-5 bg-gray-200 rounded w-1/3 mb-3"></div>
                  <div class="space-y-2">
                    <div class="h-4 bg-gray-200 rounded w-full mb-1"></div>
                    <div class="h-4 bg-gray-200 rounded w-full mb-1"></div>
                    <div class="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading indicator for subsequent loads -->
        <LoadingSpinner v-else-if="loading && initialLoadComplete" />
        
        <!-- No teams message -->
        <div v-if="initialLoadComplete && !loading && teams.length === 0" class="bg-white p-6 rounded-lg shadow-lg mb-4">
          <p v-if="user?.role === 'Manager'" class="text-gray-700">You haven't created any teams yet. Create your first team to get started!</p>
          <p v-else class="text-gray-700">No teams found.</p>
        </div>

        <!-- Teams display -->
        <div v-if="teams.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div 
            v-for="team in visibleTeams" 
            :key="team.id" 
            class="bg-white p-6 rounded-lg shadow-lg cursor-pointer"
            @click="viewTeamDetails(team)"
          >
            <div class="flex justify-between items-start">
              <div class="flex-grow">
                <div class="flex justify-between items-center mb-4">
                  <h2 class="text-xl font-bold">{{ team.name }}</h2>
                  <div v-if="user?.role === 'Manager'" class="flex space-x-2">
                    <button 
                      @click.stop="editTeam(team)"
                      class="text-blue-600 hover:text-blue-800"
                      title="Edit Team"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button 
                      @click.stop="confirmDeleteTeam(team.id)"
                      class="text-red-600 hover:text-red-800"
                      title="Delete Team"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                
                <div class="mb-4">
                  <p class="text-sm text-gray-600">Manager: {{ team.manager?.displayName || 'No Manager' }}</p>
                </div>

                <!-- Players Section -->
                <div class="mt-4">
                  <div class="flex justify-between items-center mb-2">
                    <h3 class="text-lg font-semibold">Players ({{ team.players?.length || 0 }})</h3>
                    <button 
                      v-if="team.players?.length > 3" 
                      @click.stop="togglePlayerList(team.id)"
                      class="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {{ expandedTeams.includes(team.id) ? 'Show Less' : 'Show All' }}
                    </button>
                  </div>
                  <div class="space-y-2">
                    <div v-if="team.players?.length" class="divide-y divide-gray-200">
                      <div 
                        v-for="(player, playerIndex) in getVisiblePlayers(team)" 
                        :key="player.id" 
                        class="py-2 flex justify-between items-center"
                      >
                        <div>
                          <p class="font-medium">{{ player.displayName }}</p>
                          <p class="text-sm text-gray-600">
                            <span v-if="player.jerseyNumber">Jersey #{{ player.jerseyNumber }}</span>
                            <span v-else-if="player.number">Jersey #{{ player.number }}</span>
                            <span v-if="player.gamesPlayed"> • Games Played: {{ player.gamesPlayed }}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                    <p v-else class="text-gray-500 text-sm">No players in this team</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Team Details Modal -->
        <div v-if="showTeamDetails" class="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
          <div class="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-xl font-bold">{{ selectedTeam.name }}</h2>
              <button 
                @click="closeTeamDetails"
                class="text-gray-500 hover:text-gray-700"
                title="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div>
              <p class="text-sm text-gray-600 mb-4">Manager: {{ selectedTeam.manager?.displayName || 'No Manager' }}</p>
              <div>
                <h3 class="text-lg font-semibold mb-2">Players ({{ selectedTeam.players?.length || 0 }})</h3>
                <div class="space-y-2">
                  <div v-if="selectedTeam.players?.length" class="divide-y divide-gray-200">
                    <div 
                      v-for="(player, playerIndex) in selectedTeam.players" 
                      :key="player.id" 
                      class="py-2 flex justify-between items-center"
                    >
                      <div>
                        <p class="font-medium">{{ player.displayName }}</p>
                        <p class="text-sm text-gray-600">
                          <span v-if="player.jerseyNumber">Jersey #{{ player.jerseyNumber }}</span>
                          <span v-else-if="player.number">Jersey #{{ player.number }}</span>
                          <span v-if="player.gamesPlayed"> • Games Played: {{ player.gamesPlayed }}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <p v-else class="text-gray-500 text-sm">No players in this team</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Load more teams button -->
        <div v-if="teams.length > visibleTeamCount" class="mt-6 text-center">
          <button 
            @click="loadMoreTeams"
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Load More Teams
          </button>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script>
import { onMounted, ref, computed, nextTick, defineAsyncComponent } from 'vue'
import { useTeams } from '../composable/useTeams'
import { useAuth } from '../composable/useAuth'
import DefaultLayout from "../layouts/DefaultLayout.vue"

// Lazy load the LoadingSpinner component
const LoadingSpinner = defineAsyncComponent(() => 
  import("../components/LoadingSpinner.vue")
)

export default {
  name: "Teams",
  components: { DefaultLayout, LoadingSpinner },
  setup() {
    const { teams, availablePlayers, error, loading, fetchTeams, fetchAvailablePlayers, createTeam, deleteTeam, updateTeam } = useTeams()
    const { user, initAuth } = useAuth()
    const newTeam = ref({
      name: '',
      playerIds: [],
      players: []
    })
    const editingTeam = ref(null)
    const showEditForm = ref(false)
    const showEditExistingPlayers = ref(false)
    const loadingPlayers = ref(false)
    const showCreateForm = ref(false)
    const showExistingPlayers = ref(false)
    const expandedTeams = ref([])
    const visibleTeamCount = ref(6) // Initial number of teams to show
    const initialLoadComplete = ref(false)
    const skeletonCount = ref(3) // Number of skeleton items to show during loading
    const showTeamDetails = ref(false)
    const selectedTeam = ref(null)
    
    // Computed property for visible teams (pagination)
    const visibleTeams = computed(() => {
      return teams.value.slice(0, visibleTeamCount.value)
    })
    
    // Function to load more teams
    const loadMoreTeams = () => {
      visibleTeamCount.value += 6 // Load 6 more teams
    }
    
    // Function to toggle player list expansion
    const togglePlayerList = (teamId) => {
      if (expandedTeams.value.includes(teamId)) {
        expandedTeams.value = expandedTeams.value.filter(id => id !== teamId)
      } else {
        expandedTeams.value.push(teamId)
      }
    }
    
    // Function to get visible players for a team
    const getVisiblePlayers = (team) => {
      if (!team.players) return []
      if (expandedTeams.value.includes(team.id)) {
        return team.players
      } else {
        return team.players.slice(0, 3) // Show only first 3 players
      }
    }
    
    // Function to add a new player to the team
    const addNewPlayer = () => {
      newTeam.value.players.push({
        name: '',
        number: ''
      })
    }
    
    // Function to remove a player from the team
    const removePlayer = (index) => {
      newTeam.value.players.splice(index, 1)
    }
    
    // Function to cancel team creation and hide the form
    const cancelCreateTeam = () => {
      // Reset form
      newTeam.value.name = ''
      newTeam.value.playerIds = []
      newTeam.value.players = []
      showExistingPlayers.value = false
      // Hide form
      showCreateForm.value = false
    }
    
    // Function to add a new player to the editing team
    const addNewPlayerToEdit = () => {
      if (!editingTeam.value.newPlayers) {
        editingTeam.value.newPlayers = []
      }
      
      editingTeam.value.newPlayers.push({
        displayName: '',
        number: ''
      })
    }
    
    // Function to remove a player from the editing team
    const removePlayerFromEdit = (index) => {
      editingTeam.value.newPlayers.splice(index, 1)
    }
    
    // Function to cancel team editing and hide the form
    const cancelEditTeam = () => {
      // Reset form
      editingTeam.value = null
      showEditExistingPlayers.value = false
      // Hide form
      showEditForm.value = false
    }
    
    // Function to load available players (lazy loading)
    const loadAvailablePlayers = async () => {
      if (availablePlayers.value.length > 0) return // Don't reload if already loaded
      
      loadingPlayers.value = true
      try {
        await fetchAvailablePlayers()
      } catch (err) {
        console.error('Error loading players:', err)
      } finally {
        loadingPlayers.value = false
      }
    }

    const handleCreateTeam = async () => {
      try {
        // Create a team data object that includes both existing players and new players
        const teamData = {
          name: newTeam.value.name,
          playerIds: newTeam.value.playerIds,
          newPlayers: newTeam.value.players.map(player => ({
            displayName: player.name,
            number: player.number
          }))
        }
        
        await createTeam(teamData)
        
        // Reset form after successful creation
        newTeam.value.name = ''
        newTeam.value.playerIds = []
        newTeam.value.players = []
        showExistingPlayers.value = false
        
        // Hide the form
        showCreateForm.value = false
      } catch (err) {
        console.error('Failed to create team:', err)
      }
    }

    const handleUpdateTeam = async () => {
      if (!editingTeam.value) return
      
      try {
        const teamData = {
          name: editingTeam.value.name,
          playerIds: editingTeam.value.playerIds || [],
          newPlayers: editingTeam.value.newPlayers || []
        }
        
        await updateTeam(editingTeam.value.id, teamData)
        
        // Hide the form after successful update
        showEditForm.value = false
        showEditExistingPlayers.value = false
        editingTeam.value = null
      } catch (err) {
        console.error('Failed to update team:', err)
      }
    }

    const confirmDeleteTeam = async (teamId) => {
      if (confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
        try {
          await deleteTeam(teamId)
        } catch (err) {
          console.error('Failed to delete team:', err)
        }
      }
    }
    
    // Function to open the edit team form
    const editTeam = (team) => {
      // Create a copy of the team to edit
      editingTeam.value = {
        id: team.id,
        name: team.name,
        playerIds: team.players ? team.players.map(player => player.id) : [],
        newPlayers: []
      }
      
      // Ensure available players are loaded
      if (availablePlayers.value.length === 0) {
        loadAvailablePlayers()
      }
      
      // Show the edit form
      showEditForm.value = true
      
      // Scroll to the edit form
      nextTick(() => {
        document.getElementById('edit-team-form')?.scrollIntoView({ behavior: 'smooth' })
      })
    }

    // Function to view team details
    const viewTeamDetails = (team) => {
      selectedTeam.value = team
      showTeamDetails.value = true
    }

    // Function to close team details modal
    const closeTeamDetails = () => {
      showTeamDetails.value = false
      selectedTeam.value = null
    }

    // Initialize component with optimized loading sequence
    onMounted(async () => {
      // Initialize auth first
      await initAuth()
      
      // Start fetching teams immediately
      const fetchTeamsPromise = user.value?.role === 'Manager' 
        ? fetchTeams({ myTeams: true })
        : fetchTeams()
      
      // Set a timeout to show skeleton loading for at least 300ms
      // This prevents flickering for very fast loads
      const minLoadingTime = new Promise(resolve => setTimeout(resolve, 300))
      
      // Wait for both the minimum loading time and the data fetch
      await Promise.all([fetchTeamsPromise, minLoadingTime])
      
      // Mark initial load as complete
      initialLoadComplete.value = true
      
      // Show create form automatically if no teams exist (for managers)
      if (user.value?.role === 'Manager') {
        nextTick(() => {
          if (teams.value.length === 0) {
            showCreateForm.value = true
          }
        })
        
        // Prefetch available players in the background for managers
        // This happens after the teams are loaded to prioritize the main content
        setTimeout(() => {
          if (!loadingPlayers.value && availablePlayers.value.length === 0) {
            loadAvailablePlayers()
          }
        }, 1000)
      }
    })

    return { 
      teams, 
      availablePlayers,
      error, 
      loading, 
      loadingPlayers,
      newTeam,
      editingTeam,
      showCreateForm,
      showEditForm,
      showExistingPlayers,
      showEditExistingPlayers,
      visibleTeams,
      visibleTeamCount,
      expandedTeams,
      initialLoadComplete,
      skeletonCount,
      showTeamDetails,
      selectedTeam,
      handleCreateTeam,
      handleUpdateTeam,
      confirmDeleteTeam,
      cancelCreateTeam,
      cancelEditTeam,
      editTeam,
      addNewPlayer,
      removePlayer,
      addNewPlayerToEdit,
      removePlayerFromEdit,
      loadAvailablePlayers,
      loadMoreTeams,
      togglePlayerList,
      getVisiblePlayers,
      viewTeamDetails,
      closeTeamDetails,
      user
    }
  },
}
</script>

<style scoped>
/* Add any component-specific styles here */
html, body {
  height: 100%;
  margin: 0;
}

input {
  border: 1px solid #e2e8f0;
  padding: 0.5rem;
}

/* Skeleton loading animation */
@keyframes pulse {
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 0.3;
  }
}
.animate-pulse {
  animation: pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
