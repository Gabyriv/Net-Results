<template>
    <div>
      <LoadingSpinner v-if="loading" />
      <div v-else>
        <!-- Your data -->
      </div>
    </div>
  </template>
  
  <script>
  import LoadingSpinner from '../components/LoadingSpinner.vue'
  export default {
    components: { LoadingSpinner },
    setup() {
      // your logic for loading data
    }
  }
  </script>
  