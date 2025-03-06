<template>
  <DashboardLayout>
    <div class="container mx-auto p-4">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold">Statistics</h1>
        
        <!-- Team Selector -->
        <div class="flex items-center space-x-2">
          <label class="text-gray-700 font-medium">Select Team:</label>
          <select 
            v-model="selectedTeamId" 
            @change="handleTeamChange"
            class="border border-gray-300 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option :value="null">All Teams</option>
            <option v-for="team in teams" :key="team.id" :value="team.id">{{ team.name }}</option>
          </select>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoadingTeams" class="flex justify-center items-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>

      <!-- No Teams Message -->
      <div v-else-if="teams.length === 0" class="bg-white p-6 rounded-lg shadow-lg text-center py-8">
        <p class="text-gray-600 mb-4">You haven't created any teams yet.</p>
        <router-link to="/teams" class="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg">
          Create Your First Team
        </router-link>
      </div>

      <!-- Team Stats Content -->
      <div v-else>
        <!-- Selected Team Info -->
        <div v-if="selectedTeam" class="bg-white p-6 rounded-lg shadow-lg mb-8">
          <div class="flex justify-between items-center">
            <div>
              <h2 class="text-2xl font-bold">{{ selectedTeam.name }}</h2>
              <p class="text-gray-600">Team Statistics</p>
            </div>
            <button 
              @click="viewTeamDetails(selectedTeam)"
              class="text-blue-600 hover:text-blue-800"
            >
              View Team Details
            </button>
          </div>
        </div>

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
          <div v-else-if="filteredGames.length === 0" class="text-center py-4">
            No games data available for this team.
          </div>
          <div v-else class="h-64">
            <LineChart 
              :key="chartUpdateTrigger" 
              :chartData="chartData" 
              :options="chartOptions" 
            />
          </div>
        </div>

        <!-- Recent Games Summary -->
        <div class="bg-white p-6 rounded-lg shadow-lg">
          <h2 class="text-2xl font-bold mb-4">Recent Games</h2>
          <div v-if="isLoading" class="text-center py-4">
            Loading games...
          </div>
          <div v-else-if="filteredGames.length === 0" class="text-center py-4">
            No games found for this team.
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
                <tr v-for="game in filteredGames.slice(0, 5)" :key="game.id" class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">{{ game.myTeam }} vs {{ game.oppTeam }}</td>
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
    </div>
  </DashboardLayout>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import DashboardLayout from '../layouts/DashboardLayout.vue';
import StatCard from '../components/StatCard.vue';
import LineChart from '../components/LineChart.vue';
import { gameService } from '../services/gameService';
import { useTeams } from '../composable/useTeams';
import { useRouter } from 'vue-router';

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
    const selectedTeamId = ref(null);
    const router = useRouter();
    const showTeamDetailsModal = ref(false);
    const teamDetailsData = ref(null);
    
    // Teams data
    const { teams, loading: isLoadingTeams, fetchTeams } = useTeams();
    
    // Get the selected team object
    const selectedTeam = computed(() => {
      if (!selectedTeamId.value) return null;
      return teams.value.find(team => team.id === selectedTeamId.value);
    });
    
    // Filter games based on selected team
    const filteredGames = computed(() => {
      if (!selectedTeam.value) return games.value;
      
      return games.value.filter(game => 
        game.myTeam === selectedTeam.value.name
      );
    });

    // Handle team change
    const handleTeamChange = async () => {
      await fetchGames();
    };
    
    // Fetch games from API
    const fetchGames = async () => {
      isLoading.value = true;
      try {
        // If a team is selected, get games for that team
        if (selectedTeam.value) {
          games.value = await gameService.getGamesByTeam(selectedTeam.value.name);
        } else {
          // Otherwise get all games
          games.value = await gameService.getAllGames();
        }
      } catch (error) {
        console.error('Error fetching games:', error);
      } finally {
        isLoading.value = false;
      }
    };

    // Statistics calculations based on filtered games
    const totalGames = computed(() => filteredGames.value.length);
    
    const winCount = computed(() => 
      filteredGames.value.filter(game => game.myPts > game.oppPts).length
    );
    
    const winRate = computed(() => 
      totalGames.value > 0 ? Math.round((winCount.value / totalGames.value) * 100) : 0
    );
    
    const avgPoints = computed(() => 
      totalGames.value > 0 
        ? filteredGames.value.reduce((sum, game) => sum + game.myPts, 0) / totalGames.value 
        : 0
    );

    // Format date for display
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    };

    // Chart data preparation using filtered games
    const chartData = computed(() => {
      // Get the most recent 10 games (or fewer if not available)
      const displayGames = [...filteredGames.value].reverse().slice(0, 10);
      
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
    });
    
    // Create a trigger to force chart updates when data changes
    const chartUpdateTrigger = computed(() => {
      // This will update whenever filtered games changes
      return JSON.stringify(filteredGames.value.map(g => g.id));
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

    // Function to view team details
    const viewTeamDetails = (team) => {
      // Navigate to the Teams page with a query parameter to indicate which team to show
      router.push({ 
        path: '/teams',
        query: { teamId: team.id }
      });
    };

    // Initialize: fetch teams and games
    onMounted(async () => {
      try {
        // Start both fetches in parallel
        const teamsPromise = fetchTeams({ myTeams: true });
        
        // Show loading state immediately
        isLoading.value = true;
        
        // Wait for teams to load first
        await teamsPromise;
        
        // Then fetch games (this can happen after the UI is rendered)
        await fetchGames();
      } catch (error) {
        console.error('Error initializing stats page:', error);
      } finally {
        // Ensure loading state is cleared even if there's an error
        isLoading.value = false;
      }
    });
    
    // Watch for team selection changes
    watch(() => selectedTeamId.value, async () => {
      // Show loading state when changing teams
      isLoading.value = true;
      try {
        await fetchGames();
      } catch (error) {
        console.error('Error fetching games for selected team:', error);
      } finally {
        isLoading.value = false;
      }
    });

    return { 
      games,
      teams,
      selectedTeamId,
      selectedTeam,
      filteredGames, 
      isLoading,
      isLoadingTeams, 
      totalGames, 
      winRate, 
      avgPoints, 
      chartData, 
      chartOptions,
      formatDate,
      handleTeamChange,
      chartUpdateTrigger,
      viewTeamDetails
    };
  },
}
</script>

<style scoped>
/* Add any specific custom styles for your component */
</style>