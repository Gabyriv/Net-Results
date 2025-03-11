<template>
  <div class="popup-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="result-popup bg-white rounded-lg p-6 w-full max-w-md mx-4">
      <div class="popup-header flex justify-between items-center mb-4">
        <h3 class="text-lg font-bold">Select Result for {{ action }}</h3>
        <button class="close-btn text-gray-500 hover:text-gray-700" @click="onClose">
          <span class="material-icons">close</span>
        </button>
      </div>
      
      <div class="result-buttons flex justify-center space-x-4">
        <button 
          @click="onResultSelect('+')"
          class="result-btn py-4 px-6 rounded-lg bg-green-100 hover:bg-green-200 text-green-700 font-bold text-xl flex flex-col items-center"
        >
          <span class="material-icons mb-1">thumb_up</span>
          <span class="text-xs">Point</span>
        </button>
        <button 
          @click="onResultSelect('=')"
          class="result-btn py-4 px-6 rounded-lg bg-yellow-100 hover:bg-yellow-200 text-yellow-700 font-bold text-xl flex flex-col items-center"
        >
          <span class="material-icons mb-1">thumbs_up_down</span>
          <span class="text-xs">Good</span>
        </button>
        <button 
          @click="onResultSelect('-')"
          class="result-btn py-4 px-6 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 font-bold text-xl flex flex-col items-center"
        >
          <span class="material-icons mb-1">thumb_down</span>
          <span class="text-xs">Error</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ResultPopup',
  props: {
    action: {
      type: String,
      required: true
    },
    onResultSelect: {
      type: Function,
      required: true
    },
    onClose: {
      type: Function,
      required: true
    }
  }
};
</script>

<style scoped>
.popup-overlay {
  z-index: 1000;
}

.result-popup {
  max-height: 90vh;
  overflow-y: auto;
}

.result-btn {
  transition: all 0.2s ease;
}

.result-btn:hover {
  transform: translateY(-2px);
}
</style> 