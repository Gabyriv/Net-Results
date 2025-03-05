<template>
  <DefaultLayout>
    <div class="bg-blue-200 min-h-screen flex flex-col"> 
      <div class="container mx-auto p-4 flex-grow">
        <h1 class="text-3xl font-bold mb-4">Players</h1>

        <!-- Error Message Section -->
        <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <strong class="font-bold">Error!</strong>
          <span class="block sm:inline">{{ error.message }}</span>
        </div>

        <!-- Loading indicator -->
        <LoadingSpinner v-if="loading" />

        <!-- Create Player Form -->
        <div v-if="!loading" class="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 class="text-xl font-bold mb-4">Add New Player</h2>
          <form @submit.prevent="createPlayer" class="space-y-4">
            <div>
              <label class="block text-gray-700 mb-2" for="playerName">Name</label>
              <input 
                id="playerName" 
                v-model="newPlayer.displayName" 
                type="text" 
                class="w-full p-2 border border-gray-300 rounded" 
                required
              />
            </div>
            <div>
              <label class="block text-gray-700 mb-2" for="playerNumber">Jersey Number</label>
              <input 
                id="playerNumber" 
                v-model="newPlayer.jerseyNumber" 
                type="number" 
                class="w-full p-2 border border-gray-300 rounded"
              />
            </div>
            <div v-if="teams.length">
              <label class="block text-gray-700 mb-2" for="playerTeam">Team</label>
              <select 
                id="playerTeam" 
                v-model="newPlayer.teamId" 
                class="w-full p-2 border border-gray-300 rounded"
              >
                <option value="">-- No Team --</option>
                <option v-for="team in teams" :key="team.id" :value="team.id">
                  {{ team.name }}
                </option>
              </select>
            </div>
            <button 
              type="submit" 
              class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
              :disabled="creatingPlayer"
            >
              {{ creatingPlayer ? 'Creating...' : 'Create Player' }}
            </button>
          </form>
        </div>

        <!-- Players List -->
        <div v-if="!loading && players.length" class="bg-white rounded-lg shadow-md p-6">
          <h2 class="text-xl font-bold mb-4">Players List</h2>
          <div class="overflow-x-auto">
            <table class="min-w-full bg-white border border-gray-300">
              <thead>
                <tr>
                  <th class="px-4 py-2 border-b border-gray-300 text-left">Name</th>
                  <th class="px-4 py-2 border-b border-gray-300 text-left">Number</th>
                  <th class="px-4 py-2 border-b border-gray-300 text-left">Team</th>
                  <th class="px-4 py-2 border-b border-gray-300 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="player in players" :key="player.id" class="hover:bg-gray-100">
                  <td class="px-4 py-2 border-b border-gray-300">
                    <div v-if="editingPlayer && editingPlayer.id === player.id">
                      <input 
                        v-model="editingPlayer.displayName" 
                        class="w-full p-1 border border-gray-300 rounded"
                      />
                    </div>
                    <div v-else>{{ player.displayName }}</div>
                  </td>
                  <td class="px-4 py-2 border-b border-gray-300">
                    <div v-if="editingPlayer && editingPlayer.id === player.id">
                      <input 
                        v-model="editingPlayer.number" 
                        type="number" 
                        class="w-full p-1 border border-gray-300 rounded"
                      />
                    </div>
                    <div v-else>{{ player.number }}</div>
                  </td>
                  <td class="px-4 py-2 border-b border-gray-300">
                    <div v-if="editingPlayer && editingPlayer.id === player.id">
                      <select 
                        v-model="editingPlayer.teamId" 
                        class="w-full p-1 border border-gray-300 rounded"
                      >
                        <option value="">-- No Team --</option>
                        <option v-for="team in teams" :key="team.id" :value="team.id">
                          {{ team.name }}
                        </option>
                      </select>
                    </div>
                    <div v-else>{{ player.team?.name || 'Unassigned' }}</div>
                  </td>
                  <td class="px-4 py-2 border-b border-gray-300">
                    <div class="flex space-x-2">
                      <div v-if="editingPlayer && editingPlayer.id === player.id">
                        <button 
                          @click="updatePlayer" 
                          class="bg-green-500 text-white px-2 py-1 rounded text-sm hover:bg-green-600"
                          :disabled="updatingPlayer"
                        >
                          Save
                        </button>
                        <button 
                          @click="cancelEdit" 
                          class="bg-gray-500 text-white px-2 py-1 rounded text-sm hover:bg-gray-600 ml-2"
                        >
                          Cancel
                        </button>
                      </div>
                      <div v-else class="flex space-x-2">
                        <button 
                          @click="startEdit(player)" 
                          class="bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600"
                        >
                          Edit
                        </button>
                        <button 
                          @click="confirmDelete(player)" 
                          class="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="!loading && !players.length" class="bg-white p-6 rounded-lg shadow-md text-center">
          <p class="text-gray-700">No players found. Create your first player above!</p>
        </div>

        <!-- Delete Confirmation Modal -->
        <div v-if="showDeleteModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div class="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 class="text-xl font-bold mb-4">Confirm Delete</h3>
            <p class="mb-6">Are you sure you want to delete {{ playerToDelete?.displayName }}? This action cannot be undone.</p>
            <div class="flex justify-end space-x-4">
              <button 
                @click="cancelDelete" 
                class="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button 
                @click="deletePlayer" 
                class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                :disabled="deletingPlayer"
              >
                {{ deletingPlayer ? 'Deleting...' : 'Delete' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script>
import { onMounted, ref } from 'vue'
import { usePlayers } from '../composable/usePlayers'
import DefaultLayout from "../layouts/DefaultLayout.vue"
import LoadingSpinner from "../components/LoadingSpinner.vue"

export default {
  name: "Players",
  components: { DefaultLayout, LoadingSpinner },
  setup() {
    const { 
      players, 
      teams, 
      error, 
      loading, 
      fetchPlayers, 
      fetchTeams, 
      createNewPlayer, 
      updatePlayerById, 
      deletePlayerById 
    } = usePlayers()

    // State for the new player form
    const newPlayer = ref({
      displayName: '',
      jerseyNumber: '',
      teamId: ''
    })
    const creatingPlayer = ref(false)

    // State for editing players
    const editingPlayer = ref(null)
    const updatingPlayer = ref(false)

    // State for deleting players
    const showDeleteModal = ref(false)
    const playerToDelete = ref(null)
    const deletingPlayer = ref(false)

    // Load players and teams on mount
    onMounted(() => {
      fetchPlayers()
      fetchTeams()
    })

    // Create a new player
    const createPlayer = async () => {
      creatingPlayer.value = true
      try {
        await createNewPlayer({
          displayName: newPlayer.value.displayName,
          number: newPlayer.value.jerseyNumber ? parseInt(newPlayer.value.jerseyNumber) : undefined,
          teamId: newPlayer.value.teamId || null
        })
        // Reset form
        newPlayer.value.displayName = ''
        newPlayer.value.jerseyNumber = ''
        newPlayer.value.teamId = ''
      } catch (err) {
        console.error('Error creating player:', err)
      } finally {
        creatingPlayer.value = false
      }
    }

    // Start editing a player
    const startEdit = (player) => {
      editingPlayer.value = { ...player }
    }

    // Cancel editing
    const cancelEdit = () => {
      editingPlayer.value = null
    }

    // Update a player
    const updatePlayer = async () => {
      if (!editingPlayer.value) return
      
      updatingPlayer.value = true
      try {
        await updatePlayerById(editingPlayer.value.id, {
          displayName: editingPlayer.value.displayName,
          number: editingPlayer.value.number,
          teamId: editingPlayer.value.teamId
        })
        editingPlayer.value = null
      } catch (err) {
        console.error('Error updating player:', err)
      } finally {
        updatingPlayer.value = false
      }
    }

    // Confirm player deletion
    const confirmDelete = (player) => {
      playerToDelete.value = player
      showDeleteModal.value = true
    }

    // Cancel player deletion
    const cancelDelete = () => {
      playerToDelete.value = null
      showDeleteModal.value = false
    }

    // Delete a player
    const deletePlayer = async () => {
      if (!playerToDelete.value) return
      
      deletingPlayer.value = true
      try {
        await deletePlayerById(playerToDelete.value.id)
        cancelDelete()
      } catch (err) {
        console.error('Error deleting player:', err)
      } finally {
        deletingPlayer.value = false
      }
    }

    return { 
      players, 
      teams, 
      error, 
      loading, 
      newPlayer,
      creatingPlayer,
      createPlayer,
      editingPlayer,
      updatingPlayer,
      startEdit,
      cancelEdit,
      updatePlayer,
      showDeleteModal,
      playerToDelete,
      deletingPlayer,
      confirmDelete,
      cancelDelete,
      deletePlayer
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
</style>
