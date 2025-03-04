import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

// Create a reactive state that will be shared across components
const user = ref(null)
const isAuthenticated = computed(() => !!user.value)
const authError = ref(null)
const loading = ref(false)

// API base URL - use environment variable or default to '/api'
const API_URL = '/api'

// Configure axios defaults
axios.defaults.withCredentials = true
axios.defaults.headers.common['Content-Type'] = 'application/json'

export function useAuth() {
  const router = useRouter()

  // Initialize auth state from localStorage on page load
  const initAuth = async () => {
    console.log('Initializing auth state')
    loading.value = true
    
    try {
      const storedUser = localStorage.getItem('user')
      if (!storedUser) {
        console.log('No stored user found')
        return
      }
      
      try {
        console.log('Found stored user, attempting to parse')
        user.value = JSON.parse(storedUser)
        console.log('User parsed successfully:', user.value.email)
        
        // Check if token exists
        if (!user.value || !user.value.token) {
          console.warn('Invalid user data in localStorage, no token found')
          localStorage.removeItem('user')
          user.value = null
          return
        }
        
        // Check token expiration if available
        if (user.value.expiresAt) {
          const expiresAt = new Date(user.value.expiresAt)
          if (expiresAt < new Date()) {
            console.warn('Token has expired, logging out')
            user.value = null
            localStorage.removeItem('user')
            return
          }
        }
        
        // Set axios default headers for authenticated requests
        setAuthHeader(user.value.token)
        
        // Also set the token in a cookie
        document.cookie = `auth_token=${user.value.token}; path=/; max-age=${7 * 24 * 60 * 60}; ${location.protocol === 'https:' ? 'secure; samesite=lax' : ''}`
        
        // Validate the token with backend
        console.log('Validating stored token')
        const isValid = await validateToken(user.value.token)
        
        if (!isValid) {
          console.warn('Token validation failed, logging out')
          user.value = null
          localStorage.removeItem('user')
          setAuthHeader(null)
        } else {
          console.log('Token validation successful, user remains logged in')
        }
      } catch (error) {
        console.error('Failed to process stored user:', error)
        localStorage.removeItem('user')
        user.value = null
      }
    } finally {
      loading.value = false
    }
  }

  // Set auth token in axios headers and cookies
  const setAuthHeader = (token) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      // Ensure cookie is set with proper attributes
      document.cookie = `auth_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; ${location.protocol === 'https:' ? 'secure;' : ''} samesite=strict`
    } else {
      delete axios.defaults.headers.common['Authorization']
      // Clear the auth cookie
      document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;'
    }
  }

  // Register a new user
  const register = async (userData) => {
    loading.value = true
    authError.value = null
    
    try {
      console.log('Attempting to register user:', userData.email, 'with role:', userData.role)
      
      // Ensure role is explicitly set, defaulting to Manager if not provided
      const role = userData.role || 'Manager'
      
      const response = await axios.post(`${API_URL}/users`, {
        email: userData.email,
        password: userData.password,
        displayName: userData.displayName || userData.email.split('@')[0],
        role: role
      })
      
      console.log('Registration response:', response)
      
      if (!response.data) {
        throw new Error('Invalid response format from server during registration')
      }
      
      console.log('Registration successful:', response.data)
      
      // After successful registration, attempt to login automatically
      try {
        console.log('Attempting automatic login after registration with role:', role)
        const loginResult = await login({
          email: userData.email,
          password: userData.password
        })
        
        if (loginResult.success) {
          console.log('Auto-login successful, redirecting to dashboard')
          router.push('/dashboard')
          return { success: true, data: response.data }
        } else {
          console.warn('Auto-login failed, redirecting to login page')
          router.push('/login')
          return { success: true, data: response.data }
        }
      } catch (loginError) {
        console.error('Auto-login after registration failed:', loginError)
        // If auto-login fails, still consider registration successful and redirect to login page
        router.push('/login')
        return { success: true, data: response.data }
      }
    } catch (error) {
      console.error('Registration error:', error)
      if (error.response) {
        console.error('Response data:', error.response.data)
        console.error('Response status:', error.response.status)
      }
      authError.value = error.response?.data?.error || 'Registration failed. Please try again.'
      return { success: false, error: authError.value }
    } finally {
      loading.value = false
    }
  }

  // Login user
  const login = async (credentials) => {
    loading.value = true
    authError.value = null
    
    try {
      console.log('Attempting to login with:', credentials.email)
      
      // Add a delay to ensure the request is properly sent
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const response = await axios.post(`${API_URL}/auth/login`, {
        email: credentials.email,
        password: credentials.password
      }, {
        withCredentials: true
      })
      
      console.log('Login response received:', response.status)
      console.log('Response data structure:', Object.keys(response.data))
      
      if (!response.data) {
        console.error('No data in response')
        throw new Error('No data received from server')
      }
      
      if (!response.data.data) {
        console.error('No data.data in response:', response.data)
        throw new Error('Invalid response format from server')
      }
      
      const { data } = response.data
      console.log('Extracted data from response:', Object.keys(data))
      
      if (!data.session || !data.user) {
        console.error('Missing session or user in data:', data)
        throw new Error('Invalid authentication data received')
      }
      
      // Store user data and token
      user.value = {
        id: data.user.id,
        email: data.user.email,
        displayName: data.user.user_metadata?.displayName || data.user.email,
        role: data.user.user_metadata?.role || 'Player',
        token: data.session.access_token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days from now
      }
      
      console.log('User authenticated successfully:', user.value.email)
      
      // Save to localStorage
      localStorage.setItem('user', JSON.stringify(user.value))
      
      // Set auth header for future requests
      setAuthHeader(user.value.token)
      
      // Also set the token in a cookie
      document.cookie = `auth_token=${user.value.token}; path=/; max-age=${7 * 24 * 60 * 60}; ${location.protocol === 'https:' ? 'secure; samesite=lax' : ''}`
      
      // Redirect to dashboard after successful login
      router.push('/')
      
      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      if (error.response) {
        console.error('Response status:', error.response.status)
        console.error('Response data:', error.response.data)
      }
      authError.value = error.response?.data?.error || error.message || 'Invalid credentials. Please try again.'
      return { success: false, error: authError.value }
    } finally {
      loading.value = false
    }
  }

  // Logout user
  const logout = async () => {
    loading.value = true
    try {
      console.log('Logging out user')
      
      // Call logout endpoint
      await axios.post(`${API_URL}/auth/logout`, {}, {
        withCredentials: true,
        headers: {
          'Authorization': `Bearer ${user.value?.token || ''}`
        }
      })
      
      console.log('Logout API call successful')
    } catch (error) {
      console.error('Logout API error:', error)
    } finally {
      // Clear all auth-related cookies
      const cookiesToClear = ['auth_token', 'sb-access-token', 'sb-refresh-token']
      cookiesToClear.forEach(cookieName => {
        document.cookie = `${cookieName}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`
        document.cookie = `${cookieName}=; path=/api; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`
      })
      
      // Clear user data
      user.value = null
      localStorage.removeItem('user')
      
      // Clear auth headers
      delete axios.defaults.headers.common['Authorization']
      
      // Reset any error state
      authError.value = null
      
      console.log('Local auth state cleared')
      
      // Navigate to login page using router.replace to avoid history issues
      router.replace('/login')
      
      loading.value = false
    }
  }

  // Check if user has required role
  const hasRole = (role) => {
    return user.value && user.value.role === role
  }
  
  // Validate token with backend
  const validateToken = async (token) => {
    console.log('Validating token with backend')
    try {
      if (!token) {
        console.error('No token provided for validation')
        return false
      }
      
      // Set the token in a cookie for the request as well as in the Authorization header
      // This provides two ways for the backend to access the token
      document.cookie = `auth_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}; ${location.protocol === 'https:' ? 'secure; samesite=lax' : ''}`;
      
      const response = await axios.get(`${API_URL}/auth/validate`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        // Add a timeout to prevent hanging requests
        timeout: 5000,
        // Include credentials (cookies) with the request
        withCredentials: true
      })
      
      console.log('Token validation response:', response.status)
      
      // Update user data if validation was successful
      if (response.data?.valid && response.data?.user) {
        user.value = {
          ...user.value,
          ...response.data.user,
          token // Keep the existing token
        }
        localStorage.setItem('user', JSON.stringify(user.value))
      }
      
      return response.data?.valid || false
    } catch (error) {
      console.error('Token validation error:', error)
      if (error.response) {
        console.error('Response status:', error.response.status)
        if (error.response.status === 401) {
          // Token is invalid, clear user data
          user.value = null
          localStorage.removeItem('user')
          setAuthHeader(null)
          return false
        }
      }
      
      // For network errors or server errors, we'll assume the token is valid
      // This prevents users from being logged out when the backend is temporarily unavailable
      console.warn('Could not validate token due to error, assuming valid for now')
      return true
    }
  }

  // Get authorization header for API requests
  const getAuthHeader = () => {
    if (user.value && user.value.token) {
      return {
        Authorization: `Bearer ${user.value.token}`
      }
    }
    return {}
  }

  return {
    user,
    isAuthenticated,
    authError,
    loading,
    register,
    login,
    logout,
    initAuth,
    hasRole,
    validateToken,
    getAuthHeader
  }
}
