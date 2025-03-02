<template>
  <div class="min-h-screen flex items-center justify-center bg-blue-200">
    <div class="max-w-lg w-full bg-white p-12 rounded-lg shadow-2xl">
      <h2 class="text-5xl font-bold mb-15 text-center">Register</h2>
      <form @submit.prevent="register">
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
        <div class="mb-6">
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
        <div class="mb-8">
          <label class="block text-gray-700" for="confirmPassword">Confirm Password</label>
          <input
            v-model="confirmPassword"
            type="password"
            id="confirmPassword"
            class="mt-1 block w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-blue-500"
            placeholder="Confirm your password"
            required
          />
        </div>
        <button type="submit" class="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white py-3 rounded-lg hover:from-blue-600 hover:to-blue-800 transition duration-300">
          Register
        </button>
      </form>
      <div v-if="errorMessage" class="mt-6 text-red-500 text-center">
        {{ errorMessage }}
      </div>
      <div class="mt-6 text-center">
        <router-link to="/login" class="text-blue-600 hover:underline">Already have an account? Login</router-link>
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
  name: 'Register',
  setup() {
    const email = ref('')
    const password = ref('')
    const confirmPassword = ref('')
    const errorMessage = ref('')

    const register = async () => {
      try {
        if (!email.value || !password.value || !confirmPassword.value) {
          errorMessage.value = 'Please fill in all fields.'
          return
        }
        if (password.value !== confirmPassword.value) {
          errorMessage.value = 'Passwords do not match.'
          return
        }
        console.log('Registering with', email.value, password.value)
        // Example: await axios.post('/api/register', { email: email.value, password: password.value })
        // On success, redirect the user or update your auth state.
      } catch (error) {
        errorMessage.value = 'Registration failed. Please try again.'
      }
    }

    return {
      email,
      password,
      confirmPassword,
      errorMessage,
      register,
    }
  },
}
</script>

<style scoped>
/* You can add component-specific styles here if needed */
</style>
