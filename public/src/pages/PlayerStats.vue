<template>
  <DefaultLayout>
    <div class="bg-blue-100 min-h-screen flex flex-col">
      <div class="container mx-auto p-4 flex-grow">
        <!-- Header with Back Button -->
        <div class="flex justify-between items-center mb-6">
          <div class="flex items-center">
            <button 
              @click="goBack" 
              class="flex items-center text-blue-600 hover:text-blue-800 mr-4"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 class="text-2xl font-bold">Player Statistics</h1>
          </div>
        </div>

        <!-- Loading Spinner -->
        <div v-if="loading" class="flex justify-center items-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>

        <!-- Error Message -->
        <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{{ error }}</p>
          <p class="mt-2">
            <button 
              @click="fetchPlayerData" 
              class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Retry
            </button>
          </p>
        </div>

        <!-- Player Not Found Message -->
        <div v-else-if="!player" class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <p>Player not found or no data available.</p>
        </div>

        <!-- Player Data Content -->
        <div v-else>
          <!-- Player Info Card -->
          <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <div class="flex flex-col md:flex-row md:justify-between md:items-center">
              <div>
                <h2 class="text-2xl font-bold mb-2">{{ player.displayName }}</h2>
                <p class="text-lg">
                  <span v-if="player.team" class="mr-3">
                    <span class="font-medium">Team:</span> {{ player.team.name }}
                  </span>
                  <span v-if="player.jerseyNumber || player.number">
                    <span class="font-medium">Jersey:</span> #{{ player.jerseyNumber || player.number }}
                  </span>
                </p>
              </div>
              
              <!-- Season Filter Dropdown -->
              <div v-if="seasons.length > 1" class="mt-4 md:mt-0">
                <label for="season-filter" class="block text-sm font-medium text-gray-700 mb-1">Filter by Season</label>
                <select 
                  id="season-filter"
                  v-model="selectedSeason"
                  @change="filterStatsBySeason"
                  class="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                >
                  <option value="">All Seasons</option>
                  <option v-for="season in seasons" :key="season" :value="season">
                    {{ season }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <!-- Statistics Content -->
          <div v-if="hasStats">
            <!-- Career Stats -->
            <div class="mb-8">
              <h3 class="text-xl font-bold mb-4">Career Statistics</h3>
              <PlayerStatistics :stats="careerStats" />
            </div>

            <!-- Season Stats (if season is selected) -->
            <div v-if="selectedSeason" class="mb-8">
              <h3 class="text-xl font-bold mb-4">{{ selectedSeason }} Season Statistics</h3>
              <PlayerStatistics :stats="seasonStats" />
            </div>

            <!-- Recent Matches -->
            <div class="bg-white rounded-lg shadow-md p-6">
              <h3 class="text-xl font-bold mb-4">Recent Matches</h3>
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Match</th>
                      <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">K</th>
                      <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Hit%</th>
                      <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Aces</th>
                      <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Blocks</th>
                      <th scope="col" class="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Digs</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    <tr v-for="match in recentMatches" :key="match.id" class="hover:bg-gray-50">
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{{ formatDate(match.date) }}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {{ match.homeTeam.name }} vs {{ match.awayTeam.name }}
                        <span class="text-gray-500">
                          ({{ match.homeScore }}-{{ match.awayScore }})
                        </span>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-center">{{ match.stats.kills }}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-center">{{ formatValue(match.stats.derived.hittingPercentage) }}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-center">{{ match.stats.serviceAces }}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-center">{{ match.stats.blockPoints }}</td>
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-center">{{ match.stats.digSuccess }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- No Stats Message -->
          <div v-else class="bg-white rounded-lg shadow-md p-6 text-center text-gray-500">
            <p class="text-lg">No statistics available for this player.</p>
            <p class="mt-2">Statistics will appear here once the player participates in matches.</p>
          </div>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import DefaultLayout from '../layouts/DefaultLayout.vue'
import PlayerStatistics from '../components/stats/PlayerStatistics.vue'

// Router setup
const route = useRoute()
const router = useRouter()

// State
const player = ref(null)
const statistics = ref([])
const loading = ref(true)
const error = ref(null)
const selectedSeason = ref('')
const seasons = ref([])

// Computed properties
const playerId = computed(() => route.params.id)

const hasStats = computed(() => statistics.value && statistics.value.length > 0)

// Career stats (aggregated across all matches)
const careerStats = computed(() => {
  if (!hasStats.value) return null
  return statistics.value.find(stat => !stat.matchId) || createEmptyStats()
})

// Season stats (aggregated for selected season)
const seasonStats = computed(() => {
  if (!hasStats.value || !selectedSeason.value) return null
  return statistics.value.find(stat => 
    stat.match?.season === selectedSeason.value && !stat.matchId
  ) || createEmptyStats()
})

// Recent matches with stats
const recentMatches = computed(() => {
  if (!hasStats.value) return []
  return statistics.value
    .filter(stat => stat.matchId && stat.match)
    .sort((a, b) => new Date(b.match.date).getTime() - new Date(a.match.date).getTime())
    .slice(0, 10)
})

// Methods
function goBack() {
  router.back()
}

async function fetchPlayerData() {
  loading.value = true
  error.value = null
  
  try {
    // Fetch player details
    const playerResponse = await axios.get(`/api/players/${playerId.value}`)
    player.value = playerResponse.data.data
    
    // Fetch player statistics
    const statsResponse = await axios.get(`/api/players/${playerId.value}/statistics`)
    statistics.value = statsResponse.data.data
    
    // Extract unique seasons
    const uniqueSeasons = new Set()
    statistics.value.forEach(stat => {
      if (stat.match?.season) {
        uniqueSeasons.add(stat.match.season)
      }
    })
    seasons.value = Array.from(uniqueSeasons).sort()
    
  } catch (err) {
    console.error('Error fetching player data:', err)
    error.value = 'Failed to load player data. Please try again.'
  } finally {
    loading.value = false
  }
}

async function filterStatsBySeason() {
  loading.value = true
  error.value = null
  
  try {
    const url = selectedSeason.value 
      ? `/api/players/${playerId.value}/statistics?season=${encodeURIComponent(selectedSeason.value)}`
      : `/api/players/${playerId.value}/statistics`
      
    const response = await axios.get(url)
    statistics.value = response.data.data
  } catch (err) {
    console.error('Error filtering stats:', err)
    error.value = 'Failed to filter stats by season. Please try again.'
  } finally {
    loading.value = false
  }
}

// Utility functions
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString()
}

function formatValue(value: number): string {
  if (typeof value !== 'number') return '0'
  if (Number.isInteger(value)) return value.toString()
  return value.toFixed(1) + '%'
}

function createEmptyStats() {
  return {
    totalServes: 0,
    serviceAces: 0,
    serviceErrors: 0,
    totalAttacks: 0,
    kills: 0,
    attackErrors: 0,
    totalBlocks: 0,
    blockPoints: 0,
    blockErrors: 0,
    totalDigs: 0,
    digSuccess: 0,
    digErrors: 0,
    totalSets: 0,
    setSuccess: 0,
    setErrors: 0,
    totalReceives: 0,
    receiveSuccess: 0,
    receiveErrors: 0,
    derived: {
      hittingPercentage: 0,
      servicePercentage: 0,
      blockEfficiency: 0,
      digEfficiency: 0,
      setEfficiency: 0,
      receiveEfficiency: 0
    }
  }
}

// Lifecycle hooks
onMounted(() => {
  fetchPlayerData()
})
</script>

<style scoped>
/* Add any component-specific styles here */
</style> 