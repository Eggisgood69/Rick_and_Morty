<!-- 取得角色列表API
<script setup>
import { computed, ref } from 'vue'
import CharacterCard from '@/components/CharacterCard.vue'
import vInfiniteScroll from '@/v-infinite-scroll'

const characters = ref([])
const currentPage = ref(1)
const pageSize = ref(0)
const search = ref('')

const fetchCharacters = async (page = 1) => {
  const response = await fetch(`https://rickandmortyapi.com/api/character/?page=${page}`)
  const data = await response.json()
  characters.value = data.results || []
  pageSize.value = data.info.pages || 1
}

//及時搜尋角色
const filteredCharacters = computed(() => {
  return characters.value.filter((character) =>
    character.name.toLowerCase().includes(search.value.toLowerCase())
  )
})

fetchCharacters(currentPage.value)

const loadMore = () => {
  if (currentPage.value < pageSize.value) {
    currentPage.value += 1
    fetchCharacters(currentPage.value)
  }
}
</script>

<template>
  <div class="container mx-auto flex flex-col items-center">
    <input
      type="search"
      v-model.trim="search"
      placeholder="Search characters by name"
      class="mt-6 p-5 block w-3/6 h-14 text-center border-gray-300 rounded-3xl shadow-xl sm:text-2xl opacity-90"
    />

    <div class="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" v-if="characters.length">
      <CharacterCard
        v-for="character in filteredCharacters"
        :key="character.id"
        :character="character"
        v-infinite-scroll="loadMore"
        :infinite-scroll-disabled="currentPage >= pageSize"
      />
    </div>

    <div
      v-if="filteredCharacters.length === 0 && characters.length > 0"
      class="flex justify-center items-center h-full"
    >
      <p class="font-bold text-center text-4xl h-screen pt-10">Not found Character.</p>
    </div>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Kanit:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Ubuntu:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400;1,500;1,700&display=swap');
</style> -->

<script setup>
import { computed, ref, onMounted } from 'vue'
import CharacterCard from '@/components/CharacterCard.vue'

const characters = ref([])
const currentPage = ref(1)
const pageSize = ref(0)
const search = ref('')
const loading = ref(false)

const fetchCharacters = async (page = 1) => {
  loading.value = true
  const response = await fetch(`https://rickandmortyapi.com/api/character/?page=${page}`)
  const data = await response.json()
  characters.value = [...characters.value, ...data.results] || []
  // characters.value = data.results
  pageSize.value = data.info.pages || 1
  loading.value = false
}

// 搜尋角色
const filteredCharacters = computed(() => {
  return characters.value.filter((character) =>
    character.name.toLowerCase().includes(search.value.toLowerCase())
  )
})

onMounted(() => {
  fetchCharacters(currentPage.value)
})

const loadMore = () => {
  if (currentPage.value < pageSize.value) {
    currentPage.value += 1
    fetchCharacters(currentPage.value)
  }
}

const observer = new IntersectionObserver(
  (entries) => {
    if (entries[0].isIntersecting && !loading.value) {
      loadMore()
    }
  },
  { threshold: 1.0 }
)

onMounted(() => {
  observer.observe(document.querySelector('.observer'))
})

// const filterCharacters = (gender) => {
//   if (gender === 'All') {
//     characters.value = [...characters.value]
//   } else if (gender === 'Male') {
//     characters.value = [...characters.value.filter((character) => character.gender === 'Male')]
//   } else if (gender === 'Female') {
//     characters.value = [...characters.value.filter((character) => character.gender === 'Female')]
//   }
// }
const filterCharacters = async (gender) => {
  if (gender === 'All') {
    characters.value = []
    await fetchCharacters(1)
  } else if (gender === 'Male') {
    characters.value = [...characters.value.filter((character) => character.gender === 'Male')]
  } else if (gender === 'Female') {
    characters.value = [...characters.value.filter((character) => character.gender === 'Female')]
  }
}
</script>

<template>
  <div class="container mx-auto fle flex-col items-center">
    <div class="flex justify-center items-center gap-6">
      <input
        type="search"
        v-model.trim="search"
        placeholder="Search Characters"
        class="mt-6 p-5 w-2/5 h-14 text-center rounded-3xl shadow-xl sm:text-2xl opacity-90"
      />
      <div class="">
        <div class="mt-5 gap-4 flex justify-center items-center">
          <button
            class="px-4 py-2 bg-gray-200 rounded-xl text-gray-700 hover:bg-gray-300"
            @click="filterCharacters('All')"
          >
            All
          </button>
          <button
            class="px-4 py-2 bg-gray-200 rounded-xl text-gray-700 hover:bg-gray-300"
            @click="filterCharacters('Male')"
          >
            Male
          </button>
          <button
            class="px-4 py-2 bg-gray-200 rounded-xl text-gray-700 hover:bg-gray-300"
            @click="filterCharacters('Female')"
          >
            Female
          </button>
        </div>
      </div>
    </div>
    <div
      class="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      v-if="characters.length"
    >
      <CharacterCard
        v-for="character in filteredCharacters"
        :key="character.id"
        :character="character"
      />
    </div>

    <div
      v-if="filteredCharacters.length === 0 && characters.length > 0"
      class="flex justify-center items-center h-full"
    >
      <p class="font-bold text-center text-5xl h-screen pt-10">Not found Character.</p>
    </div>

    <div class="observer" style="height: 5px"></div>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Kanit:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Ubuntu:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400;1,500;1,700&display=swap');
</style>
