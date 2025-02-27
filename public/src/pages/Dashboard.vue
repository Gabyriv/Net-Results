<template>
  <DashboardLayout>
    <div class="container mx-auto p-4">
      <h1 class="text-3xl font-bold mb-4">Dashboard</h1>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard title="Total Matches" :value="totalMatches" icon="mdi-soccer" />
        <StatCard title="Total Players" :value="totalPlayers" icon="mdi-account-group" />
        <StatCard title="Total Wins" :value="totalWins" icon="mdi-trophy" />
      </div>
      <div class="bg-white p-6 rounded-lg shadow-lg">
        <h2 class="text-2xl font-bold mb-4">Performance Overview</h2>
        <LineChart :data="chartData" />
      </div>
    </div>
  </DashboardLayout>
</template>

<script>
import { computed } from 'vue'
import { useMainStore } from '../store/index'
import StatCard from '../components/StatCard.vue'
import DashboardLayout from '../layouts/DashboardLayout.vue'
import LineChart from '../components/LineChart.vue'

export default {
  name: 'Dashboard',
  components: { StatCard, DashboardLayout, LineChart },
  setup() {
    const store = useMainStore()
    const totalMatches = computed(() => store.matches.length)
    const totalPlayers = computed(() => store.players.length)
    const totalWins = computed(() => store.wins.length)

    const chartData = computed(() => {
      return {
        labels: store.matches.map(match => match.date),
        datasets: [
          {
            label: 'Wins',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            data: store.matches.map(match => match.wins),
          },
          {
            label: 'Losses',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            borderColor: 'rgba(255, 99, 132, 1)',
            data: store.matches.map(match => match.losses),
          },
        ],
      }
    })

    return { totalMatches, totalPlayers, totalWins, chartData }
  },
}
</script>

<style scoped>
/* Add any component-specific styles here */
</style>
