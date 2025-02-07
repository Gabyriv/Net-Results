import { usePlayerStore } from '../store/playerStore'

export default {
  setup() {
    const playerStore = usePlayerStore()
    // Now you can use playerStore.players, playerStore.setPlayers, etc.
    return { playerStore }
  },
}

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
