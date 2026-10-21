import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import CharacterList from '../CharacterList.vue'

const makeCharacter = (id, extra = {}) => ({
  id,
  name: `Character ${id}`,
  status: 'Alive',
  species: 'Human',
  gender: 'Male',
  image: `https://example.com/${id}.jpeg`,
  ...extra
})

const page = (results, pages = 1) => ({
  ok: true,
  status: 200,
  json: async () => ({ info: { pages }, results })
})

const notFound = () => ({ ok: false, status: 404, json: async () => ({ error: 'There is nothing here' }) })

// 取出某次 fetch 的查詢參數
const paramsOf = (call) => new URL(call[0]).searchParams

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

const button = (wrapper, text) => wrapper.findAll('button').find((b) => b.text() === text)

describe('CharacterList', () => {
  it('載入第一頁並顯示卡片', async () => {
    fetchMock.mockResolvedValueOnce(page([makeCharacter(1), makeCharacter(2)]))

    const wrapper = mount(CharacterList)
    await flushPromises()

    expect(paramsOf(fetchMock.mock.calls[0]).get('page')).toBe('1')
    expect(wrapper.findAll('.auto-show-card')).toHaveLength(2)
  })

  it('查無結果（404）時顯示 Not found，不會出錯', async () => {
    fetchMock.mockResolvedValueOnce(notFound())

    const wrapper = mount(CharacterList)
    await flushPromises()

    expect(wrapper.text()).toContain('Not found Character.')
    expect(wrapper.text()).not.toContain('載入失敗')
  })

  it('網路錯誤時顯示錯誤訊息，按重試會重新載入', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline'))

    const wrapper = mount(CharacterList)
    await flushPromises()
    expect(wrapper.text()).toContain('載入失敗')

    fetchMock.mockResolvedValueOnce(page([makeCharacter(1)]))
    await button(wrapper, '重試').trigger('click')
    await flushPromises()

    expect(wrapper.text()).not.toContain('載入失敗')
    expect(wrapper.findAll('.auto-show-card')).toHaveLength(1)
  })

  it('性別與狀態可以組合篩選', async () => {
    fetchMock.mockResolvedValue(page([makeCharacter(1)]))

    const wrapper = mount(CharacterList)
    await flushPromises()

    await button(wrapper, '#Female').trigger('click')
    await flushPromises()
    await button(wrapper, '#Alive').trigger('click')
    await flushPromises()

    const params = paramsOf(fetchMock.mock.calls.at(-1))
    expect(params.get('gender')).toBe('Female')
    expect(params.get('status')).toBe('alive')
    expect(params.get('page')).toBe('1')
  })

  it('再按一次同一個篩選會取消', async () => {
    fetchMock.mockResolvedValue(page([makeCharacter(1)]))

    const wrapper = mount(CharacterList)
    await flushPromises()

    await button(wrapper, '#Male').trigger('click')
    await flushPromises()
    await button(wrapper, '#Male').trigger('click')
    await flushPromises()

    expect(paramsOf(fetchMock.mock.calls.at(-1)).has('gender')).toBe(false)
  })

  it('快速切換篩選時丟掉舊的回應', async () => {
    let resolveSlow
    fetchMock
      .mockResolvedValueOnce(page([makeCharacter(1)])) // 首次載入
      .mockReturnValueOnce(new Promise((r) => (resolveSlow = r))) // Male，故意很慢
      .mockResolvedValueOnce(page([makeCharacter(2, { gender: 'Female' })])) // Female

    const wrapper = mount(CharacterList)
    await flushPromises()

    await button(wrapper, '#Male').trigger('click')
    await button(wrapper, '#Female').trigger('click')
    await flushPromises()

    // Male 的回應晚到，應該被丟掉
    resolveSlow(page([makeCharacter(3, { gender: 'Male' })]))
    await flushPromises()

    const cards = wrapper.findAll('.auto-show-card')
    expect(cards).toHaveLength(1)
    expect(cards[0].text()).toContain('Gender : Female')
  })

  it('搜尋時用 API 的 name 參數，並有 300ms 延遲', async () => {
    vi.useFakeTimers()
    fetchMock.mockResolvedValue(page([makeCharacter(1)]))

    const wrapper = mount(CharacterList)
    await flushPromises()
    const callsBefore = fetchMock.mock.calls.length

    await wrapper.find('input[type="search"]').setValue('rick')
    expect(fetchMock.mock.calls.length).toBe(callsBefore)

    vi.advanceTimersByTime(300)
    await flushPromises()

    expect(paramsOf(fetchMock.mock.calls.at(-1)).get('name')).toBe('rick')
  })
})
