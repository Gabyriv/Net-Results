<template>
  <div>
    <router-view v-slot="{ Component }">
      <transition 
        name="fade" 
        mode="out-in"
        @before-leave="beforeLeave"
        @enter="enter"
      >
        <keep-alive>
          <div>
            <component :is="Component" v-if="authInitialized" />
            <div v-else class="loading-indicator">
              <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              <p class="mt-4 text-gray-600">Loading application...</p>
            </div>
          </div>
        </keep-alive>
      </transition>
    </router-view>
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
    
    // Transition methods
    const beforeLeave = (el) => {
      // Ensure the scroll position is reset when navigating
      window.scrollTo(0, 0)
    }
    
    const enter = (el, done) => {
      // Force a repaint to make the transition smoother
      el.offsetHeight
      done()
    }
    
    return {
      authInitialized,
      isAuthenticated,
      user,
      beforeLeave,
      enter
    }
  }
}
</script>

<style>
/* Transition styles */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Ensure content doesn't jump during transitions */
html {
  scroll-behavior: smooth;
}

/* Prevent FOUC (Flash of Unstyled Content) */
.router-link-active {
  font-weight: bold;
}

/* Loading indicator styles */
.loading-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}
</style>
