<template>
  <DashboardLayout>
    <div class="container mx-auto p-4">
      <h1 class="text-3xl font-bold mb-4">Game Tracking</h1>
      <GameTracker />
      
      <div class="mt-8">
        <h2 class="text-2xl font-bold mb-4">Recent Games</h2>
        <div v-if="isLoading" class="text-center py-4">
          Loading games...
        </div>
        <div v-else-if="games.length === 0" class="text-center py-4">
          No games found.
        </div>
        <div v-else class="bg-white rounded-lg shadow-lg overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Game</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="game in games" :key="game.id">
                <td class="px-6 py-4 whitespace-nowrap">{{ game.game }}</td>
                <td class="px-6 py-4 whitespace-nowrap">{{ formatDate(game.created_at) }}</td>
                <td class="px-6 py-4 whitespace-nowrap">{{ game.myPts }} - {{ game.oppPts }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span 
                    :class="game.myPts > game.oppPts ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'" 
                    class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                  >
                    {{ game.myPts > game.oppPts ? 'Win' : 'Loss' }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script>
import { ref, onMounted } from 'vue';
import DashboardLayout from '../layouts/DashboardLayout.vue';
import GameTracker from '../components/GameTracker.vue';
import { gameService } from '../services/gameService';

export default {
  name: 'GameTrackingPage',
  components: {
    DashboardLayout,
    GameTracker
  },
  setup() {
    const games = ref([]);
    const isLoading = ref(true);

    const fetchGames = async () => {
      isLoading.value = true;
      try {
        games.value = await gameService.getAllGames();
      } catch (error) {
        console.error('Error fetching games:', error);
      } finally {
        isLoading.value = false;
      }
    };

    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    };

    onMounted(() => {
      fetchGames();
    });

    return {
      games,
      isLoading,
      formatDate
    };
  }
};
</script> 