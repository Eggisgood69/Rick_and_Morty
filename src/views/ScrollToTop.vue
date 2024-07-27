<script setup>
import { onMounted } from 'vue'

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  const checkScroll = () => {
    if (window.scrollY > 200) {
      document.querySelector('#scroll-to-top').style.display = 'block'
    } else {
      document.querySelector('#scroll-to-top').style.display = 'none'
    }
  }

  checkScroll()

  window.addEventListener('scroll', checkScroll)
})
</script>

<template>
  <button
    id="scroll-to-top"
    @click="scrollToTop"
    class="text-white font-bold py-3 px-3 rounded-full transition ease-in-out delay-100 bg-blue-500 hover:-translate-y-1 hover:scale-110 hover:bg-indigo-500 duration-300 shadow-xl"
  >
    TOP
  </button>
</template>
