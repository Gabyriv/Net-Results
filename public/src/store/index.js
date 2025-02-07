// src/store/index.js
import { defineStore } from 'pinia'

// Example: A simple global store (you can also split into multiple files)
export const useMainStore = defineStore('main', {
  state: () => ({
    // Define your state here, e.g., players, matches, etc.
    players: [],
    matches: [],
  }),
  actions: {
    setPlayers(players) {
      this.players = players
    },
    setMatches(matches) {
      this.matches = matches
    },
  },
})
