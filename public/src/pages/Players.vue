<template>
  <DefaultLayout>
    <div class="bg-blue-200 min-h-screen flex flex-col"> <!-- Added flex and flex-col for full height -->
      <div class="container mx-auto p-4 flex-grow"> <!-- Added flex-grow to make it take up remaining space -->
        <h1 class="text-3xl font-bold mb-4">Teams</h1>

        <!-- Error Message Section -->
        <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <strong class="font-bold">Error!</strong>
          <span class="block sm:inline">{{ error.message }}</span>
        </div>

        <!-- Loading indicator -->
        <LoadingSpinner v-if="loading" />

        <!-- Data display -->
        <div v-if="players.length" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div v-for="player in players.slice(0, 3)" :key="player.id" class="bg-white p-6 rounded-lg shadow-lg">
            <h2 class="text-xl font-bold mb-2">{{ player.name }}</h2>
            <p class="text-gray-700">Position: {{ player.position }}</p>
            <p class="text-gray-700">Team: {{ player.team }}</p>
          </div>
        </div>
      </div>
    </div>
  </DefaultLayout>
</template>

<script>
import { onMounted } from 'vue'
import { usePlayers } from '../composable/usePlayers'
import DefaultLayout from "../layouts/DefaultLayout.vue"
import LoadingSpinner from "../components/LoadingSpinner.vue"

export default {
  name: "Teams",
  components: { DefaultLayout, LoadingSpinner },
  setup() {
    const { players, error, loading, fetchPlayers } = usePlayers()
    onMounted(() => fetchPlayers())
    return { players, error, loading }
  },
}
</script>

<style scoped>
/* Add any component-specific styles here */
html, body {
  height: 100%;
  margin: 0;
}
</style>
