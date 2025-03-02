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
        <div class="mb-6">
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
        <div class="mb-8">
          <label class="block text-gray-700" for="displayName">Display Name</label>
          <input
            v-model="displayName"
            type="text"
            id="displayName"
            class="mt-1 block w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-blue-500"
            placeholder="Enter your display name (optional)"
          />
        </div>
        <button 
          type="submit" 
          class="w-full bg-gradient-to-r from-blue-500 to-blue-700 text-white py-3 rounded-lg hover:from-blue-600 hover:to-blue-800 transition duration-300"
          :disabled="loading"
        >
          <span v-if="loading">Registering...</span>
          <span v-else>Register</span>
        </button>
      </form>
      <div v-if="errorMessage && errorMessage.length > 0" class="mt-6 text-red-500 text-center">
        {{ errorMessage }}
      </div>
      <div v-if="loading" class="mt-6 text-blue-500 text-center">
        Processing your request...
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
import { ref, computed } from 'vue'
import { useAuth } from '../composable/useAuth'

export default {
  name: 'Register',
  setup() {
    const email = ref('')
    const password = ref('')
    const confirmPassword = ref('')
    const displayName = ref('')
    const localError = ref('')

    // Use the auth composable
    const { register: authRegister, authError, loading } = useAuth()

    const register = async () => {
      // Clear any previous errors
      localError.value = ''

      // Validate form
      if (!email.value || !password.value || !confirmPassword.value) {
        localError.value = 'Please fill in all fields.'
        return
      }
      if (password.value !== confirmPassword.value) {
        localError.value = 'Passwords do not match.'
        return
      }

      // If validation passes, register the user
      await authRegister({
        email: email.value,
        password: password.value,
        displayName: displayName.value || email.value.split('@')[0],
        role: 'Player' // Default role
      })
    }

    return {
      email,
      password,
      confirmPassword,
      displayName,
      errorMessage: computed(() => localError.value || authError.value),
      loading,
      register,
    }
  },
}
</script>

<style scoped>
/* You can add component-specific styles here if needed */
</style>
