import { ref } from 'vue'
import axios from 'axios'

export function useMatches() {
  const matches = ref([])
  const loading = ref(false)

  const fetchMatches = async () => {
    loading.value = true
    try {
      const response = await axios.get('/matches')
      matches.value = response.data
    } catch (error) {
      console.error('Failed to fetch matches:', error)
    } finally {
      loading.value = false
    }
  }

  return { matches, loading, fetchMatches }
}