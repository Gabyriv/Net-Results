import { createRouter, createWebHistory } from 'vue-router'
import Home from '../pages/Home.vue'
import Dashboard from '../pages/Dashboard.vue'
import Players from '../pages/Players.vue'
import Matches from '../pages/Matches.vue'
import Statistics from '../pages/Statistics.vue'
import Login from '../pages/Login.vue'
import Register from '../pages/Register.vue'
import FetchApi from '../components/FetchApi.vue'

const routes = [
  { path: '/' , redirect: '/home' },
  { 
    path: '/dashboard', 
    name: 'Dashboard', 
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  { 
    path: '/players', 
    name: 'Players', 
    component: Players,
    meta: { requiresAuth: true }
  },
  { 
    path: '/matches', 
    name: 'Matches', 
    component: Matches,
    meta: { requiresAuth: true }
  },
  { 
    path: '/statistics', 
    name: 'Statistics', 
    component: Statistics,
    meta: { requiresAuth: true }
  },
  { path: '/login', name: 'Login', component: Login },
  { path: '/register', name: 'Register', component: Register },
  { path: '/home', name: 'Home', component: Home },
  { path: '/api-test', name: 'ApiTest', component: FetchApi },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Import the useAuth composable
import { useAuth } from '../composable/useAuth'

// Navigation guard for protected routes
router.beforeEach(async (to, from, next) => {
  console.log(`Router guard: Navigating from ${from.path} to ${to.path}`)
  
  // Check if the route requires authentication
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  console.log(`Route requires auth: ${requiresAuth}`)
  
  if (!requiresAuth) {
    console.log('Route does not require authentication, proceeding')
    return next()
  }
  
  // Get auth functions
  const { validateToken } = useAuth()
  
  // Get user data from localStorage
  console.log('Checking authentication status')
  const userStr = localStorage.getItem('user')
  let isAuthenticated = false
  let userData = null
  
  // Parse user data if it exists
  if (!userStr) {
    console.log('No user data found in localStorage')
  } else {
    try {
      userData = JSON.parse(userStr)
      console.log('User data parsed from localStorage')
      
      // Basic validation - check if token exists
      if (!userData || !userData.token) {
        console.log('Invalid user data: missing token')
      } else {
        // Check if token is expired (if it has an expiration time)
        if (userData.expiresAt) {
          const now = new Date().getTime()
          const expiresAt = new Date(userData.expiresAt).getTime()
          
          if (now > expiresAt) {
            console.log('Token expired, authentication failed')
          } else {
            console.log('Token not expired, validating with backend')
            
            // Validate token with backend
            try {
              const isValid = await validateToken(userData.token)
              console.log('Token validation result:', isValid)
              isAuthenticated = isValid
            } catch (error) {
              console.error('Token validation error:', error)
              // If we can't validate the token, we'll assume it's invalid
              isAuthenticated = false
            }
          }
        } else {
          // No expiration time, validate with backend
          console.log('No expiration time for token, validating with backend')
          try {
            const isValid = await validateToken(userData.token)
            console.log('Token validation result:', isValid)
            isAuthenticated = isValid
          } catch (error) {
            console.error('Token validation error:', error)
            // If we can't validate the token, we'll assume it's invalid
            isAuthenticated = false
          }
        }
      }
    } catch (error) {
      console.error('Failed to parse user data from localStorage:', error)
      localStorage.removeItem('user')
    }
  }
  
  console.log(`Route guard decision: path=${to.path}, requiresAuth=${requiresAuth}, isAuthenticated=${isAuthenticated}`)
  
  if (requiresAuth && !isAuthenticated) {
    // If route requires auth and user is not authenticated, redirect to login
    console.log('Authentication required but not authenticated, redirecting to login')
    // Clear any stale user data
    localStorage.removeItem('user')
    // Redirect to login with the intended destination
    next({ 
      path: '/login', 
      query: { redirect: to.fullPath },
      // Use replace to avoid filling browser history with redirects
      replace: true 
    })
  } else if ((to.path === '/login' || to.path === '/register') && isAuthenticated) {
    // If user is already authenticated and tries to access login/register, redirect to dashboard
    console.log('Already authenticated, redirecting to dashboard')
    next({ path: '/dashboard', replace: true })
  } else {
    // Otherwise proceed as normal
    console.log('Proceeding to requested route')
    next()
  }
})

export default router
