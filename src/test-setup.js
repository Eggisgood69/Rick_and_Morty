import { beforeEach } from 'vitest'
import { clearCache, retryDelays } from '@/api'

// 測試時不要真的等待重試，也不要讓上一個測試的快取影響下一個
beforeEach(() => {
  retryDelays.splice(0, retryDelays.length, 0, 0)
  clearCache()
})
