<template>
  <div class="min-h-screen flex items-center justify-center bg-blue-200">
    <div class="max-w-lg w-full bg-white p-12 rounded-lg shadow-2xl"> 
      <h2 class="text-5xl font-bold mb-15 text-center">Login</h2>
      <form @submit.prevent="login">
        <div class="mb-6">
          <label class="block text-gray-700" for="email">Email</label>
          <input
            v-model="email"
            type="email"
            id="email"
            class="mt-1 block w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-blue-500"
            placeholder="Enter your email"
            required
          />
        </div>
        <div class="mb-8">
          <label class="block text-gray-700" for="password">Password</label>
          <input
            v-model="password"
            type="password"
            id="password"
            class="mt-1 block w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-blue-500"
            placeholder="Enter your password"
            required
          />
        </div>
        <button type="submit" class="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white py-3 rounded-lg hover:from-blue-600 hover:to-blue-800 transition duration-300">
          Login
        </button>
      </form>
      <div v-if="errorMessage" class="mt-6 text-red-500 text-center">
        {{ errorMessage }}
      </div>
      <div class="mt-6 text-center">
        <router-link to="/register" class="text-blue-600 hover:underline">Don't have an account? Register</router-link>
      </div>
      <div class="mt-6 text-center">
        <router-link to="/home" class="text-blue-600 hover:underline">Back</router-link>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'

export default {
  name: 'Login',
  setup() {
    const email = ref('')
    const password = ref('')
    const errorMessage = ref('')

    const login = async () => {
      try {
        if (!email.value || !password.value) {
          errorMessage.value = 'Please fill in all fields.'
          return
        }
        console.log('Logging in with', email.value, password.value)
        // Example: await axios.post('/api/login', { email: email.value, password: password.value })
        // On success, redirect the user or update your auth state.
      } catch (error) {
        errorMessage.value = 'Login failed. Please check your credentials and try again.'
      }
    }

    return {
      email,
      password,
      errorMessage,
      login,
    }
  },
}
</script>

<style scoped>
/* You can add component-specific styles here if needed */
</style>
