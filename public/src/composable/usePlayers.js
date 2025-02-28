import { ref } from 'vue'
import axios from 'axios'

export function usePlayers() {
  const players = ref([])
  const error = ref(null)
  const loading = ref(false)

  const fetchPlayers = async () => {
    loading.value = true
    try {
      const response = await axios.get('/api/players')
      players.value = response.data
    } catch (err) {
      error.value = err
    } finally {
      loading.value = false
    }
  }

  return { players, error, loading, fetchPlayers }
}