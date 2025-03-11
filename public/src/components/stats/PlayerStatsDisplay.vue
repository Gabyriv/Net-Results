<template>
  <div class="bg-white rounded-lg shadow-md p-4">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold">Player Stats: {{ playerName }}</h2>
      
      <!-- Season Filter (if stats from multiple seasons are available) -->
      <div v-if="seasons && seasons.length > 0" class="max-w-xs">
        <select 
          v-model="selectedSeason" 
          @change="fetchStats"
          class="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="">All Seasons</option>
          <option v-for="season in seasons" :key="season" :value="season">
            {{ season }}
          </option>
        </select>
      </div>
    </div>
    
    <div v-if="loading" class="flex justify-center items-center p-8">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
    
    <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      {{ error }}
    </div>
    
    <div v-else-if="!hasStats" class="text-center p-8 text-gray-500">
      No stats available for this player.
    </div>
    
    <div v-else>
      <!-- Chart Container -->
      <div class="h-64 md:h-80">
        <canvas ref="statsChart"></canvas>
      </div>
      
      <!-- Stats Summary Table -->
      <div class="mt-6 overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stat Category
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Value
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="stat in formattedStats" :key="stat.type">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {{ stat.label }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ stat.value }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
// Import Chart.js
import Chart from 'chart.js/auto';

export default {
  name: 'PlayerStatsDisplay',
  props: {
    playerId: {
      type: String,
      required: true
    },
    playerName: {
      type: String,
      required: true
    },
    // Optionally allow filtering by season
    seasons: {
      type: Array,
      default: () => []
    },
    // For game-specific stats view
    gameId: {
      type: [String, Number],
      default: null
    }
  },
  data() {
    return {
      stats: [],
      loading: true,
      error: null,
      chart: null,
      selectedSeason: '',
      // Chart colors
      colors: {
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)'
        ]
      }
    }
  },
  computed: {
    hasStats() {
      return this.stats && this.stats.length > 0;
    },
    apiUrl() {
      // If gameId is provided, get stats for that specific game
      if (this.gameId) {
        return `/api/games/${this.gameId}/player-stats?playerId=${this.playerId}`;
      }
      
      // Otherwise get aggregated stats (could be filtered by season)
      let url = `/api/players/${this.playerId}/stats`;
      if (this.selectedSeason) {
        url += `?season=${encodeURIComponent(this.selectedSeason)}`;
      }
      return url;
    },
    formattedStats() {
      if (!this.hasStats) return [];
      
      // Format stats for display in the table
      return this.stats.map(stat => ({
        type: stat.statType, 
        label: this.formatStatType(stat.statType),
        value: stat.value
      }));
    },
    chartData() {
      if (!this.hasStats) return null;
      
      const labels = this.formattedStats.map(stat => stat.label);
      const data = this.formattedStats.map(stat => stat.value);
      
      return {
        labels,
        datasets: [
          {
            label: 'Stats',
            data,
            backgroundColor: this.colors.backgroundColor,
            borderColor: this.colors.borderColor,
            borderWidth: 1
          }
        ]
      };
    }
  },
  mounted() {
    this.fetchStats();
  },
  methods: {
    formatStatType(statType) {
      // Convert SNAKE_CASE to Title Case (e.g., HITTING -> Hitting)
      return statType.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    },
    async fetchStats() {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await fetch(this.apiUrl);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch stats');
        }
        
        this.stats = data.data;
        
        // If the API returns stats in a different format, we may need to transform them
        if (this.stats && !Array.isArray(this.stats)) {
          // Handle case where stats come as an object with different structure
          this.stats = Object.entries(this.stats).map(([key, value]) => ({
            statType: key,
            value: value
          }));
        }
        
        // Update chart after data is loaded
        this.$nextTick(() => {
          this.updateChart();
        });
      } catch (error) {
        this.error = error.message;
        console.error('Error fetching player stats:', error);
      } finally {
        this.loading = false;
      }
    },
    updateChart() {
      // Destroy existing chart if it exists
      if (this.chart) {
        this.chart.destroy();
      }
      
      // Create new chart if we have data and the canvas element is available
      if (this.hasStats && this.$refs.statsChart) {
        const ctx = this.$refs.statsChart.getContext('2d');
        this.chart = new Chart(ctx, {
          type: 'bar',
          data: this.chartData,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: {
                display: true,
                text: `${this.playerName}'s Stats ${this.selectedSeason ? '- ' + this.selectedSeason : ''}`
              },
              legend: {
                display: false
              },
              tooltip: {
                callbacks: {
                  label: function(context) {
                    return `Value: ${context.raw}`;
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Value'
                }
              }
            }
          }
        });
      }
    }
  },
  watch: {
    // Reload stats if playerId changes
    playerId() {
      this.fetchStats();
    }
  },
  beforeUnmount() {
    // Clean up chart when component is destroyed
    if (this.chart) {
      this.chart.destroy();
    }
  }
}
</script> 