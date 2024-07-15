// src/directives/v-infinite-scroll.js

export default {
  beforeMount(el, binding) {
    const scrollContainer = el
    const callback = binding.value

    scrollContainer.addEventListener('scroll', () => {
      if (
        scrollContainer.scrollTop + scrollContainer.clientHeight >=
        scrollContainer.scrollHeight
      ) {
        callback()
      }
    })
  }
}
