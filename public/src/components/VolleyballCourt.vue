<template>
  <div class="volleyball-court">
    <div class="text-lg font-semibold mb-2">Players</div>
    
    <!-- Display message if no players found -->
    <div v-if="!players || players.length === 0" class="text-center bg-gray-100 p-4 rounded-md">
      <p class="text-gray-600">No players found</p>
    </div>
    
    <!-- Player Grid that displays actual players -->
    <div v-else class="grid grid-cols-3 gap-3">
      <div 
        v-for="player in sortedPlayers" 
        :key="player.id" 
        @click="handlePlayerClick(player)"
        class="cursor-pointer bg-blue-100 hover:bg-blue-200 rounded-lg p-3 text-center transition-colors duration-150 border-2 border-blue-300"
      >
        <div class="font-bold text-xl text-blue-800">{{ player.jerseyNumber }}</div>
        <div class="text-sm text-blue-600">{{ player.name }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';

export default {
  name: 'VolleyballCourt',
  props: {
    players: {
      type: Array,
      required: true,
      default: () => []
    }
  },
  emits: ['player-selected'],
  setup(props, { emit }) {
    // Sort players by jersey number
    const sortedPlayers = computed(() => {
      return [...props.players].sort((a, b) => {
        const numA = parseInt(a.jerseyNumber) || 0;
        const numB = parseInt(b.jerseyNumber) || 0;
        return numA - numB;
      });
    });
    
    // Handle clicking a player square
    const handlePlayerClick = (player) => {
      emit('player-selected', player);
    };
    
    return {
      sortedPlayers,
      handlePlayerClick
    };
  }
};
</script>

<style scoped>
.volleyball-court {
  width: 100%;
}
</style> 