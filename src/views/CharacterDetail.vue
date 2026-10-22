<script setup>
import { ref, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  id: {
    type: String,
    required: true
  }
})

const API_URL = 'https://rickandmortyapi.com/api'
const router = useRouter()

const character = ref(null)
const episodes = ref([])
const loading = ref(false)
const notFound = ref(false)
const error = ref('')

// 換角色時丟掉上一個角色還沒回來的回應
let requestId = 0

// 角色資料裡的集數是一串網址，取出最後的編號
const episodeIds = (urls) => urls.map((url) => url.split('/').pop())

const load = async () => {
  const id = ++requestId
  loading.value = true
  notFound.value = false
  error.value = ''
  character.value = null
  episodes.value = []

  try {
    const response = await fetch(`${API_URL}/character/${props.id}`)
    if (id !== requestId) return
    if (response.status === 404) {
      notFound.value = true
      return
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const data = await response.json()
    if (id !== requestId) return
    character.value = data
    document.title = `${data.name} | Rick and Morty`

    // 一次抓回所有集數；只有一集時 API 回傳物件而不是陣列
    const ids = episodeIds(data.episode)
    if (ids.length) {
      const res = await fetch(`${API_URL}/episode/${ids.join(',')}`)
      if (id !== requestId) return
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const list = await res.json()
      if (id !== requestId) return
      episodes.value = Array.isArray(list) ? list : [list]
    }
  } catch {
    if (id === requestId) error.value = 'Failed to load. Please try again.'
  } finally {
    if (id === requestId) loading.value = false
  }
}

watch(() => props.id, load, { immediate: true })

onUnmounted(() => {
  document.title = 'Rick and Morty'
})

// 從列表點進來就回上一頁（保留篩選與捲動位置）；直接開連結則回首頁
const goBack = () => {
  if (window.history.state?.back) router.back()
  else router.push({ name: 'characters' })
}

const statusColor = {
  Alive: 'bg-green-500',
  Dead: 'bg-red-500',
  unknown: 'bg-gray-400'
}
</script>

<template>
  <main class="container mx-auto px-4 py-6 max-w-3xl">
    <button
      class="px-4 py-2 bg-gray-200 rounded-xl text-gray-700 hover:bg-gray-300 shadow-xl"
      @click="goBack"
    >
      ← Back
    </button>

    <p v-if="loading && !character" class="font-bold text-center text-2xl py-16">Loading...</p>

    <p v-else-if="notFound" class="font-bold text-center text-4xl py-16">No character found.</p>

    <div v-else-if="error" class="text-center py-16">
      <p class="font-bold text-2xl mb-4">{{ error }}</p>
      <button
        class="px-4 py-2 bg-gray-200 rounded-xl text-gray-700 hover:bg-gray-300 shadow-xl"
        @click="load"
      >
        Retry
      </button>
    </div>

    <article
      v-if="character"
      class="mt-6 shadow-2xl rounded-3xl p-6 border-y-2 border-white flex flex-col sm:flex-row gap-6 items-center sm:items-start"
    >
      <img
        class="w-56 h-56 rounded-3xl shadow-2xl border-2 border-black shrink-0"
        :src="character.image"
        :alt="character.name"
        width="224"
        height="224"
      />
      <div class="flex-1 text-center sm:text-left">
        <h2 class="text-3xl sm:text-4xl font-bold mb-3">{{ character.name }}</h2>
        <p class="flex items-center gap-2 justify-center sm:justify-start mb-4">
          <span
            class="inline-block w-3 h-3 rounded-full"
            :class="statusColor[character.status] ?? 'bg-gray-400'"
          ></span>
          {{ character.status }} · {{ character.species }}
          <template v-if="character.type"> ({{ character.type }})</template>
        </p>
        <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-left">
          <dt class="font-bold">Gender</dt>
          <dd>{{ character.gender }}</dd>
          <dt class="font-bold">Origin</dt>
          <dd>{{ character.origin.name }}</dd>
          <dt class="font-bold">Location</dt>
          <dd>{{ character.location.name }}</dd>
          <dt class="font-bold">Episodes</dt>
          <dd>{{ character.episode.length }}</dd>
        </dl>
      </div>
    </article>

    <section v-if="episodes.length" class="mt-8">
      <h3 class="text-2xl font-bold mb-4">Episodes</h3>
      <ul class="grid grid-cols-1 sm:grid-cols-2 gap-3" data-testid="episode-list">
        <li
          v-for="ep in episodes"
          :key="ep.id"
          class="rounded-2xl px-4 py-3 shadow-xl border border-white/60 bg-white/40"
        >
          <span class="font-bold">{{ ep.episode }}</span> · {{ ep.name }}
          <span class="block text-sm opacity-80">{{ ep.air_date }}</span>
        </li>
      </ul>
    </section>
  </main>
</template>
