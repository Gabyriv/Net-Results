<template>
  <div class="bg-white rounded-lg shadow-md p-4">
    <div class="flex justify-between mb-4">
      <h2 class="text-xl font-bold">{{ player.name }} (#{{ player.jerseyNumber }}) Stats</h2>
      <button @click="$emit('close')" class="text-gray-500 hover:text-gray-700">
        <span class="material-icons">close</span>
      </button>
    </div>
    
    <div v-if="!hasStats" class="text-center py-8 text-gray-500">
      No statistics recorded for this player yet.
    </div>
    
    <div v-else>
      <!-- Performance Charts -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <!-- Skills Distribution Pie Chart -->
        <div class="border rounded-lg p-4">
          <h3 class="text-lg font-medium mb-3">Skills Distribution</h3>
          <canvas ref="distributionChart" height="200"></canvas>
        </div>
        
        <!-- Performance Radar Chart -->
        <div class="border rounded-lg p-4">
          <h3 class="text-lg font-medium mb-3">Performance Radar</h3>
          <canvas ref="radarChart" height="200"></canvas>
        </div>
      </div>
      
      <!-- Detailed Stats Table -->
      <div class="overflow-x-auto mt-6">
        <h3 class="text-lg font-medium mb-3">Detailed Statistics</h3>
        <table class="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Skill</th>
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Good (+)</th>
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Neutral (=)</th>
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Errors (-)</th>
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Efficiency</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="skill in statTypes" :key="skill">
              <td class="px-4 py-2 whitespace-nowrap font-medium">{{ skill }}</td>
              <td class="px-4 py-2 whitespace-nowrap text-green-600">{{ countPlayerStats(skill, '+') }}</td>
              <td class="px-4 py-2 whitespace-nowrap text-yellow-600">{{ countPlayerStats(skill, '=') }}</td>
              <td class="px-4 py-2 whitespace-nowrap text-red-600">{{ countPlayerStats(skill, '-') }}</td>
              <td class="px-4 py-2 whitespace-nowrap">
                <span :class="getEfficiencyClass(calculateEfficiency(skill))">
                  {{ calculateEfficiency(skill) }}%
                </span>
              </td>
            </tr>
            <tr class="bg-gray-50 font-medium">
              <td class="px-4 py-2 whitespace-nowrap">Overall</td>
              <td class="px-4 py-2 whitespace-nowrap text-green-600">{{ totalGoodPlays }}</td>
              <td class="px-4 py-2 whitespace-nowrap text-yellow-600">{{ totalNeutralPlays }}</td>
              <td class="px-4 py-2 whitespace-nowrap text-red-600">{{ totalErrors }}</td>
              <td class="px-4 py-2 whitespace-nowrap">
                <span :class="getEfficiencyClass(overallEfficiency)">
                  {{ overallEfficiency }}%
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue';
import Chart from 'chart.js/auto';

export default {
  name: 'PlayerStatsChart',
  props: {
    player: {
      type: Object,
      required: true
    },
    stats: {
      type: Array,
      required: true,
      default: () => []
    }
  },
  emits: ['close'],
  setup(props) {
    const distributionChart = ref(null);
    const radarChart = ref(null);
    let distributionChartInstance = null;
    let radarChartInstance = null;
    
    const statTypes = ['Serve', 'Pass', 'Set', 'Attack', 'Block', 'Dig'];
    
    // Filter stats for just this player
    const playerStats = computed(() => {
      return props.stats.filter(s => 
        (s.playerId === props.player.id) || 
        (s.playerNumber === props.player.jerseyNumber && !s.playerId)
      );
    });
    
    const hasStats = computed(() => playerStats.value.length > 0);
    
    // Calculate counts for different play types
    const countPlayerStats = (skill, quality = null) => {
      return playerStats.value.filter(s => 
        s.statType === skill && 
        (quality ? s.quality === quality : true)
      ).length;
    };
    
    // Calculate efficiency percentage
    const calculateEfficiency = (skill) => {
      const good = countPlayerStats(skill, '+');
      const errors = countPlayerStats(skill, '-');
      const total = countPlayerStats(skill);
      
      if (total === 0) return 0;
      
      const efficiency = ((good - errors) / total) * 100;
      return Math.round(efficiency * 10) / 10; // Round to 1 decimal place
    };
    
    // Get CSS class based on efficiency
    const getEfficiencyClass = (efficiency) => {
      if (efficiency > 30) return 'text-green-600 font-medium';
      if (efficiency > 0) return 'text-green-500';
      if (efficiency > -20) return 'text-yellow-500';
      return 'text-red-500';
    };
    
    // Overall stats
    const totalGoodPlays = computed(() => 
      statTypes.reduce((sum, skill) => sum + countPlayerStats(skill, '+'), 0)
    );
    
    const totalNeutralPlays = computed(() => 
      statTypes.reduce((sum, skill) => sum + countPlayerStats(skill, '='), 0)
    );
    
    const totalErrors = computed(() => 
      statTypes.reduce((sum, skill) => sum + countPlayerStats(skill, '-'), 0)
    );
    
    const overallEfficiency = computed(() => {
      const totalPlays = totalGoodPlays.value + totalNeutralPlays.value + totalErrors.value;
      if (totalPlays === 0) return 0;
      
      const efficiency = ((totalGoodPlays.value - totalErrors.value) / totalPlays) * 100;
      return Math.round(efficiency * 10) / 10; // Round to 1 decimal place
    });
    
    // Initialize charts
    const initCharts = () => {
      // Only create charts if we have data
      if (!hasStats.value) return;
      
      // Destroy existing charts if they exist
      if (distributionChartInstance) distributionChartInstance.destroy();
      if (radarChartInstance) radarChartInstance.destroy();
      
      // Skills distribution pie chart
      const distributionCtx = distributionChart.value.getContext('2d');
      const distributionData = statTypes.map(skill => countPlayerStats(skill));
      
      distributionChartInstance = new Chart(distributionCtx, {
        type: 'pie',
        data: {
          labels: statTypes,
          datasets: [{
            data: distributionData,
            backgroundColor: [
              '#f87979', // Hitting
              '#7acbf9', // Blocking
              '#ffd166', // Passing
              '#06d6a0', // Serving
              '#118ab2'  // Digging
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              position: 'bottom'
            }
          }
        }
      });
      
      // Performance radar chart
      const radarCtx = radarChart.value.getContext('2d');
      const efficiencyData = statTypes.map(skill => calculateEfficiency(skill));
      
      radarChartInstance = new Chart(radarCtx, {
        type: 'radar',
        data: {
          labels: statTypes,
          datasets: [{
            label: 'Efficiency %',
            data: efficiencyData,
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            borderColor: 'rgba(54, 162, 235, 1)',
            pointBackgroundColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          scales: {
            r: {
              min: -50,
              max: 100,
              ticks: {
                stepSize: 25
              }
            }
          }
        }
      });
    };
    
    // Watch for changes in stats to update charts
    watch(() => props.stats, () => {
      initCharts();
    }, { deep: true });
    
    onMounted(() => {
      initCharts();
    });
    
    return {
      distributionChart,
      radarChart,
      statTypes,
      playerStats,
      hasStats,
      countPlayerStats,
      calculateEfficiency,
      getEfficiencyClass,
      totalGoodPlays,
      totalNeutralPlays,
      totalErrors,
      overallEfficiency
    };
  }
};
</script> 