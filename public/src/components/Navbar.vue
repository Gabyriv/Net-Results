<template>
  <nav class="bg-gradient-to-r from-blue-500 to-yellow-500 p-7 text-white flex justify-between items-center shadow-lg">
    <router-link to="/" class="font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-500 hover:text-gray-200 transition duration-300">
      Welcome to Net Results App
    </router-link>
    <ul class="flex space-x-10">
      <li>
        <router-link to="/login" class="text-white text-lg hover:text-gray-200 transition duration-300">Login</router-link>
      </li>
      <li>
        <router-link to="/players" class="text-lg text-white hover:text-gray-200 transition duration-300">Teams</router-link>
      </li>
      <li>
        <router-link to="/dashboard" class="text-lg text-white hover:text-gray-200 transition duration-300">Dashboard</router-link>
      </li>
    </ul>
  </nav>
</template>

<script>
export default {
  name: "Navbar",
};
</script>

<style scoped>
/* Add any component-specific styles here */
.text-lg {
  font-size: 1.50rem; /* This is equivalent to 18px */
}
</style>
