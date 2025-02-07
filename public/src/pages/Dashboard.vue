<template>
    <div class="container mx-auto p-4">
      <h1 class="text-3xl font-bold mb-4">Dashboard</h1>
      <!-- You can import and use your components like StatCard, MatchTable, etc. -->
      <StatCard title="Total Matches" :value="totalMatches" />
    </div>
</template>

<script>
import { useMainStore } from '../store/index'
import StatCard from '../components/StatCard.vue'
import DashboardLayout from '../layouts/DashboardLayout.vue'

export default {
    name: 'Dashboard',
    components: { StatCard },
    setup() {
      const store = useMainStore() 
      // For example, calculate total matches
      const totalMatches = computed(() => store.matches.length) 
  
      return { totalMatches }
    },
    data() {
     return {
      totalMatches: 30,
      totalPlayers: 20, // Example data
      totalWins: 15
  };
 }
}
</script>
  