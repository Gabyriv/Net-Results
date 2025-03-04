<template>
  <div class="min-h-screen flex items-center justify-center bg-blue-200">
    <div class="max-w-lg w-full bg-white p-12 rounded-lg shadow-2xl">
      <h2 class="text-5xl font-bold mb-15 text-center">Register</h2>
      
      <!-- Success message -->
      <div v-if="registrationSuccess" class="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
        <p class="text-center font-semibold">Registration successful!</p>
        <p class="text-center text-sm mt-2">Redirecting you to login page...</p>
      </div>
      
      <form @submit.prevent="register" v-if="!registrationSuccess">
        <div class="mb-6">
          <label class="block text-gray-700" for="displayName">Name</label>
          <input
            v-model="displayName"
            type="text"
            id="displayName"
            class="mt-1 block w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-blue-500"
            placeholder="Enter your display name"
          />
        </div>
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
        <div class="mb-6">
          <label class="block text-gray-700 mb-2">Role</label>
          <div class="flex space-x-4">
            <label class="inline-flex items-center">
              <input 
                type="radio" 
                v-model="role" 
                value="Player" 
                class="form-radio h-5 w-5 text-blue-600"
              />
              <span class="ml-2 text-gray-700">Player</span>
            </label>
            <label class="inline-flex items-center">
              <input 
                type="radio" 
                v-model="role" 
                value="Manager" 
                class="form-radio h-5 w-5 text-blue-600"
                checked
              />
              <span class="ml-2 text-gray-700">Manager</span>
            </label>
          </div>
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
import { useRouter } from 'vue-router'

export default {
  name: 'Register',
  setup() {
    const email = ref('')
    const password = ref('')
    const confirmPassword = ref('')
    const displayName = ref('')
    const role = ref('Manager') // Default to Manager instead of Player
    const localError = ref('')
    const router = useRouter()
    const registrationSuccess = ref(false)

    // Use the auth composable
    const { register: authRegister, authError, loading } = useAuth()

    const register = async () => {
      // Clear any previous errors
      localError.value = ''
      registrationSuccess.value = false

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
      const result = await authRegister({
        email: email.value,
        password: password.value,
        displayName: displayName.value || email.value.split('@')[0],
        role: role.value
      })
      
      if (result && result.success) {
        console.log('Registration successful!')
        registrationSuccess.value = true
        
        // The useAuth composable should handle the auto-login and redirection
        // But we'll add a fallback redirection here in case it doesn't
        setTimeout(() => {
          if (registrationSuccess.value) {
            console.log('Redirecting to login page...')
            router.push('/login')
          }
        }, 2000)
      } else {
        console.error('Registration failed:', result?.error)
        localError.value = result?.error || 'Registration failed. Please try again.'
      }
    }

    return {
      email,
      password,
      confirmPassword,
      displayName,
      role,
      errorMessage: computed(() => localError.value || authError.value),
      loading,
      register,
      registrationSuccess
    }
  },
}
</script>

<style scoped>
/* You can add component-specific styles here if needed */
</style>
