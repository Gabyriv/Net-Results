<template>
  <div class="player-squares">
    <div v-if="loading" class="loading-indicator">
      <span class="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></span>
      <span class="ml-2">Loading players...</span>
    </div>
    
    <div v-else-if="error" class="error-message">
      {{ error }}
    </div>
    
    <div v-else-if="players.length === 0" class="empty-state">
      No players found for this team.
    </div>
    
    <div v-else class="grid grid-cols-3 gap-2">
      <button 
        v-for="player in players" 
        :key="player.id"
        @click="handlePlayerClick(player)"
        class="player-square w-14 h-14 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 flex flex-col items-center justify-center relative"
        :title="player.name"
      >
        <span class="jersey-number font-bold text-lg">{{ player.jerseyNumber }}</span>
        <span class="player-name text-xs">{{ player.name.split(' ')[0] }}</span>
      </button>
    </div>
  </div>
</template>

<script>
import { ref, watch, onMounted } from 'vue';
import { getTeamRoster } from '../services/teamService';

export default {
  name: 'PlayerSquares',
  props: {
    teamId: {
      type: [String, Number],
      required: true
    },
    teamName: {
      type: String,
      default: null
    }
  },
  emits: ['player-selected'],
  setup(props, { emit }) {
    const players = ref([]);
    const loading = ref(true);
    const error = ref(null);
    
    // Handle clicking a player square
    const handlePlayerClick = (player) => {
      emit('player-selected', player);
    };
    
    // Fetch the team roster
    const fetchRoster = async () => {
      loading.value = true;
      error.value = null;
      
      try {
        if (!props.teamId && !props.teamName) {
          throw new Error('Team ID or name is required to fetch roster');
        }
        
        const rosterData = await getTeamRoster(props.teamId || props.teamName);
        players.value = rosterData;
        console.log('Loaded players:', players.value.length);
      } catch (err) {
        console.error('Error loading team roster:', err);
        error.value = 'Failed to load team roster: ' + (err.message || 'Unknown error');
      } finally {
        loading.value = false;
      }
    };
    
    // Watch for team ID or name changes and refetch roster when either changes
    watch([() => props.teamId, () => props.teamName], ([newTeamId, newTeamName]) => {
      if (newTeamId || newTeamName) {
        fetchRoster();
      } else {
        players.value = [];
      }
    });
    
    // Fetch roster when component mounts
    onMounted(() => {
      if (props.teamId || props.teamName) {
        fetchRoster();
      }
    });
    
    return {
      players,
      loading,
      error,
      handlePlayerClick
    };
  }
};
</script>

<style scoped>
.player-squares {
  width: 100%;
}

.loading-indicator,
.error-message,
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 120px;
  width: 100%;
  color: #666;
  font-size: 0.9rem;
  text-align: center;
}

.error-message {
  color: #e53e3e;
  background-color: #fff5f5;
  border: 1px solid #fc8181;
  border-radius: 0.25rem;
  padding: 1rem;
}

.player-square {
  transition: all 0.2s ease;
}

.player-square:hover {
  transform: scale(1.05);
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.1);
}

.jersey-number {
  color: #2b6cb0;
  line-height: 1;
}

.player-name {
  color: #4a5568;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style> 