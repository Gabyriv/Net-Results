<template>
  <DashboardLayout>
    <div class="container mx-auto p-4">
      <h1 class="text-3xl font-bold mb-4"></h1> <!--Dashboard erase-->
      
      <!-- Loading state -->
      <div v-if="isLoading" class="w-full flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
      
      <!-- Loaded content -->
      <div v-else>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard title="Total Matches" :value="totalMatches" icon="mdi-soccer" />
          <StatCard title="Win Rate" :value="winRate + '%'" icon="mdi-percent" />
          <StatCard title="Total Wins" :value="totalWins" icon="mdi-trophy" />
        </div>
        <div class="bg-white p-6 rounded-lg shadow-lg">
          <h2 class="text-2xl font-bold mb-4">Performance Overview</h2>
          <LineChart 
            :chartData="chartData" 
            :options="chartOptions" 
            chartType="bar"
          />
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script>
import { computed, ref, onMounted } from 'vue'
import { useMainStore } from '../store/index'
import StatCard from '../components/StatCard.vue'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import LineChart from '../components/LineChart.vue'
import { gameService } from '../services/gameService'
import { useTeams } from '../composable/useTeams'
import { usePlayers } from '../composable/usePlayers'

export default {
  name: 'Dashboard',
  components: { StatCard, DashboardLayout, LineChart },
  setup() {
    const store = useMainStore()
    const isLoading = ref(true)
    const { teams, loading: loadingTeams, fetchTeams } = useTeams()
    const { players, loading: loadingPlayers, fetchPlayers } = usePlayers()
    const games = ref([])
    
    // Computed properties for stats
    const totalMatches = computed(() => games.value?.length || 0)
    const totalWins = computed(() => {
      return games.value?.filter(game => game.myPts > game.oppPts).length || 0
    })
    
    // Calculate win rate percentage
    const winRate = computed(() => {
      if (totalMatches.value === 0) return 0
      return Math.round((totalWins.value / totalMatches.value) * 100)
    })

    const chartData = computed(() => {
      const lastGames = [...(games.value || [])].slice(0, 10).reverse() // Only show last 10 games in reverse order
      
      return {
        labels: lastGames.map(game => {
          // Format the date for display
          const date = new Date(game.created_at)
          return date.toLocaleDateString()
        }),
        datasets: [
          {
            label: 'Game Results',
            // Green for wins, red for losses
            backgroundColor: lastGames.map(game => game.myPts > game.oppPts ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)'),
            borderColor: lastGames.map(game => game.myPts > game.oppPts ? 'rgba(34, 197, 94, 1)' : 'rgba(239, 68, 68, 1)'),
            borderWidth: 2,
            // Use 1 for wins and -1 for losses
            data: lastGames.map(game => game.myPts > game.oppPts ? 1 : -1),
          }
        ],
      }
    })
    
    // Chart options - changed to bar type
    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      type: 'bar',
      scales: {
        y: {
          beginAtZero: false,
          min: -1.5,  // Give some space below the bars
          max: 1.5,   // Give some space above the bars
          ticks: {
            callback: function(value) {
              if (value === 1) return 'Win';
              if (value === -1) return 'Loss';
              return '';
            }
          }
        }
      },
      plugins: {
        legend: {
          display: false  // Hide legend since we have only one dataset with clear colors
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.raw === 1 ? 'Win' : 'Loss';
            }
          }
        }
      }
    }
    
    // Fetch data
    const fetchData = async () => {
      isLoading.value = true
      try {
        // Use the store's fetchDashboardData action to get all required data
        await store.fetchDashboardData()
        
        // Copy data to our local refs
        games.value = store.matches || []
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        isLoading.value = false
      }
    }
    
    // Initialize data
    onMounted(async () => {
      try {
        await fetchData()
      } catch (error) {
        console.error('Error loading dashboard data:', error)
        isLoading.value = false
      }
    })

    return { 
      totalMatches, 
      totalWins,
      winRate,
      chartData, 
      chartOptions,
      isLoading 
    }
  },
}
</script>

<style scoped>
/* Add any component-specific styles here */
</style>
