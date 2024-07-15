import './assets/main.css'
import './style.css'
import infiniteScroll from './v-infinite-scroll'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.directive('infinite-scroll', infiniteScroll)
app.mount('#app')
