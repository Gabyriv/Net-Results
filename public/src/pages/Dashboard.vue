<template>
  <DashboardLayout>
    <div class="container mx-auto p-4">
      <h1 class="text-3xl font-bold mb-4">Dashboard</h1>
      <!-- You can import and use your components like StatCard, MatchTable, etc. -->
      <StatCard title="Total Matches" :value="totalMatches" />
      <StatCard title="Total Players" :value="totalPlayers" />
      <StatCard title="Total Wins" :value="totalWins" />
    </div>
  </DashboardLayout>
</template>

<script>
import { computed } from 'vue'
import { useMainStore } from '../store/index'
import StatCard from '../components/StatCard.vue'
import DashboardLayout from '../layouts/DashboardLayout.vue'

export default {
  name: 'Dashboard',
  components: { StatCard, DashboardLayout },
  setup() {
    const store = useMainStore()
    // For example, calculate total matches
    const totalMatches = computed(() => store.matches.length)
    const totalPlayers = computed(() => store.players.length)
    const totalWins = computed(() => store.wins.length)

    return { totalMatches, totalPlayers, totalWins }
  },
}
</script>

<style scoped>
/* Add any component-specific styles here */
</style>
