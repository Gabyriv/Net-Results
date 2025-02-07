<template>
  <div class="bg-white shadow rounded p-4">
    <h2 class="text-xl font-semibold">{{ title }}</h2>
    <p class="text-3xl">{{ value }}</p>

    <!-- Loading Spinner and Data -->
    <LoadingSpinner v-if="loading" />
    <div v-else>
      <!-- Your data (replace with actual content) -->
      <div>
        <!-- Your content goes here when not loading -->
      </div>
    </div>
  </div>
</template>

<script>
import LoadingSpinner from '../components/LoadingSpinner.vue';

export default {
  name: 'StatCard',
  props: {
    title: {
      type: String,
      required: true,
    },
    value: {
      type: [Number, String],
      required: true,
    },
  },
  components: { LoadingSpinner },
  setup() {
    const loading = ref(true);  // Example loading state
    // You can update the loading state based on your data fetching logic
    return { loading };
  }
}
</script>

<style scoped>
/* Component-specific styles (if needed) */
</style>
