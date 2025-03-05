<template>
  <DashboardLayout>
    <div class="container mx-auto p-4">
      <h1 class="text-3xl font-bold mb-4">Statistics</h1>

      <!-- Statistics Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard title="Total Games" :value="totalGames" icon="mdi-volleyball" />
        <StatCard 
          title="Win Rate" 
          :value="winRate + '%'" 
          icon="mdi-trophy" 
          :color="winRate > 50 ? 'text-green-500' : 'text-red-500'" 
        />
        <StatCard title="Avg Points Per Game" :value="avgPoints.toFixed(1)" icon="mdi-scoreboard" />
      </div>

      <!-- Performance Overview Chart -->
      <div class="bg-white p-6 rounded-lg shadow-lg mb-8">
        <h2 class="text-2xl font-bold mb-4">Game Performance</h2>
        <div v-if="isLoading" class="text-center py-4">
          Loading chart data...
        </div>
        <div v-else-if="games.length === 0" class="text-center py-4">
          No games data available.
        </div>
        <div v-else class="h-64">
          <LineChart :chartData="chartData" :options="chartOptions" />
        </div>
      </div>

      <!-- Recent Games Summary -->
      <div class="bg-white p-6 rounded-lg shadow-lg">
        <h2 class="text-2xl font-bold mb-4">Recent Games</h2>
        <div v-if="isLoading" class="text-center py-4">
          Loading games...
        </div>
        <div v-else-if="games.length === 0" class="text-center py-4">
          No games found.
        </div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Match</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="game in games.slice(0, 5)" :key="game.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">{{ game.teamA }} vs {{ game.teamB }}</td>
                <td class="px-6 py-4 whitespace-nowrap">{{ formatDate(game.created_at) }}</td>
                <td class="px-6 py-4 whitespace-nowrap">{{ game.myPts }} - {{ game.oppPts }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span 
                    :class="game.myPts > game.oppPts ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'" 
                    class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                  >
                    {{ game.myPts > game.oppPts ? 'Win' : 'Loss' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import DashboardLayout from '../layouts/DashboardLayout.vue';
import StatCard from '../components/StatCard.vue';
import LineChart from '../components/LineChart.vue';
import { gameService } from '../services/gameService';

export default {
  name: 'Statistics',
  components: {
    DashboardLayout,
    StatCard,
    LineChart,
  },
  setup() {
    const games = ref([]);
    const isLoading = ref(true);

    // Fetch games from API
    const fetchGames = async () => {
      isLoading.value = true;
      try {
        games.value = await gameService.getAllGames();
      } catch (error) {
        console.error('Error fetching games:', error);
      } finally {
        isLoading.value = false;
      }
    };

    // Statistics calculations
    const totalGames = computed(() => games.value.length);
    
    const winCount = computed(() => 
      games.value.filter(game => game.myPts > game.oppPts).length
    );
    
    const winRate = computed(() => 
      totalGames.value > 0 ? Math.round((winCount.value / totalGames.value) * 100) : 0
    );
    
    const avgPoints = computed(() => 
      totalGames.value > 0 
        ? games.value.reduce((sum, game) => sum + game.myPts, 0) / totalGames.value 
        : 0
    );

    // Format date for display
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    };

    // Chart data preparation
    const chartData = computed(() => {
      // Get the most recent game with point history
      const recentGame = games.value.length > 0 ? games.value[0] : null;
      
      if (!recentGame || !recentGame.pointHistory || recentGame.pointHistory.length === 0) {
        // Fallback to original chart if no point history
        const displayGames = [...games.value].reverse().slice(0, 10);
        
        return {
          labels: displayGames.map(game => formatDate(game.created_at)),
          datasets: [
            {
              label: 'My Team Points',
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              borderColor: 'rgba(59, 130, 246, 1)',
              data: displayGames.map(game => game.myPts),
              fill: false,
            },
            {
              label: 'Opponent Points',
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              borderColor: 'rgba(239, 68, 68, 1)',
              data: displayGames.map(game => game.oppPts),
              fill: false,
            }
          ]
        };
      }
      
      // Point-by-point chart for the most recent game
      return {
        labels: recentGame.pointHistory.map((_, index) => `Point ${index + 1}`),
        datasets: [
          {
            label: recentGame.teamA,
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            borderColor: 'rgba(59, 130, 246, 1)',
            data: recentGame.pointHistory.map(point => point.teamAScore),
            fill: false,
          },
          {
            label: recentGame.teamB,
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            borderColor: 'rgba(239, 68, 68, 1)',
            data: recentGame.pointHistory.map(point => point.teamBScore),
            fill: false,
          }
        ]
      };
    });

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    };

    onMounted(() => {
      fetchGames();
    });

    return { 
      games, 
      isLoading, 
      totalGames, 
      winRate, 
      avgPoints, 
      chartData, 
      chartOptions,
      formatDate 
    };
  },
}
</script>

<style scoped>
/* Add any specific custom styles for your component */
</style>