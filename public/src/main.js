import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import './styles/tailwind.css' 
import axios from 'axios'

// Configure axios defaults - use the base URL without the /api prefix
// since the composables already include /api in their URLs
axios.defaults.baseURL = ''
axios.defaults.withCredentials = true
axios.defaults.headers.common['Content-Type'] = 'application/json'

// Add response interceptor to handle common errors
axios.interceptors.response.use(
  response => response,
  error => {
    // Prevent redundant error logging in production
    if (process.env.NODE_ENV !== 'production') {
      console.error('API Error:', error.response?.status, error.response?.data || error.message)
    }
    return Promise.reject(error)
  }
)

// Create and configure the app
const app = createApp(App)

// Performance optimizations
app.config.performance = process.env.NODE_ENV !== 'production'
app.config.productionTip = false

// Use plugins
app.use(router)
app.use(createPinia())

// Mount the app after the router is ready to prevent initial loading issues
router.isReady().then(() => {
  app.mount('#app')
})
