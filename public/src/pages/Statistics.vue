<template>
  <DashboardLayout>
    <div class="container mx-auto p-4">
      <h1 class="text-3xl font-bold mb-4">Statistics</h1>
      <!-- Add your statistics content here -->
      <div>
        <p>Statistics will be displayed here.</p>
      </div>
    </div>
  </DashboardLayout>
</template>

<script>
import DashboardLayout from '../layouts/DashboardLayout.vue'

export default {
  name: 'Statistics',
  components: {
    DashboardLayout,
  },
}
</script>

<style scoped>
/* Add any specific custom styles for your component */
</style>