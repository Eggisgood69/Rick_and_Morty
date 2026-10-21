<script setup>
import ScrollToTop from '@/components/ScrollToTop.vue'
</script>

<template>
  <header>
    <div class="text-center p-3 bg-linear-to-r from-purple-500 to-blue-500 opacity-85">
      <h1
        class="text-4xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-wide text-white p-5"
      >
        <RouterLink :to="{ name: 'characters' }" class="[color:inherit] [text-shadow:inherit]"
          >Rick and Morty Characters</RouterLink
        >
      </h1>
      <a
        href="https://www.youtube.com/watch?v=-kdltv_CSHE&t=0s&ab_channel=AdultSwim"
        target="_blank"
        rel="noopener"
        class="text-xs sm:text-lg md:text-1xl lg:text-2xl xl:text-3xl font-bold text-white hover:text-gray-300"
        >Rick and Morty The Anime</a
      >
    </div>
  </header>
  <ScrollToTop class="fixed bottom-20 right-8 z-50" />
  <!-- 列表頁保留在記憶體，從詳細頁返回時不用重新載入，也能回到原本的位置 -->
  <RouterView v-slot="{ Component }">
    <KeepAlive include="CharacterList">
      <component :is="Component" />
    </KeepAlive>
  </RouterView>
</template>
