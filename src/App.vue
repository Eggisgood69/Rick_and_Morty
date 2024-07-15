<script setup>
import { ref } from 'vue'
import CharacterList from './views/CharacterList.vue'
</script>

<template>
  <header>
    <div class="text-center p-3 bg-gradient-to-r from-purple-500 to-blue-500 opacity-85">
      <h1 class="text-7xl font-bold tracking-wide text-white p-5">Rick and Morty Characters</h1>
      <a
        href="https://www.youtube.com/watch?v=-kdltv_CSHE&t=0s&ab_channel=AdultSwim"
        target="_blank"
        class="text-xl font-bold text-white hover:text-gray-300"
        >Rick and Morty The Anime</a
      >
    </div>
  </header>

  <CharacterList />
</template>

<stlye scope>
</stlye>
