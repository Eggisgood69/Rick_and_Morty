<script setup>
defineProps({
  character: {
    type: Object
  }
})
</script>

<template>
  <div
    class="shadow-2xl rounded-3xl p-4 m-2 flex flex-col items-center hover:scale-110 transition duration-300 ease-in-out border-y-2 border-white"
  >
    <img
      class="w-32 h-32 rounded-3xl m-2 shadow-2xl border-2 border-black"
      :src="character.image"
      :alt="character.name"
    />
    <h2 class="text-2xl font-bold mt-3 mb-3 text-center">
      {{ character.name }}
    </h2>
    <p class="">Status : {{ character.status }}</p>
    <p class="">Species : {{ character.species }}</p>
    <p class="mb-2">Gender : {{ character.gender }}</p>
  </div>
</template>
