<template>
  <nav class="bg-gradient-to-r from-blue-500 to-yellow-500 p-7 text-white flex justify-between items-center shadow-lg">
    <router-link to="/" class="font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-500 hover:text-gray-200 transition duration-300">
      Welcome to Net Results App
    </router-link>
    
    <!-- Navigation for authenticated users -->
    <ul v-if="isAuthenticated" class="flex space-x-10">
      <li>
        <router-link to="/dashboard" class="text-lg text-white hover:text-gray-200 transition duration-300">Dashboard</router-link>
      </li>
      <li>
        <router-link to="/players" class="text-lg text-white hover:text-gray-200 transition duration-300">Teams</router-link>
      </li>
      <li>
        <router-link to="/matches" class="text-lg text-white hover:text-gray-200 transition duration-300">Matches</router-link>
      </li>
      <li>
        <router-link to="/statistics" class="text-lg text-white hover:text-gray-200 transition duration-300">Statistics</router-link>
      </li>
      <li>
        <a href="#" @click.prevent="logout" class="text-lg text-white hover:text-gray-200 transition duration-300">Logout</a>
      </li>
      <li v-if="user" class="text-lg text-yellow-200">
        {{ user.displayName || user.email }}
      </li>
    </ul>
    
    <!-- Navigation for guests -->
    <ul v-else class="flex space-x-10">
      <li>
        <router-link to="/login" class="text-lg text-white hover:text-gray-200 transition duration-300">Login</router-link>
      </li>
      <li>
        <router-link to="/register" class="text-lg text-white hover:text-gray-200 transition duration-300">Register</router-link>
      </li>
    </ul>
  </nav>
</template>

<script>
import { useAuth } from '../composable/useAuth';

export default {
  name: "Navbar",
  setup() {
    const { user, isAuthenticated, logout } = useAuth();
    
    return {
      user,
      isAuthenticated,
      logout
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
