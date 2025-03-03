import { ref } from 'vue'

export function useMatches() {
  const matches = ref([])
  const loading = ref(false)

  const fetchMatches = async () => {
    loading.value = true
    try {
      // Replace with your API call
      const response = await fetch('/api/matches')
      matches.value = await response.json()
    } catch (error) {
      console.error('Failed to fetch matches:', error)
    } finally {
      loading.value = false
    }
  }

  return { matches, loading, fetchMatches }
}