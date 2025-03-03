import { createRouter, createWebHistory } from 'vue-router'

// Use dynamic imports for route-level code splitting
const Home = () => import('../pages/Home.vue')
const Dashboard = () => import('../pages/Dashboard.vue')
const Players = () => import('../pages/Players.vue')
const Teams = () => import('../pages/Teams.vue')
const Matches = () => import('../pages/Matches.vue')
const Statistics = () => import('../pages/Statistics.vue')
const Login = () => import('../pages/Login.vue')
const Register = () => import('../pages/Register.vue')
const FetchApi = () => import('../components/FetchApi.vue')
const FetchData = () => import('../components/FetchData.vue')

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
    path: '/teams', 
    name: 'Teams', 
    component: Teams,
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
  { path: '/api-connection', name: 'ApiConnection', component: FetchData },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  // Add scrollBehavior to handle scroll position
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// Import the useAuth composable
import { useAuth } from '../composable/useAuth'

// Cache for auth validation results to prevent redundant checks
const authCache = {
  token: null,
  isValid: false,
  timestamp: 0
}

// Navigation guard for protected routes
router.beforeEach(async (to, from, next) => {
  // Skip validation for logout-triggered navigation to login
  if (from.path !== '/login' && to.path === '/login' && !localStorage.getItem('user')) {
    console.log('Logout-triggered navigation to login, skipping validation')
    return next()
  }

  // Check if the route requires authentication
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  
  if (!requiresAuth) {
    return next()
  }
  
  // Get auth functions
  const { validateToken } = useAuth()
  
  // Get user data from localStorage
  const userStr = localStorage.getItem('user')
  let isAuthenticated = false
  let userData = null
  
  if (userStr) {
    try {
      userData = JSON.parse(userStr)
      
      // Check if we have a valid cached result to avoid redundant validation
      const currentTime = Date.now()
      const cacheAge = currentTime - authCache.timestamp
      
      // Use cached result if it's less than 30 seconds old and token matches
      if (authCache.token === userData.token && cacheAge < 30000) {
        isAuthenticated = authCache.isValid
      } else {
        // Validate token with backend
        isAuthenticated = await validateToken(userData.token)
        
        // Update cache
        authCache.token = userData.token
        authCache.isValid = isAuthenticated
        authCache.timestamp = currentTime
      }
    } catch (error) {
      console.error('Error parsing user data from localStorage:', error)
    }
  }
  
  if (!isAuthenticated) {
    // If route requires auth and user is not authenticated, redirect to login
    // Clear any stale user data and cookies
    localStorage.removeItem('user')
    const cookiesToClear = ['auth_token', 'sb-access-token', 'sb-refresh-token']
    cookiesToClear.forEach(cookieName => {
      document.cookie = `${cookieName}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`
      document.cookie = `${cookieName}=; path=/api; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`
    })
    // Redirect to login with the intended destination
    next({ 
      path: '/login', 
      query: to.path !== '/login' ? { redirect: to.fullPath } : undefined,
      // Use replace to avoid filling browser history with redirects
      replace: true 
    })
  } else if ((to.path === '/login' || to.path === '/register') && isAuthenticated) {
    // If user is already authenticated and tries to access login/register, redirect to dashboard
    next({ path: '/dashboard', replace: true })
  } else {
    // Otherwise proceed as normal
    next()
  }
})

export default router
