<template>
  <div class="game-tracker bg-white p-6 rounded-lg shadow-lg">
    <!-- Game Setup Section (visible when !isGameStarted) -->
    <div v-if="!isGameStarted" class="setup-section">
      <h2 class="text-2xl font-bold mb-4">Create New Game</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label class="block text-gray-700 mb-2">My Team</label>
          <input 
            v-model="gameData.myTeam" 
            class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="My Team Name"
          />
        </div>
        
        <div>
          <label class="block text-gray-700 mb-2">Opponent Team</label>
          <input 
            v-model="gameData.oppTeam" 
            class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Opponent Team Name"
          />
        </div>
      </div>
      
      <div class="mb-4">
        <label class="block text-gray-700 mb-2">Number of Sets</label>
        <select 
          v-model="gameData.sets" 
          class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="3">Best of 3</option>
          <option value="5">Best of 5</option>
        </select>
      </div>
      
      <button 
        @click="startGame" 
        class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
        :disabled="!canStartGame"
      >
        Start Game
      </button>
    </div>
    
    <!-- Game Tracking Section (visible when isGameStarted) -->
    <div v-else class="tracking-section">
      <h2 class="text-2xl font-bold mb-4">
        {{ gameData.myTeam }} vs {{ gameData.oppTeam }}
      </h2>
      
      <div class="mb-4 flex justify-between items-center">
        <div class="text-center w-2/5">
          <h3 class="text-xl font-bold">{{ gameData.myTeam }}</h3>
          <div class="text-4xl font-bold">{{ gameData.myPts }}</div>
          <div class="mt-4 flex gap-2 justify-center">
            <button 
              @click="addPoint('myPts')" 
              class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
            >
              +1 Point
            </button>
            <button 
              @click="removePoint('myPts')" 
              class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
              :disabled="gameData.myPts <= 0"
            >
              -1 Point
            </button>
          </div>
        </div>
        
        <div class="text-center text-2xl font-bold">
          VS
        </div>
        
        <div class="text-center w-2/5">
          <h3 class="text-xl font-bold">{{ gameData.oppTeam }}</h3>
          <div class="text-4xl font-bold">{{ gameData.oppPts }}</div>
          <div class="mt-4 flex gap-2 justify-center">
            <button 
              @click="addPoint('oppPts')" 
              class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
            >
              +1 Point
            </button>
            <button 
              @click="removePoint('oppPts')" 
              class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
              :disabled="gameData.oppPts <= 0"
            >
              -1 Point
            </button>
          </div>
        </div>
      </div>
      
      <div class="mt-8 flex justify-center gap-4">
        <button 
          @click="saveGame" 
          class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
        >
          Save Game
        </button>
        <button 
          @click="endGame" 
          class="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition"
        >
          End Game
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue';
import { useMainStore } from '../store/index';
import { gameService } from '../services/gameService';

export default {
  name: 'GameTracker',
  setup() {
    const store = useMainStore();
    const isGameStarted = ref(false);
    
    // Base game data
    const gameData = ref({
      game: '',
      myTeam: '',
      oppTeam: '',
      myPts: 0,
      oppPts: 0,
      sets: 3, // Default to best of 3
    });
    
    // Computed property to check if game can be started
    const canStartGame = computed(() => {
      return gameData.value.myTeam && gameData.value.oppTeam;
    });
    
    // Start the game
    const startGame = () => {
      // Set the game name as "TeamA vs TeamB"
      gameData.value.game = `${gameData.value.myTeam} vs ${gameData.value.oppTeam}`;
      isGameStarted.value = true;
    };
    
    // Add a point to specified team
    const addPoint = (team) => {
      gameData.value[team]++;
      // Here you could add logic to check if a set is complete
    };
    
    // Remove a point from specified team
    const removePoint = (team) => {
      if (gameData.value[team] > 0) {
        gameData.value[team]--;
      }
    };
    
    // Save the current game state to the backend
    const saveGame = async () => {
      try {
        const savedGame = await gameService.createGame(gameData.value);
        console.log('Game saved successfully:', savedGame);
        // Optionally update store or show success message
      } catch (error) {
        console.error('Failed to save game:', error);
        // Handle error - show error message to user
      }
    };
    
    // End the game - save final state and reset form
    const endGame = async () => {
      await saveGame();
      // Reset the form
      gameData.value = {
        game: '',
        myTeam: '',
        oppTeam: '',
        myPts: 0,
        oppPts: 0,
        sets: 3,
      };
      isGameStarted.value = false;
    };
    
    return {
      isGameStarted,
      gameData,
      canStartGame,
      startGame,
      addPoint,
      removePoint,
      saveGame,
      endGame
    };
  }
};
</script> 