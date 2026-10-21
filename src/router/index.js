import { createRouter, createWebHistory } from 'vue-router'
import CharacterList from '@/views/CharacterList.vue'

export const routes = [
  {
    path: '/',
    name: 'characters',
    component: CharacterList
  },
  {
    path: '/character/:id(\\d+)',
    name: 'character',
    // 詳細頁拆成獨立檔案，用到才載入
    component: () => import('@/views/CharacterDetail.vue'),
    props: true
  },
  {
    // 其他網址一律回首頁
    path: '/:pathMatch(.*)*',
    redirect: { name: 'characters' }
  }
]

export default createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // 按上一頁回到列表時，回到原本捲動的位置
    if (savedPosition) return savedPosition
    // 只改篩選條件（同一頁）時不要跳回頂端
    if (to.name === from.name) return false
    return { top: 0 }
  }
})
