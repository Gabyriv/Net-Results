<template>
  <div class="bg-white rounded-lg shadow-md p-4">
    <h2 class="text-xl font-bold mb-4">Record Player Stats</h2>
    
    <div v-if="errorMessage" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      {{ errorMessage }}
    </div>
    
    <div v-if="successMessage" class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
      {{ successMessage }}
    </div>
    
    <form @submit.prevent="submitStat" class="space-y-4">
      <!-- Player Selection -->
      <div>
        <label class="block text-sm font-medium text-gray-700">Player</label>
        <select 
          v-model="selectedPlayerId" 
          required
          class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option disabled value="">Select a player</option>
          <option v-for="player in players" :key="player.id" :value="player.id">
            {{ player.displayName }}
          </option>
        </select>
      </div>
      
      <!-- Stat Type Selection -->
      <div>
        <label class="block text-sm font-medium text-gray-700">Stat Type</label>
        <select 
          v-model="selectedStatType" 
          required
          class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option disabled value="">Select a stat type</option>
          <option v-for="statType in statTypes" :key="statType" :value="statType">
            {{ formatStatType(statType) }}
          </option>
        </select>
      </div>
      
      <!-- Value Input -->
      <div>
        <label class="block text-sm font-medium text-gray-700">Value</label>
        <input 
          v-model.number="statValue" 
          type="number" 
          min="0"
          step="1"
          required
          class="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        />
      </div>
      
      <!-- Submit Button -->
      <div>
        <button 
          type="submit" 
          :disabled="isSubmitting"
          class="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {{ isSubmitting ? 'Submitting...' : 'Submit Stat' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script>
export default {
  name: 'PlayerStatForm',
  props: {
    gameId: {
      type: [String, Number],
      required: true
    },
    players: {
      type: Array,
      required: true
    },
    // Flag to indicate if stats can be submitted (e.g., game is not active)
    canSubmitStats: {
      type: Boolean,
      default: true
    }
  },
  data() {
    return {
      selectedPlayerId: '',
      selectedStatType: '',
      statValue: 0,
      isSubmitting: false,
      errorMessage: '',
      successMessage: '',
      // Define available stat types
      statTypes: ['SERVE', 'PASS', 'SET', 'ATTACK', 'BLOCK', 'DIG']
    }
  },
  computed: {
    // Get the API endpoint URL
    apiUrl() {
      return `/api/games/${this.gameId}/player-stats`;
    }
  },
  methods: {
    formatStatType(statType) {
      // Convert SNAKE_CASE to Title Case (e.g., HITTING -> Hitting)
      return statType.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    },
    async submitStat() {
      // Clear previous messages
      this.errorMessage = '';
      this.successMessage = '';
      
      // Check if stats submission is allowed
      if (!this.canSubmitStats) {
        this.errorMessage = 'Stats cannot be submitted for this game';
        return;
      }
      
      this.isSubmitting = true;
      
      try {
        // Submit the stat to the API
        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            playerId: this.selectedPlayerId,
            statType: this.selectedStatType,
            value: this.statValue
          })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to submit stat');
        }
        
        // Success
        this.successMessage = `Successfully recorded ${this.formatStatType(this.selectedStatType)} stat for selected player`;
        this.resetForm();
        
        // Emit event to notify parent component
        this.$emit('stat-submitted', data.data);
      } catch (error) {
        this.errorMessage = error.message;
        console.error('Error submitting player stat:', error);
      } finally {
        this.isSubmitting = false;
      }
    },
    resetForm() {
      // Keep the selected player but reset other fields
      this.selectedStatType = '';
      this.statValue = 0;
    }
  }
}
</script> 