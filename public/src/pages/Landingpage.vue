<template>
  <div class="landing-page">
    <header class="header">
      <h1>Welcome to Net Results App</h1>
      <p>Your ultimate volleyball statistics tracker.</p>
      <router-link to="/register" class="btn-primary">Get Started</router-link>
    </header>
    <section class="features">
      <div class="feature">
        <h2>Track Matches</h2>
        <p>Keep track of all your volleyball matches and scores.</p>
        <img src="../assets/trackmatch.png" alt="Track Matches" class="feature-image">
      </div>
      <div class="feature">
        <h2>Player Stats</h2>
        <p>Monitor player performance and statistics.</p>
        <img src="../assets/Playerstat.png" alt="Player Stats" class="feature-image">
      </div>
      <div class="feature">
        <h2>Team Management</h2>
        <p>Manage teams and view detailed statistics.</p>
        <img src="../assets/Team-management.png" alt="Team Management" class="feature-image">
      </div>
    </section>
  </div>
</template>

<script>
export default {
  name: 'LandingPage',
};
</script>

<style scoped>
.landing-page {
  text-align: center;
  padding: 2rem;
}
.header {
  background-image: url('/banner.jpeg');
  background-size: cover;
  background-position: center;
  color: white;
  padding: 4rem 2rem; /* Increased padding for better visibility */
  position: relative;
}
.header h1 {
  margin: 0;
  padding-bottom: 1rem;
  font-size: 3rem; /* Increased font size */
}
.header p {
  margin: 0;
  padding-bottom: 1rem;
  font-size: 2rem; /* Increased font size */
}
.btn-primary {
  background-color: #b8b331;
  color: white;
  padding: 1rem 2rem;
  text-decoration: none;
  border-radius: 5px;
  display: inline-block;
  margin-top: 1rem;
  font-size: 1.5rem; /* Increased font size */
}
.features {
  display: flex;
  justify-content: space-around;
  margin-top: 2rem;
}
.feature {
  width: 30%;
}
.feature h2 {
  font-size: 2.5rem; /* Increased font size */
}
.feature p {
  font-size: 1.5rem; /* Increased font size */
}
.feature-image {
  margin-top: 1rem;
  max-width: 100%;
  height: auto;
  border-radius: 10px;
}
</style>
