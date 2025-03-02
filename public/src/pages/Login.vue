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
      <div v-if="errorMessage && errorMessage.length > 0" class="mt-6 text-red-500 text-center">
        {{ errorMessage }}
      </div>
      <div v-if="loading" class="mt-6 text-blue-500 text-center">
        Processing your request...
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
import { ref, onMounted, computed } from 'vue'
import { useAuth } from '../composable/useAuth'
import { useRoute, useRouter } from 'vue-router'

export default {
  name: 'Login',
  setup() {
    const email = ref('')
    const password = ref('')
    const localError = ref('')
    const route = useRoute()
    const router = useRouter()
    
    // Use the auth composable
    const { login: authLogin, authError, loading, isAuthenticated } = useAuth()

    // Check if we have a redirect URL from the route query
    onMounted(() => {
      console.log('Login component mounted')
      if (isAuthenticated.value) {
        console.log('User is already authenticated, redirecting to dashboard')
        router.push('/dashboard')
      }
    })

    const login = async () => {
      localError.value = ''
      
      if (!email.value || !password.value) {
        localError.value = 'Please enter both email and password'
        return
      }
      
      console.log('Login.vue: Attempting to log in with:', email.value)
      
      try {
        const result = await authLogin({
          email: email.value,
          password: password.value
        })
        
        console.log('Login.vue: Login result:', result)
        
        if (result.success) {
          console.log('Login.vue: Login successful, checking for redirect')
          // Check if we need to redirect to a specific page
          const redirectPath = route.query.redirect || '/dashboard'
          console.log('Login.vue: Redirecting to:', redirectPath)
          router.push(redirectPath)
        } else {
          console.error('Login.vue: Login failed:', result.error)
          localError.value = result.error || 'Login failed. Please try again.'
        }
      } catch (error) {
        console.error('Login.vue: Exception during login:', error)
        localError.value = 'An unexpected error occurred. Please try again.'
      }
    }

    return {
      email,
      password,
      errorMessage: computed(() => localError.value || authError.value),
      loading,
      login,
    }
  },
}
</script>

<style scoped>
/* You can add component-specific styles here if needed */
</style>
