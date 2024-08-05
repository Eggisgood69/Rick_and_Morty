<script setup>
import { computed, ref, onMounted } from 'vue'
import CharacterCard from '@/components/CharacterCard.vue'
import ScrollToTop from '@/views/ScrollToTop.vue'
const characters = ref([])
const currentPage = ref(1)
const totalPage = ref(0)
const search = ref('')
const loading = ref(false)
const showGender = ref(false)
const currentGender = ref('')
const showStatus = ref(false)
const currentStatus = ref('')

// 取得角色列表
const fetchCharacters = async (param) => {
  loading.value = true
  const response = await fetch(`https://rickandmortyapi.com/api/character/?${param}`)
  const data = await response.json()
  characters.value = [...characters.value, ...data.results] || []
  // characters.value = data.results
  totalPage.value = data.info.pages || 1
  loading.value = false
}

// 搜尋角色
const filteredCharacters = computed(() => {
  return characters.value.filter((character) =>
    character.name.toLowerCase().includes(search.value.toLowerCase())
  )
})

// 首次載入角色列表
onMounted(() => {
  fetchCharacters(`page=${currentPage.value}`)
})

// 載入更多角色
const loadMore = () => {
  if (currentPage.value < totalPage.value) {
    currentPage.value += 1
    if (currentGender.value || currentGender.value !== 'All') {
      fetchCharacters(
        `page=${currentPage.value}&gender=${currentGender.value}&status=${currentStatus.value}`
      )
    } else {
      fetchCharacters(`page=${currentPage.value}`)
    }
  }
}

const observer = new IntersectionObserver(
  (entries) => {
    if (entries[0].isIntersecting && !loading.value) {
      loadMore()
    }
  },
  { threshold: 0.8 }
)

onMounted(() => {
  observer.observe(document.querySelector('.observer'))
})

const resetCharacters = async () => {
  characters.value = []
  currentPage.value = 1
  showGender.value = false
  currentGender.value = ''
  currentStatus.value = ''
}

// 篩選角色
const filterCharacters = async (gender) => {
  resetCharacters()
  if (gender === 'All') {
    await fetchCharacters(currentPage.value)
  } else {
    currentGender.value = gender
    fetchCharacters(`page=${currentPage.value}&gender=${gender}`)
  }
}

const filterStatus = async (status) => {
  resetCharacters()
  if (status === 'Alive') {
    currentStatus.value = status
    fetchCharacters(`page=${currentPage.value}&status=${status}`)
  } else if (status === 'Dead') {
    currentStatus.value = status
    fetchCharacters(`page=${currentPage.value}&status=${status}`)
  } else if (status === 'Unknown') {
    currentStatus.value = status
    fetchCharacters(`page=${currentPage.value}&status=${status}`)
  }
}
</script>

<template>
  <div class="container mx-auto flex flex-col items-center justify-center">
    <div class="flex justify-center items-center gap-4 flex-wrap">
      <input
        type="search"
        v-model.trim="search"
        placeholder="Search Characters"
        class="mt-6 px-4 w-auto h-14 text-center rounded-3xl shadow-xl text-xl sm:text-2xl opacity-90 focus:outline-none"
      />
      <div class="mx-4 mt-5 gap-4 flex justify-center items-center flex-wrap">
        <button
          class="px-4 py-2 bg-gray-200 rounded-xl text-gray-700 hover:bg-gray-300 hover:scale-110 hover:ease-in-out duration-300 shadow-xl"
          @click="filterCharacters('All')"
        >
          All
        </button>
        <button
          class="px-4 py-2 bg-gray-200 rounded-xl text-gray-700 hover:bg-gray-300 hover:scale-110 hover:ease-in-out duration-300 shadow-xl"
          @click="filterCharacters('Male')"
        >
          #Male
        </button>
        <button
          class="px-4 py-2 bg-gray-200 rounded-xl text-gray-700 hover:bg-gray-300 hover:scale-110 hover:ease-in-out duration-300 shadow-xl"
          @click="filterCharacters('Female')"
        >
          #Female
        </button>
        <button
          class="px-4 py-2 bg-gray-200 rounded-xl text-gray-700 hover:bg-gray-300 hover:scale-110 hover:ease-in-out duration-300 shadow-xl"
          @click="filterStatus('Alive')"
        >
          #Alive
        </button>
        <button
          class="px-4 py-2 bg-gray-200 rounded-xl text-gray-700 hover:bg-gray-300 hover:scale-110 hover:ease-in-out duration-300 shadow-xl"
          @click="filterStatus('Dead')"
        >
          #Dead
        </button>
        <button
          class="px-4 py-2 bg-gray-200 rounded-xl text-gray-700 hover:bg-gray-300 hover:scale-110 hover:ease-in-out duration-300 shadow-xl"
          @click="filterStatus('Unknown')"
        >
          #Unknown
        </button>
      </div>
    </div>
    <div
      class="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
      v-if="characters.length"
    >
      <CharacterCard
        v-for="character in filteredCharacters"
        :key="character.id"
        :character="character"
        id="autoShowCard"
      />
    </div>

    <div
      v-if="filteredCharacters.length === 0 && characters.length > 0"
      class="flex justify-center items-center h-full"
    >
      <p class="font-bold text-center text-5xl h-screen pt-16">Not found Character.</p>
    </div>
  </div>
  <div v-if="!showGender || !showStatus" class="observer" style="height: 1px"></div>
</template>

<style>
/* 字體設定 */
@import url('https://fonts.googleapis.com/css2?family=Kanit:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Ubuntu:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400;1,500;1,700&display=swap');

#autoShowCard {
  animation: autoShowAnimation both;
  animation-timeline: view(90% 5%);
}

@keyframes autoShowAnimation {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.3);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

#autoShowCard {
  transition: ease-in-out 0.3s;
}

#autoShowCard:hover {
  scale: 1.1;
}
</style>
