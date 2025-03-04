<template>
  <div class="p-6 bg-white rounded-lg shadow-lg">
    <h2 class="text-2xl font-bold mb-4">API Connection Test</h2>
    
    <div class="mb-6">
      <h3 class="text-lg font-semibold mb-2">Basic Connection:</h3>
      <div v-if="loading.basic" class="text-blue-500">Testing connection...</div>
      <div v-else-if="results.basic" class="p-3 bg-green-100 border border-green-300 rounded">
        <p class="text-green-700">✅ Connection successful!</p>
        <p class="text-sm text-gray-700 mt-1">{{ results.basic }}</p>
      </div>
      <div v-else-if="errors.basic" class="p-3 bg-red-100 border border-red-300 rounded">
        <p class="text-red-700">❌ Connection failed</p>
        <p class="text-sm text-red-600 mt-1">{{ errors.basic }}</p>
      </div>
      <button 
        @click="testBasicConnection" 
        class="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Test Connection
      </button>
    </div>
    
    <div class="mb-6">
      <h3 class="text-lg font-semibold mb-2">Authentication:</h3>
      <div v-if="loading.auth" class="text-blue-500">Testing authentication...</div>
      <div v-else-if="results.auth" class="p-3 bg-green-100 border border-green-300 rounded">
        <p class="text-green-700">✅ Authentication working!</p>
        <p class="text-sm text-gray-700 mt-1">{{ results.auth }}</p>
      </div>
      <div v-else-if="errors.auth" class="p-3 bg-red-100 border border-red-300 rounded">
        <p class="text-red-700">❌ Authentication failed</p>
        <p class="text-sm text-red-600 mt-1">{{ errors.auth }}</p>
      </div>
      <button 
        @click="testAuthentication" 
        class="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Test Authentication
      </button>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import { useAuth } from '../composable/useAuth'

export default {
  name: 'FetchData',
  setup() {
    const { isAuthenticated, user } = useAuth()
    
    return {
      isAuthenticated,
      user
    }
  },
  data() {
    return {
      loading: {
        basic: false,
        auth: false
      },
      results: {
        basic: null,
        auth: null
      },
      errors: {
        basic: null,
        auth: null
      }
    }
  },
  methods: {
    async testBasicConnection() {
      this.loading.basic = true
      this.results.basic = null
      this.errors.basic = null
      
      try {
        const response = await axios.get('/api/route-connections')
        this.results.basic = `Message: ${response.data.message}, Status: ${response.data.status}, Time: ${response.data.timestamp}`
      } catch (error) {
        console.error('Connection test failed:', error)
        this.errors.basic = error.message
      } finally {
        this.loading.basic = false
      }
    },
    
    async testAuthentication() {
      this.loading.auth = true
      this.results.auth = null
      this.errors.auth = null
      
      try {
        if (!this.isAuthenticated) {
          throw new Error('You need to log in first to test authentication')
        }
        
        const response = await axios.get('/api/auth/validate', {
          headers: {
            'Authorization': `Bearer ${this.user.token}`
          }
        })
        
        this.results.auth = `User authenticated as: ${response.data.email}`
      } catch (error) {
        console.error('Authentication test failed:', error)
        this.errors.auth = error.response?.data?.error || error.message
      } finally {
        this.loading.auth = false
      }
    }
  }
}
</script>

<style scoped>
.error-message {
  color: red;
  margin-top: 10px;
}
</style>