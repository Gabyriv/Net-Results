<template>
  <div>
    <div class="text-lg font-semibold mb-2">Players</div>
    
    <!-- Display message if no players found -->
    <div v-if="!players || players.length === 0" class="text-center bg-gray-100 p-4 rounded-md">
      <p class="text-gray-600">No players found</p>
    </div>
    
    <!-- Player Grid that displays actual players in the exact 3x2 layout shown in the screenshot -->
    <div v-else>
      <!-- First row -->
      <div class="grid grid-cols-3 gap-3 mb-3">
        <div 
          v-for="player in displayablePlayers.slice(0, 3)" 
          :key="player.id" 
          @click="$emit('player-selected', player)"
          class="cursor-pointer bg-blue-100 hover:bg-blue-200 rounded-lg p-3 text-center transition-colors duration-150 border-2 border-blue-300"
          :class="{'border-blue-500': player.id.startsWith('position-')}"
        >
          <div class="font-bold text-xl text-blue-800">{{ player.jerseyNumber }}</div>
          <div class="text-sm text-blue-600">{{ player.name }}</div>
        </div>
      </div>
      
      <!-- Second row -->
      <div class="grid grid-cols-3 gap-3">
        <div 
          v-for="player in displayablePlayers.slice(3, 6)" 
          :key="player.id" 
          @click="$emit('player-selected', player)"
          class="cursor-pointer bg-blue-100 hover:bg-blue-200 rounded-lg p-3 text-center transition-colors duration-150 border-2 border-blue-300"
          :class="{'border-blue-500': player.id.startsWith('position-')}"
        >
          <div class="font-bold text-xl text-blue-800">{{ player.jerseyNumber }}</div>
          <div class="text-sm text-blue-600">{{ player.name }}</div>
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
    // Create a computed property that ensures we always have 6 player slots
    // Use the actual players from the team roster, sorted by jersey number
    // If we have fewer than 6 players, fill remaining slots with empty players
    const displayablePlayers = computed(() => {
      // Sort players by jersey number
      const sortedPlayers = [...props.players].sort((a, b) => {
        const numA = parseInt(a.jerseyNumber) || 0;
        const numB = parseInt(b.jerseyNumber) || 0;
        return numA - numB;
      });
      
      // Make sure we have exactly 6 players (or placeholder objects)
      const result = [...sortedPlayers];
      
      // If we have fewer than 6 players, add placeholder players
      while (result.length < 6) {
        const position = result.length + 1;
        result.push({
          id: `placeholder-${position}`,
          name: `Position ${position}`,
          jerseyNumber: position.toString(),
          isPlaceholder: true
        });
      }
      
      // If we have more than 6 players, only use the first 6
      return result.slice(0, 6);
    });
    
    return {
      displayablePlayers
    };
  }
};
</script> 