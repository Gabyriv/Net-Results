<template>
  <div class="p-4 bg-white rounded-lg shadow-md">
    <h2 class="text-xl font-bold mb-4">Message from Backend:</h2>
    <p v-if="message" class="text-gray-700">{{ message }}</p>
    <p v-else class="text-gray-500">Loading message from backend...</p>
    <div v-if="error" class="mt-2 text-red-500">{{ error }}</div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'FetchApi',
  data() {
    return {
      message: '',
      error: null
    }
  },
  mounted() {
    this.fetchBackendMessage()
  },
  methods: {
    fetchBackendMessage() {
      console.log('Fetching data from backend...')
      axios.get('/api/routeConnections')
        .then(response => {
          console.log('Response:', response)
          this.message = response.data.message
        })
        .catch(error => {
          console.error('Error fetching data:', error)
          this.error = `Failed to fetch message: ${error.message}`
        })
    }
  }
}
</script>
