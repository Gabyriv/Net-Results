<template>
  <div>
    <router-view></router-view> <!-- This will render the current route component -->
  </div>
</template>

<script>
import { onMounted, ref } from 'vue'
import { useAuth } from './composable/useAuth'

export default {
  name: 'App',
  setup() {
    const { initAuth, isAuthenticated, user } = useAuth()
    const authInitialized = ref(false)
    
    onMounted(async () => {
      console.log('App mounted, initializing authentication state')
      try {
        // Initialize authentication state on app mount
        await initAuth()
        authInitialized.value = true
        console.log('Authentication initialized successfully')
        console.log('Auth state:', { isAuthenticated: isAuthenticated.value, user: user.value })
      } catch (error) {
        console.error('Error initializing authentication:', error)
      }
    })
    
    return {
      authInitialized,
      isAuthenticated,
      user
    }
  }
}
</script>

<style>
/* Global styles can also go here, though Tailwind is imported via tailwind.css */
</style>
