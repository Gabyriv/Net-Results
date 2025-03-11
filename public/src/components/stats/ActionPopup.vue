<template>
  <div class="popup-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="action-popup bg-white rounded-lg p-6 w-full max-w-md mx-4">
      <div class="popup-header flex justify-between items-center mb-4">
        <h3 class="text-lg font-bold">
          Select Action for 
          <span v-if="player">
            #{{ player.jerseyNumber }} {{ player.name }}
          </span>
          <span v-else>
            Player
          </span>
        </h3>
        <button class="close-btn text-gray-500 hover:text-gray-700" @click="onClose">
          <span class="material-icons">close</span>
        </button>
      </div>
      
      <div class="action-buttons grid grid-cols-2 gap-3">
        <button 
          v-for="action in actions" 
          :key="action" 
          class="action-btn py-3 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-center"
          @click="onActionSelect(action)"
        >
          {{ action }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ActionPopup',
  props: {
    player: {
      type: Object,
      required: true
    },
    onActionSelect: {
      type: Function,
      required: true
    },
    onClose: {
      type: Function,
      required: true
    }
  },
  setup() {
    const actions = [
      'Serve', 'Pass', 'Set', 'Attack', 'Block', 'Dig'
    ];
    
    return {
      actions
    };
  }
};
</script>

<style scoped>
.popup-overlay {
  z-index: 1000;
}

.action-popup {
  max-height: 90vh;
  overflow-y: auto;
}

.action-btn {
  transition: all 0.2s ease;
}

.action-btn:hover {
  transform: translateY(-2px);
}
</style> 