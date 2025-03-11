<template>
  <div class="bg-white rounded-lg shadow-md p-4">
    <h2 class="text-xl font-bold mb-4">Player Statistics</h2>
    
    <!-- Team selection removed - only showing home team stats -->
    <div class="mb-3">
      <h3 class="text-lg font-medium">{{ teamNames.home }} Players</h3>
    </div>
    
    <!-- No stats message -->
    <div v-if="filteredStats.length === 0" class="text-center py-4 text-gray-500">
      No statistics recorded for your team yet.
    </div>
    
    <!-- Stats summary by player -->
    <div v-else>
      <!-- Player selector -->
      <div class="flex flex-wrap gap-2 mb-4">
        <button 
          v-for="playerNum in teamPlayerNumbers" 
          :key="playerNum"
          @click="selectedPlayerNumber = selectedPlayerNumber === playerNum ? null : playerNum"
          class="w-10 h-10 rounded-md text-sm font-medium flex items-center justify-center"
          :class="[
            'bg-blue-50 text-blue-700',
            selectedPlayerNumber === playerNum ? 'ring-2 ring-blue-500' : ''
          ]"
        >
          {{ playerNum }}
        </button>
      </div>
      
      <!-- Stats table -->
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stat Type</th>
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="(stat, index) in displayedStats" :key="index">
              <td class="px-4 py-2 whitespace-nowrap">{{ stat.playerNumber }}</td>
              <td class="px-4 py-2 whitespace-nowrap">{{ stat.statType }}</td>
              <td class="px-4 py-2 whitespace-nowrap">
                <span 
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="{
                    'bg-green-100 text-green-800': stat.quality === '+',
                    'bg-yellow-100 text-yellow-800': stat.quality === '=',
                    'bg-red-100 text-red-800': stat.quality === '-'
                  }"
                >
                  {{ qualityLabel(stat.quality) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Stat summary -->
      <div class="mt-6 bg-gray-50 p-4 rounded-lg">
        <h3 class="text-lg font-medium mb-2">Summary</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div v-for="statType in statTypes" :key="statType" class="border rounded-lg p-3">
            <h4 class="font-medium mb-2">{{ statType }}</h4>
            <div class="flex justify-between text-sm">
              <span class="text-green-600">+: {{ countStatsByType(statType, '+') }}</span>
              <span class="text-yellow-600">=: {{ countStatsByType(statType, '=') }}</span>
              <span class="text-red-600">-: {{ countStatsByType(statType, '-') }}</span>
            </div>
            <div class="mt-1 text-sm text-gray-500">
              Efficiency: {{ calculateEfficiency(statType) }}%
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PlayerStatsTracker',
  props: {
    stats: {
      type: Array,
      required: true
    },
    teams: {
      type: Object,
      required: true,
      default: () => ({ home: 'Home Team', away: 'Away Team' })
    }
  },
  data() {
    return {
      selectedPlayerNumber: null,
      statTypes: ['Serve', 'Pass', 'Set', 'Attack', 'Block', 'Dig']
    }
  },
  computed: {
    teamNames() {
      return {
        home: this.teams.home || 'Home Team',
        away: this.teams.away || 'Away Team'
      }
    },
    filteredStats() {
      // Only show stats for home team players (not errors)
      return this.stats.filter(stat => 
        stat.team === 'home' && stat.playerNumber !== 'E'
      );
    },
    teamPlayerNumbers() {
      // Get unique player numbers for the selected team
      const playerNums = new Set();
      this.filteredStats.forEach(stat => {
        playerNums.add(stat.playerNumber);
      });
      return Array.from(playerNums).sort((a, b) => a - b);
    },
    displayedStats() {
      if (this.selectedPlayerNumber) {
        return this.filteredStats.filter(stat => stat.playerNumber === this.selectedPlayerNumber);
      }
      return this.filteredStats;
    }
  },
  methods: {
    qualityLabel(quality) {
      switch(quality) {
        case '+': return 'Point';
        case '=': return 'Good';
        case '-': return 'Error';
        default: return quality;
      }
    },
    countStatsByType(type, quality) {
      let stats = this.displayedStats.filter(s => s.statType === type);
      if (quality) {
        stats = stats.filter(s => s.quality === quality);
      }
      return stats.length;
    },
    calculateEfficiency(type) {
      const positives = this.countStatsByType(type, '+');
      const negatives = this.countStatsByType(type, '-');
      const total = this.countStatsByType(type);
      
      if (total === 0) return 0;
      
      // Volleyball efficiency: (positives - negatives) / total * 100
      const efficiency = ((positives - negatives) / total) * 100;
      return Math.round(efficiency * 10) / 10; // Round to 1 decimal place
    }
  }
}
</script> 