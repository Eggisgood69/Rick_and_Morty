<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// 往下捲超過 200px 才顯示按鈕
const visible = ref(false)

const checkScroll = () => {
  visible.value = window.scrollY > 200
}

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  checkScroll()
  window.addEventListener('scroll', checkScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', checkScroll)
})
</script>

<template>
  <button
    v-show="visible"
    @click="scrollToTop"
    aria-label="回到頂部"
    class="text-white font-bold py-3 px-3 rounded-full transition ease-in-out delay-100 bg-blue-500 hover:-translate-y-1 hover:scale-110 hover:bg-indigo-500 duration-300 shadow-xl"
  >
    TOP
  </button>
</template>
