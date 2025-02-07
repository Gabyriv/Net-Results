<template>
  <DefaultLayout>
    <div class="container mx-auto p-4">
      <h1 class="text-3xl font-bold mb-4">Players</h1>

      <!-- Error Message Section -->
      <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
        <strong class="font-bold">Error!</strong>
        <span class="block sm:inline">{{ error.message }}</span>
      </div>

      <!-- Loading indicator -->
      <LoadingSpinner v-if="loading" />

      <!-- Data display -->
      <ul v-if="players.length">
        <li v-for="player in players" :key="player.id">{{ player.name }}</li>
      </ul>
    </div>
  </DefaultLayout>
</template>

<script>
import { onMounted } from 'vue'
import { usePlayers } from '../composable/usePlayers'
import DefaultLayout from "../layouts/DefaultLayout.vue"
import LoadingSpinner from "../components/LoadingSpinner.vue"

export default {
  name: "Players",
  components: { DefaultLayout, LoadingSpinner },
  setup() {
    const { players, error, loading, fetchPlayers } = usePlayers()
    onMounted(() => fetchPlayers())
    return { players, error, loading }
  },
}
</script>
