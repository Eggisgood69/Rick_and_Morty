<script setup>
import { computed, ref, watch, nextTick, onMounted, onUnmounted, onActivated } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CharacterCard from '@/components/CharacterCard.vue'

const API_URL = 'https://rickandmortyapi.com/api/character/'

const genderOptions = ['Male', 'Female']
const statusOptions = [
  { label: 'Alive', value: 'alive' },
  { label: 'Dead', value: 'dead' },
  { label: 'Unknown', value: 'unknown' }
]

const route = useRoute()
const router = useRouter()

// 網址上的條件是唯一來源：?name=rick&gender=Female&status=alive
// 不認得的值直接忽略，避免送出無效的查詢
const readQuery = (query) => ({
  name: typeof query.name === 'string' ? query.name.trim() : '',
  gender: genderOptions.includes(query.gender) ? query.gender : '',
  status: statusOptions.some((o) => o.value === query.status) ? query.status : ''
})
const sameFilters = (a, b) => a.name === b.name && a.gender === b.gender && a.status === b.status

const filters = ref(readQuery(route.query))
const search = ref(filters.value.name)

const characters = ref([])
const page = ref(0) // 已載入到第幾頁
const totalPages = ref(1)
const totalCount = ref(null) // 符合條件的角色總數，載入前為 null
const loading = ref(false)
const error = ref('')

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

  const { name, gender, status } = filters.value
  const params = new URLSearchParams({ page: page.value + 1 })
  if (name) params.set('name', name)
  if (gender) params.set('gender', gender)
  if (status) params.set('status', status)

  try {
    const response = await fetch(`${API_URL}?${params}`)
    if (id !== requestId) return

    // API 查無結果時回傳 404
    if (response.status === 404) {
      totalPages.value = 0
      totalCount.value = 0
      return
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`)

    const data = await response.json()
    if (id !== requestId) return

    characters.value.push(...data.results)
    page.value += 1
    totalPages.value = data.info.pages
    totalCount.value = data.info.count
  } catch {
    if (id === requestId) error.value = 'Failed to load. Please try again.'
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
  totalCount.value = null
  loading.value = false
  error.value = ''
  loadNextPage()
}

// 把新的條件寫進網址；篩選按鈕用 push（可以按上一頁回去），打字搜尋用 replace
const updateQuery = (next, { replace = false } = {}) => {
  const query = {}
  if (next.name) query.name = next.name
  if (next.gender) query.gender = next.gender
  if (next.status) query.status = next.status
  router[replace ? 'replace' : 'push']({ name: 'characters', query })
}

// 網址改變（按篩選、上一頁、貼上分享連結）時套用新條件
watch(
  () => route.query,
  (query) => {
    // 列表頁被保留在背景時（例如在詳細頁），不要跟著詳細頁的網址變動
    if (route.name !== 'characters') return
    const next = readQuery(query)
    if (sameFilters(next, filters.value)) return
    filters.value = next
    search.value = next.name
    reload()
  }
)

const showAll = () => updateQuery({ ...filters.value, gender: '', status: '' })

// 再按一次同一個按鈕就取消該篩選；性別與狀態可以組合
const toggleGender = (value) =>
  updateQuery({ ...filters.value, gender: filters.value.gender === value ? '' : value })

const toggleStatus = (value) =>
  updateQuery({ ...filters.value, status: filters.value.status === value ? '' : value })

// 搜尋輸入停止 300ms 後才寫進網址
let searchTimer = null
watch(search, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    if (search.value !== filters.value.name) {
      updateQuery({ ...filters.value, name: search.value }, { replace: true })
    }
  }, 300)
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

// 從詳細頁返回時，確認底部是否在畫面內，需要的話繼續載入
onActivated(recheckSentinel)

onUnmounted(() => {
  observer?.disconnect()
  clearTimeout(searchTimer)
})

const buttonClass = (active) => [
  'px-4 py-2 rounded-xl hover:scale-110 hover:ease-in-out duration-300 shadow-xl',
  active
    ? 'bg-blue-500 text-white hover:bg-blue-600'
    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
]
</script>

<template>
  <!-- 單一根元素，KeepAlive 保存列表時比較穩定 -->
  <div>
    <div class="container mx-auto flex flex-col items-center justify-center">
      <div class="flex justify-center items-center gap-4 flex-wrap">
        <input
          type="search"
          v-model.trim="search"
          placeholder="Search Characters"
          class="mt-6 px-4 w-auto h-14 text-center bg-white rounded-3xl shadow-xl text-xl sm:text-2xl opacity-90 focus:outline-hidden"
        />
        <div class="mx-4 mt-5 gap-4 flex justify-center items-center flex-wrap">
          <button
            :class="buttonClass(!filters.gender && !filters.status)"
            :aria-pressed="!filters.gender && !filters.status"
            @click="showAll"
          >
            All
          </button>
          <button
            v-for="option in genderOptions"
            :key="option"
            :class="buttonClass(filters.gender === option)"
            :aria-pressed="filters.gender === option"
            @click="toggleGender(option)"
          >
            #{{ option }}
          </button>
          <button
            v-for="option in statusOptions"
            :key="option.value"
            :class="buttonClass(filters.status === option.value)"
            :aria-pressed="filters.status === option.value"
            @click="toggleStatus(option.value)"
          >
            #{{ option.label }}
          </button>
        </div>
      </div>

      <p v-if="totalCount" class="mt-6 text-lg font-bold" data-testid="total-count">
        {{ totalCount }} {{ totalCount === 1 ? 'character' : 'characters' }}
      </p>

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
        No characters found.
      </p>
      <p v-if="loading" class="font-bold text-center text-2xl py-8">Loading...</p>
      <div v-if="error" class="text-center py-8">
        <p class="font-bold text-2xl mb-4">{{ error }}</p>
        <button :class="buttonClass(false)" @click="loadNextPage">Retry</button>
      </div>
    </div>
    <div ref="sentinel" style="height: 1px"></div>
  </div>
</template>

<style>
.auto-show-card {
  transition: ease-in-out 0.3s;
}

/* 只有滑鼠這類能「懸停」的裝置才放大；手機點一下不會卡在放大狀態 */
@media (hover: hover) {
  .auto-show-card:hover {
    scale: 1.1;
  }
}

/* 手機上按下時稍微縮小，給點擊回饋 */
.auto-show-card:active {
  scale: 0.97;
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
