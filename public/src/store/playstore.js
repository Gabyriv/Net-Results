import { defineStore } from 'pinia'

export const usePlayerStore = defineStore('playerStore', {
  state: () => ({
    players: [],
  }),
  actions: {
    setPlayers(newPlayers) {
      this.players = newPlayers
    },
    addPlayer(player) {
      this.players.push(player)
    },
  },
})
