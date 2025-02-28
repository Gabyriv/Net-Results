import { defineStore } from 'pinia'

export const useMainStore = defineStore('main', {
  state: () => ({
    matches: [],
    players: [],
    wins: [],
  }),
  actions: {
    // Define actions to fetch or update data
  },
})
