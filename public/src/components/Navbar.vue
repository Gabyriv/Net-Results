<template>
    <nav class="bg-blue-500 p-4 text-white flex justify-between">
      <div class="font-bold">Welcome to the Volleyball Stats App</div>
      <ul class="flex space-x-4">
        <li>
          <router-link to="/login" class="text-white">Login</router-link>
        </li>
        <li>
          <router-link to="/dashboard">Dashboard</router-link>
        </li>
        <li>
          <router-link to="/players">Teams</router-link>
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
  