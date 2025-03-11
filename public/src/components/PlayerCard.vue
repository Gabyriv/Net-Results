<template>
  <div>
    <div 
      class="bg-white rounded-lg shadow-md p-4 transition hover:shadow-lg cursor-pointer"
      @click="showStats = true"
    >
      <div class="flex items-center">
        <div class="w-12 h-12 flex-shrink-0 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">
          {{ player.jerseyNumber }}
        </div>
        <div class="ml-4">
          <h3 class="text-lg font-medium">{{ player.name }}</h3>
          <p class="text-sm text-gray-500">Jersey #{{ player.jerseyNumber }}</p>
        </div>
      </div>
      
      <!-- Show this only if player has stats -->
      <div v-if="hasStats" class="mt-3 pt-3 border-t">
        <p class="text-sm text-gray-600 mb-1">Recent performance:</p>
        <div class="flex items-center">
          <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium" 
            :class="getEfficiencyClass(playerEfficiency)">
            {{ playerEfficiency }}% efficiency
          </span>
          <span class="ml-2 text-xs text-gray-500">
            ({{ totalStats }} actions in {{ statsByMatch.size }} matches)
          </span>
        </div>
        <div class="flex mt-1">
          <span class="text-green-600 text-xs mr-2">+{{ goodPlays }}</span>
          <span class="text-yellow-600 text-xs mr-2">={{ neutralPlays }}</span>
          <span class="text-red-600 text-xs">-{{ errors }}</span>
        </div>
      </div>
      
      <div v-else class="mt-3 pt-3 border-t">
        <p class="text-sm text-gray-500">No stats recorded yet</p>
      </div>
    </div>
    
    <!-- Statistics Modal -->
    <div v-if="showStats" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto py-6">
      <div class="w-full max-w-4xl mx-4">
        <PlayerStatsChart :player="player" :stats="allStats" @close="showStats = false" />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import PlayerStatsChart from './stats/PlayerStatsChart.vue';

export default {
  components: { PlayerStatsChart },
  props: {
    player: {
      type: Object,
      required: true
    },
    allStats: {
      type: Array,
      default: () => []
    }
  },
  setup(props) {
    const showStats = ref(false);
    
    // Filter stats for this player
    const playerStats = computed(() => {
      return props.allStats.filter(s => 
        (s.playerId === props.player.id) || 
        (s.playerNumber === props.player.jerseyNumber && !s.playerId)
      );
    });
    
    const hasStats = computed(() => playerStats.value.length > 0);
    
    // Count play types
    const goodPlays = computed(() => playerStats.value.filter(s => s.quality === '+').length);
    const neutralPlays = computed(() => playerStats.value.filter(s => s.quality === '=').length);
    const errors = computed(() => playerStats.value.filter(s => s.quality === '-').length);
    
    // Total stats
    const totalStats = computed(() => playerStats.value.length);
    
    // Player efficiency
    const playerEfficiency = computed(() => {
      if (totalStats.value === 0) return 0;
      
      const efficiency = ((goodPlays.value - errors.value) / totalStats.value) * 100;
      return Math.round(efficiency);
    });
    
    // Get CSS class based on efficiency
    const getEfficiencyClass = (efficiency) => {
      if (efficiency > 30) return 'bg-green-100 text-green-800';
      if (efficiency > 0) return 'bg-green-50 text-green-700';
      if (efficiency > -20) return 'bg-yellow-100 text-yellow-800';
      return 'bg-red-100 text-red-800';
    };
    
    // Track unique match IDs where the player has stats
    const statsByMatch = computed(() => {
      const matchIds = new Set();
      playerStats.value.forEach(stat => {
        if (stat.matchId) matchIds.add(stat.matchId);
      });
      return matchIds;
    });
    
    return {
      showStats,
      playerStats,
      hasStats,
      goodPlays,
      neutralPlays,
      errors,
      totalStats,
      playerEfficiency,
      getEfficiencyClass,
      statsByMatch
    };
  }
};
</script>
