<template>
  <nav class="bg-blue-500 p-4 text-white flex justify-between">
    <router-link to="/home" class="font-bold text-lg text-white">Welcome to the Volleyball Stats App</router-link>
    <ul class="flex space-x-6">
      <li>
        <router-link to="/login" class="text-white text-lg">Login</router-link>
      </li>
      <li>
        <router-link to="/dashboard" class="text-lg">Dashboard</router-link>
      </li>
      <li>
        <router-link to="/players" class="text-lg">Teams</router-link>
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
  font-size: 1.125rem; /* This is equivalent to 18px */
}
</style>
