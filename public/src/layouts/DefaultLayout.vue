<template>
    <div class="flex flex-col min-h-screen">
      <Navbar />
      <main class="flex-grow">
        <slot></slot>
      </main>
      <Footer />
    </div>
  </template>
  
  <script>
  import Navbar from "../components/Navbar.vue";
  import Footer from "../components/Footer.vue";
  
  export default {
    name: "DefaultLayout",
    components: {
      Navbar,
      Footer,
    },
  };
  </script>
  