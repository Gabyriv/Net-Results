<template>
    <nav class="bg-blue-600 p-4 text-white flex justify-between">
      <div class="font-bold">Volleyball Stats</div>
      <ul class="flex space-x-4">
        <li>
          <router-link to="/">Home</router-link>
        </li>
        <li>
          <router-link to="/dashboard">Dashboard</router-link>
        </li>
        <li>
          <router-link to="/players">Players</router-link>
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
  </style>
  