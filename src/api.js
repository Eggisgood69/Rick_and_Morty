// 串接 Rick and Morty API 的共用工具
//
// 這個 API 有流量限制：短時間內請求太多，會暫時拒絕回應，
// 瀏覽器只會報「Failed to fetch」。所以這裡做兩件事：
// 1. 失敗時等一下自動重試，使用者通常不會看到錯誤
// 2. 已經拿過的資料存在記憶體，重複瀏覽不再發請求

export const API_URL = 'https://rickandmortyapi.com/api'

// 每次重試前等待的毫秒數（測試時可改成 0）
export const retryDelays = [1000, 3000]

export class NotFoundError extends Error {}

const responseCache = new Map()
const characterCache = new Map()

const sleep = (ms) =>
  ms > 0 ? new Promise((resolve) => setTimeout(resolve, ms)) : Promise.resolve()

// 網路錯誤、429（請求太多）、5xx（伺服器暫時出錯）值得重試
const isRetryable = (status) => status === 429 || status >= 500

export async function fetchJson(url) {
  if (responseCache.has(url)) return responseCache.get(url)

  for (let attempt = 0; ; attempt++) {
    let response
    try {
      response = await fetch(url)
    } catch (error) {
      if (attempt >= retryDelays.length) throw error
      await sleep(retryDelays[attempt])
      continue
    }

    // 查無資料：不需要重試
    if (response.status === 404) throw new NotFoundError(url)

    if (response.ok) {
      const data = await response.json()
      responseCache.set(url, data)
      return data
    }

    if (!isRetryable(response.status) || attempt >= retryDelays.length) {
      throw new Error(`HTTP ${response.status}`)
    }
    await sleep(retryDelays[attempt])
  }
}

// 列表載入的角色先記下來，點進詳細頁就能馬上顯示，不用再問一次 API
export function rememberCharacters(list) {
  for (const character of list) characterCache.set(String(character.id), character)
}

export function getRememberedCharacter(id) {
  return characterCache.get(String(id)) ?? null
}

export function clearCache() {
  responseCache.clear()
  characterCache.clear()
}

export const ERROR_MESSAGE = 'The character server is busy. Please wait a moment and try again.'
