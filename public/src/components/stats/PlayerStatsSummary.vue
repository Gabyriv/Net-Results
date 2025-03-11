<template>
  <div class="bg-white rounded-lg shadow-md p-4">
    <h2 class="text-xl font-bold mb-4">Match Statistics Summary</h2>
    
    <div v-if="!homeTeamStats.length" class="text-center py-8 text-gray-500">
      No statistics were recorded for your team in this match.
    </div>
    
    <div v-else>
      <div class="mb-6">
        <h3 class="text-lg font-medium mb-3">{{ teams.home }} Statistics</h3>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hits</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Blocks</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Passes</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serves</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Digs</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="player in homeTeamPlayers" :key="`home-${player}`">
                <td class="px-4 py-2 whitespace-nowrap font-medium">{{ player }}</td>
                <td class="px-4 py-2 whitespace-nowrap">
                  <span class="text-green-600">{{ countStats('home', player, 'Hitting', '+') }}</span> /
                  <span class="text-yellow-600">{{ countStats('home', player, 'Hitting', '=') }}</span> /
                  <span class="text-red-600">{{ countStats('home', player, 'Hitting', '-') }}</span>
                </td>
                <td class="px-4 py-2 whitespace-nowrap">
                  <span class="text-green-600">{{ countStats('home', player, 'Blocking', '+') }}</span> /
                  <span class="text-yellow-600">{{ countStats('home', player, 'Blocking', '=') }}</span> /
                  <span class="text-red-600">{{ countStats('home', player, 'Blocking', '-') }}</span>
                </td>
                <td class="px-4 py-2 whitespace-nowrap">
                  <span class="text-green-600">{{ countStats('home', player, 'Passing', '+') }}</span> /
                  <span class="text-yellow-600">{{ countStats('home', player, 'Passing', '=') }}</span> /
                  <span class="text-red-600">{{ countStats('home', player, 'Passing', '-') }}</span>
                </td>
                <td class="px-4 py-2 whitespace-nowrap">
                  <span class="text-green-600">{{ countStats('home', player, 'Serving', '+') }}</span> /
                  <span class="text-yellow-600">{{ countStats('home', player, 'Serving', '=') }}</span> /
                  <span class="text-red-600">{{ countStats('home', player, 'Serving', '-') }}</span>
                </td>
                <td class="px-4 py-2 whitespace-nowrap">
                  <span class="text-green-600">{{ countStats('home', player, 'Digging', '+') }}</span> /
                  <span class="text-yellow-600">{{ countStats('home', player, 'Digging', '=') }}</span> /
                  <span class="text-red-600">{{ countStats('home', player, 'Digging', '-') }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- Team Overall Stats Section -->
      <div class="mt-6 bg-gray-50 p-4 rounded-lg">
        <h3 class="text-lg font-medium mb-3">Team Overall Statistics</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div v-for="statType in statTypes" :key="statType" class="border rounded-lg p-3">
            <h4 class="font-medium mb-2">{{ statType }}</h4>
            <div class="flex justify-between text-sm">
              <span class="text-green-600">+: {{ countTeamStats(statType, '+') }}</span>
              <span class="text-yellow-600">=: {{ countTeamStats(statType, '=') }}</span>
              <span class="text-red-600">-: {{ countTeamStats(statType, '-') }}</span>
            </div>
            <div class="mt-1 text-sm text-gray-500">
              Efficiency: {{ calculateTeamEfficiency(statType) }}%
            </div>
          </div>
        </div>
      </div>
      
      <!-- Stats legend -->
      <div class="mt-4 text-sm text-gray-600">
        <p><span class="text-green-600 font-medium">Green</span>: Point scoring plays (+), 
           <span class="text-yellow-600 font-medium">Yellow</span>: Good plays without point (=), 
           <span class="text-red-600 font-medium">Red</span>: Errors (-)</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PlayerStatsSummary',
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
  computed: {
    statTypes() {
      return ['Serve', 'Pass', 'Set', 'Attack', 'Block', 'Dig'];
    },
    homeTeamStats() {
      // Filter out only the home team player stats (not errors)
      return this.stats.filter(stat => 
        stat.team === 'home' && stat.playerNumber !== 'E'
      );
    },
    homeTeamPlayers() {
      return this.getTeamPlayers('home');
    }
  },
  methods: {
    getTeamPlayers(team) {
      // Get unique player numbers for the team
      const playerNums = new Set();
      this.stats.forEach(stat => {
        if (stat.team === team && stat.playerNumber !== 'E') {
          playerNums.add(stat.playerNumber);
        }
      });
      return Array.from(playerNums).sort((a, b) => a - b);
    },
    countStats(team, player, statType, quality) {
      return this.stats.filter(
        s => s.team === team && 
             s.playerNumber === player && 
             s.statType === statType && 
             (quality ? s.quality === quality : true)
      ).length;
    },
    countTeamStats(statType, quality) {
      return this.homeTeamStats.filter(
        s => s.statType === statType && 
             (quality ? s.quality === quality : true)
      ).length;
    },
    calculateTeamEfficiency(statType) {
      const positives = this.countTeamStats(statType, '+');
      const negatives = this.countTeamStats(statType, '-');
      const total = this.countTeamStats(statType);
      
      if (total === 0) return 0;
      
      // Volleyball efficiency: (positives - negatives) / total * 100
      const efficiency = ((positives - negatives) / total) * 100;
      return Math.round(efficiency * 10) / 10; // Round to 1 decimal place
    }
  }
}
</script> 