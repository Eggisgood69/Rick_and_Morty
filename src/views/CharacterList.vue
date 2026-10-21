<script setup>
import { computed, ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import CharacterCard from '@/components/CharacterCard.vue'

const API_URL = 'https://rickandmortyapi.com/api/character/'

const genderOptions = ['Male', 'Female']
const statusOptions = [
  { label: 'Alive', value: 'alive' },
  { label: 'Dead', value: 'dead' },
  { label: 'Unknown', value: 'unknown' }
]

const characters = ref([])
const page = ref(0) // 已載入到第幾頁
const totalPages = ref(1)
const loading = ref(false)
const error = ref('')

const search = ref('')
const gender = ref('')
const status = ref('')

const sentinel = ref(null)
let observer = null

// 每次換條件就 +1，用來丟掉舊條件的回應（避免快速切換時資料混在一起）
let requestId = 0

const hasMore = computed(() => page.value < totalPages.value)
const isEmpty = computed(() => !loading.value && !error.value && characters.value.length === 0)

// 載入下一頁，搜尋與篩選都交給 API 處理
const loadNextPage = async () => {
  if (loading.value || !hasMore.value) return

  const id = requestId
  loading.value = true
  error.value = ''

  const params = new URLSearchParams({ page: page.value + 1 })
  if (search.value) params.set('name', search.value)
  if (gender.value) params.set('gender', gender.value)
  if (status.value) params.set('status', status.value)

  try {
    const response = await fetch(`${API_URL}?${params}`)
    if (id !== requestId) return

    // API 查無結果時回傳 404
    if (response.status === 404) {
      totalPages.value = 0
      return
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const data = await response.json()
    if (id !== requestId) return

    characters.value.push(...data.results)
    page.value += 1
    totalPages.value = data.info.pages
  } catch (e) {
    if (id === requestId) error.value = '載入失敗，請稍後再試。'
  } finally {
    if (id === requestId) {
      loading.value = false
      recheckSentinel()
    }
  }
}

// 載入後若底部仍在畫面內（例如螢幕很高），重新觀察讓它再觸發一次
const recheckSentinel = () => {
  nextTick(() => {
    if (observer && sentinel.value) {
      observer.unobserve(sentinel.value)
      observer.observe(sentinel.value)
    }
  })
}

// 條件改變：清空列表，從第一頁重新載入
const reload = () => {
  requestId += 1
  characters.value = []
  page.value = 0
  totalPages.value = 1
  loading.value = false
  error.value = ''
  loadNextPage()
}

const showAll = () => {
  gender.value = ''
  status.value = ''
  reload()
}

// 再按一次同一個按鈕就取消該篩選；性別與狀態可以組合
const toggleGender = (value) => {
  gender.value = gender.value === value ? '' : value
  reload()
}

const toggleStatus = (value) => {
  status.value = status.value === value ? '' : value
  reload()
}

// 搜尋輸入停止 300ms 後才送出
let searchTimer = null
watch(search, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(reload, 300)
})

onMounted(() => {
  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) loadNextPage()
    },
    { rootMargin: '200px' }
  )
  observer.observe(sentinel.value)
  loadNextPage()
})

onUnmounted(() => {
  observer?.disconnect()
  clearTimeout(searchTimer)
})

const buttonClass = (active) => [
  'px-4 py-2 rounded-xl hover:scale-110 hover:ease-in-out duration-300 shadow-xl',
  active ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
]
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
        <button :class="buttonClass(!gender && !status)" @click="showAll">All</button>
        <button
          v-for="option in genderOptions"
          :key="option"
          :class="buttonClass(gender === option)"
          @click="toggleGender(option)"
        >
          #{{ option }}
        </button>
        <button
          v-for="option in statusOptions"
          :key="option.value"
          :class="buttonClass(status === option.value)"
          @click="toggleStatus(option.value)"
        >
          #{{ option.label }}
        </button>
      </div>
    </div>

    <div
      v-if="characters.length"
      class="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
    >
      <CharacterCard
        v-for="character in characters"
        :key="character.id"
        :character="character"
        class="auto-show-card"
      />
    </div>

    <p v-if="isEmpty" class="font-bold text-center text-5xl h-screen pt-16">
      Not found Character.
    </p>
    <p v-if="loading" class="font-bold text-center text-2xl py-8">Loading...</p>
    <div v-if="error" class="text-center py-8">
      <p class="font-bold text-2xl mb-4">{{ error }}</p>
      <button :class="buttonClass(false)" @click="loadNextPage">重試</button>
    </div>
  </div>
  <div ref="sentinel" style="height: 1px"></div>
</template>

<style>
/* 字體設定 */
@import url('https://fonts.googleapis.com/css2?family=Kanit:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Ubuntu:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400;1,500;1,700&display=swap');

.auto-show-card {
  transition: ease-in-out 0.3s;
}

.auto-show-card:hover {
  scale: 1.1;
}

/* 只有支援捲動驅動動畫的瀏覽器才套用，其他瀏覽器直接顯示卡片 */
@supports (animation-timeline: view()) {
  .auto-show-card {
    animation: autoShowAnimation both;
    animation-timeline: view(90% 5%);
  }
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
</style>
