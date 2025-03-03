<template>
  <nav class="bg-gradient-to-r from-blue-500 to-yellow-500 p-7 text-white flex justify-between items-center shadow-lg">
    <router-link to="/" class="font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-500 hover:text-gray-200 transition duration-300">
      Welcome to Net Results App
    </router-link>
    
    <!-- Navigation for authenticated users -->
    <div v-if="isAuthenticated" class="flex items-center space-x-10">
      <ul class="flex space-x-10">
        <li>
          <router-link to="/dashboard" class="text-lg text-white hover:text-gray-200 transition duration-300">Dashboard</router-link>
        </li>
        <li>
          <router-link to="/teams" class="text-lg text-white hover:text-gray-200 transition duration-300">Teams</router-link>
        </li>
        <li>
          <router-link to="/api-connection" class="text-lg text-white hover:text-gray-200 transition duration-300">API Test</router-link>
        </li>
        <li v-if="user" class="text-lg text-yellow-200">
          {{ user.displayName }}
        </li>
      </ul>
      <button 
        @click="handleLogout" 
        class="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition duration-300"
        :disabled="loading"
      >
        {{ loading ? 'Logging out...' : 'Logout' }}
      </button>
    </div>
    
    <!-- Navigation for guests -->
    <ul v-else class="flex space-x-10">
      <li>
        <router-link to="/login" class="text-lg text-white hover:text-gray-200 transition duration-300">Login</router-link>
      </li>
      <li>
        <router-link to="/register" class="text-lg text-white hover:text-gray-200 transition duration-300">Register</router-link>
      </li>
      <li>
        <router-link to="/api-connection" class="text-lg text-white hover:text-gray-200 transition duration-300">API Test</router-link>
      </li>
    </ul>
  </nav>
</template>

<script>
import { useAuth } from '../composable/useAuth';
import { ref } from 'vue';

export default {
  name: "Navbar",
  setup() {
    const { user, isAuthenticated, logout } = useAuth();
    const loading = ref(false);
    
    const handleLogout = async () => {
      try {
        loading.value = true;
        await logout();
      } catch (error) {
        console.error('Error during logout:', error);
      } finally {
        loading.value = false;
      }
    };
    
    return {
      user,
      isAuthenticated,
      loading,
      handleLogout
    };
  }
};
</script>

<style scoped>
/* Add any component-specific styles here */
.text-lg {
  font-size: 2.50rem; /* This is equivalent to 18px */
}
</style>
