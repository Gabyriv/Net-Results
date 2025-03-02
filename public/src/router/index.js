import { createRouter, createWebHistory } from 'vue-router'
import Home from '../pages/Home.vue'
import Dashboard from '../pages/Dashboard.vue'
import Players from '../pages/Players.vue'
import Matches from '../pages/Matches.vue'
import Statistics from '../pages/Statistics.vue'
import Login from '../pages/Login.vue'
import Register from '../pages/Register.vue'
import FetchApi from '../components/FetchApi.vue'

const routes = [
  { path: '/' , redirect: '/home' },
  { path: '/dashboard', name: 'Dashboard', component: Dashboard },
  { path: '/players', name: 'Players', component: Players },
  { path: '/matches', name: 'Matches', component: Matches },
  { path: '/statistics', name: 'Statistics', component: Statistics },
  { path: '/login', name: 'Login', component: Login },
  { path: '/register', name: 'Register', component: Register },
  { path: '/home', name: 'Home', component: Home },
  { path: '/api-test', name: 'ApiTest', component: FetchApi },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
