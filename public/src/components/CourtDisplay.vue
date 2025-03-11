<template>
  <div>
    <div class="text-lg font-semibold mb-2">Players</div>
    
    <!-- Display message if no players found -->
    <div v-if="!players || players.length === 0" class="text-center bg-gray-100 p-4 rounded-md">
      <p class="text-gray-600">No players found</p>
    </div>
    
    <!-- Dynamic Player Grid that displays all players -->
    <div v-else>
      <!-- Use different grid layouts based on number of players -->
      <div 
        class="grid gap-2" 
        :class="[
          players.length <= 3 ? 'grid-cols-2' : 
          players.length <= 8 ? 'grid-cols-3' : 
          players.length <= 12 ? 'grid-cols-4' : 
          'grid-cols-5'
        ]"
      >
        <div 
          v-for="player in sortedPlayers" 
          :key="player.id" 
          @click="$emit('player-selected', player)"
          class="cursor-pointer bg-blue-100 hover:bg-blue-200 rounded-lg p-2 text-center transition-colors duration-150 border-2 border-blue-300 mb-2"
          :class="{'border-blue-500': player.id.startsWith('position-')}"
        >
          <div class="font-bold text-lg text-blue-800">{{ player.jerseyNumber }}</div>
          <div class="text-xs text-blue-600 truncate" :title="player.name">{{ player.name }}</div>
        </div>
      </div>
    </div>
    
    <!-- Service button -->
    <button 
      @click="$emit('toggle-service')" 
      class="mt-4 mx-auto block px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded"
    >
      Service
    </button>
  </div>
</template>

<script>
import { computed } from 'vue';

export default {
  name: 'CourtDisplay',
  props: {
    players: {
      type: Array,
      required: true,
      default: () => []
    }
  },
  setup(props) {
    // Create a computed property that sorts players by jersey number
    const sortedPlayers = computed(() => {
      // If there are no players, return an empty array
      if (!props.players || props.players.length === 0) {
        return [];
      }
      
      // Sort players by jersey number
      return [...props.players].sort((a, b) => {
        const numA = parseInt(a.jerseyNumber) || 0;
        const numB = parseInt(b.jerseyNumber) || 0;
        return numA - numB;
      });
    });
    
    return {
      sortedPlayers
    };
  }
};
</script> 