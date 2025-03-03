<template>
  <div>
    <LoadingSpinner v-if="loading" />
    <div v-else>
      <!-- Your data -->
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import { usePlayerStore } from '../store/playerStore';
import LoadingSpinner from '../components/LoadingSpinner.vue';

export default {
  components: { LoadingSpinner },
  setup() {
    const playerStore = usePlayerStore();
    const loading = ref(true);

    // Simulate loading data
    setTimeout(() => {
      loading.value = false;
    }, 2000);

    return { playerStore, loading };
  }
};
</script>
