<template>
  <DashboardLayout>
    <div class="container mx-auto p-4">
      <h1 class="text-3xl font-bold mb-4">Matches</h1>

      <!-- Search Bar -->
      <div class="mb-4">
        <input
          type="text"
          v-model="searchQuery"
          placeholder="Search matches..."
          class="w-full p-2 border border-gray-300 rounded-lg"
        />
      </div>

      <!-- Loading indicator -->
      <LoadingSpinner v-if="loading" />

      <!-- Data display -->
      <div v-if="filteredMatches.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="match in filteredMatches" :key="match.id" class="bg-white p-6 rounded-lg shadow-lg">
          <h2 class="text-xl font-bold mb-2">{{ match.title }}</h2>
          <p class="text-gray-700">Date: {{ match.date }}</p>
          <p class="text-gray-700">Location: {{ match.location }}</p>
          <p class="text-gray-700">Teams: {{ match.teams }}</p>
        </div>
      </div>

      <!-- No matches found message -->
      <div v-else class="text-center text-gray-700">
        <p>No matches found.</p>
      </div>
    </div>
  </DashboardLayout>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'
import { useMatches } from '../composable/useMatches'

export default {
  name: 'Matches',
  components: {
    DashboardLayout,
    LoadingSpinner,
  },
  setup() {
    const { matches, loading, fetchMatches } = useMatches()
    const searchQuery = ref('')

    onMounted(() => fetchMatches())

    const filteredMatches = computed(() => {
      return matches.value.filter(match =>
        match.title.toLowerCase().includes(searchQuery.value.toLowerCase())
      )
    })

    return { matches, loading, searchQuery, filteredMatches }
  },
}
</script>

<style scoped>
/* Add any specific custom styles for your component */
</style>