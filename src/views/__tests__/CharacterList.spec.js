import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import CharacterList from '../CharacterList.vue'
import { routes } from '@/router'

const makeCharacter = (id, extra = {}) => ({
  id,
  name: `Character ${id}`,
  status: 'Alive',
  species: 'Human',
  gender: 'Male',
  image: `https://example.com/${id}.jpeg`,
  ...extra
})

const page = (results, { pages = 1, count = results.length } = {}) => ({
  ok: true,
  status: 200,
  json: async () => ({ info: { pages, count }, results })
})

const notFound = () => ({
  ok: false,
  status: 404,
  json: async () => ({ error: 'There is nothing here' })
})

// 取出某次 fetch 的查詢參數
const paramsOf = (call) => new URL(call[0]).searchParams
const lastParams = () => paramsOf(fetchMock.mock.calls.at(-1))

let fetchMock

beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
  // jsdom 沒有 IntersectionObserver，用不會觸發的假物件代替
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

// 用記憶體路由掛載列表，可以指定起始網址
const mountList = async (url = '/') => {
  const router = createRouter({ history: createMemoryHistory(), routes })
  router.push(url)
  await router.isReady()
  const wrapper = mount(CharacterList, { global: { plugins: [router] } })
  await flushPromises()
  return { wrapper, router }
}

const button = (wrapper, text) => wrapper.findAll('button').find((b) => b.text() === text)

describe('CharacterList', () => {
  it('載入第一頁並顯示卡片與總數', async () => {
    fetchMock.mockResolvedValueOnce(page([makeCharacter(1), makeCharacter(2)], { count: 826 }))

    const { wrapper } = await mountList()

    expect(lastParams().get('page')).toBe('1')
    expect(wrapper.findAll('.auto-show-card')).toHaveLength(2)
    expect(wrapper.get('[data-testid="total-count"]').text()).toBe('826 characters')
  })

  it('只有一個角色時用單數', async () => {
    fetchMock.mockResolvedValueOnce(page([makeCharacter(1)], { count: 1 }))

    const { wrapper } = await mountList()

    expect(wrapper.get('[data-testid="total-count"]').text()).toBe('1 character')
  })

  it('查無結果（404）時顯示 Not found，不顯示總數', async () => {
    fetchMock.mockResolvedValueOnce(notFound())

    const { wrapper } = await mountList()

    expect(wrapper.text()).toContain('Not found Character.')
    expect(wrapper.find('[data-testid="total-count"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('載入失敗')
  })

  it('網路錯誤時顯示錯誤訊息，按重試會重新載入', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline'))

    const { wrapper } = await mountList()
    expect(wrapper.text()).toContain('載入失敗')

    fetchMock.mockResolvedValueOnce(page([makeCharacter(1)]))
    await button(wrapper, '重試').trigger('click')
    await flushPromises()

    expect(wrapper.text()).not.toContain('載入失敗')
    expect(wrapper.findAll('.auto-show-card')).toHaveLength(1)
  })

  it('性別與狀態可以組合篩選，並寫進網址', async () => {
    fetchMock.mockResolvedValue(page([makeCharacter(1)]))

    const { wrapper, router } = await mountList()

    await button(wrapper, '#Female').trigger('click')
    await flushPromises()
    await button(wrapper, '#Alive').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.query).toEqual({ gender: 'Female', status: 'alive' })
    expect(lastParams().get('gender')).toBe('Female')
    expect(lastParams().get('status')).toBe('alive')
    expect(lastParams().get('page')).toBe('1')
    expect(button(wrapper, '#Female').attributes('aria-pressed')).toBe('true')
  })

  it('再按一次同一個篩選會取消', async () => {
    fetchMock.mockResolvedValue(page([makeCharacter(1)]))

    const { wrapper, router } = await mountList()

    await button(wrapper, '#Male').trigger('click')
    await flushPromises()
    await button(wrapper, '#Male').trigger('click')
    await flushPromises()

    expect(lastParams().has('gender')).toBe(false)
    expect(router.currentRoute.value.query).toEqual({})
  })

  it('從網址讀取起始條件（分享連結、重新整理）', async () => {
    fetchMock.mockResolvedValue(page([makeCharacter(1)]))

    const { wrapper } = await mountList('/?name=rick&gender=Female&status=dead')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(lastParams().get('name')).toBe('rick')
    expect(lastParams().get('gender')).toBe('Female')
    expect(lastParams().get('status')).toBe('dead')
    expect(wrapper.get('input[type="search"]').element.value).toBe('rick')
    expect(button(wrapper, '#Dead').attributes('aria-pressed')).toBe('true')
  })

  it('忽略網址上不認得的條件', async () => {
    fetchMock.mockResolvedValue(page([makeCharacter(1)]))

    await mountList('/?gender=robot&status=sleeping')

    expect(lastParams().has('gender')).toBe(false)
    expect(lastParams().has('status')).toBe(false)
  })

  it('按上一頁會回到前一組條件', async () => {
    fetchMock.mockResolvedValue(page([makeCharacter(1)]))

    const { wrapper, router } = await mountList()

    await button(wrapper, '#Female').trigger('click')
    await flushPromises()
    expect(lastParams().get('gender')).toBe('Female')

    router.back()
    await flushPromises()

    expect(lastParams().has('gender')).toBe(false)
    expect(button(wrapper, 'All').attributes('aria-pressed')).toBe('true')
  })

  it('快速切換篩選時丟掉舊的回應', async () => {
    let resolveSlow
    fetchMock
      .mockResolvedValueOnce(page([makeCharacter(1)])) // 首次載入
      .mockReturnValueOnce(new Promise((r) => (resolveSlow = r))) // Male，故意很慢
      .mockResolvedValueOnce(page([makeCharacter(2, { gender: 'Female' })])) // Female

    const { wrapper } = await mountList()

    await button(wrapper, '#Male').trigger('click')
    await flushPromises()
    await button(wrapper, '#Female').trigger('click')
    await flushPromises()

    // Male 的回應晚到，應該被丟掉
    resolveSlow(page([makeCharacter(3, { gender: 'Male' })]))
    await flushPromises()

    const cards = wrapper.findAll('.auto-show-card')
    expect(cards).toHaveLength(1)
    expect(cards[0].text()).toContain('Gender : Female')
  })

  it('搜尋時用 API 的 name 參數，延遲 300ms 並寫進網址', async () => {
    vi.useFakeTimers()
    fetchMock.mockResolvedValue(page([makeCharacter(1)]))

    const { wrapper, router } = await mountList()
    const callsBefore = fetchMock.mock.calls.length

    await wrapper.find('input[type="search"]').setValue('rick')
    expect(fetchMock.mock.calls.length).toBe(callsBefore)

    vi.advanceTimersByTime(300)
    await flushPromises()

    expect(lastParams().get('name')).toBe('rick')
    expect(router.currentRoute.value.query).toEqual({ name: 'rick' })
  })

  it('卡片連到角色詳細頁', async () => {
    fetchMock.mockResolvedValueOnce(page([makeCharacter(7)]))

    const { wrapper } = await mountList()

    expect(wrapper.get('.auto-show-card').attributes('href')).toBe('/character/7')
  })
})
