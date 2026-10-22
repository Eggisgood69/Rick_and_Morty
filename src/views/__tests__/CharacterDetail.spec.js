import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import CharacterDetail from '../CharacterDetail.vue'
import { routes } from '@/router'
import { rememberCharacters } from '@/api'

const rick = {
  id: 1,
  name: 'Rick Sanchez',
  status: 'Alive',
  species: 'Human',
  type: '',
  gender: 'Male',
  origin: { name: 'Earth (C-137)' },
  location: { name: 'Citadel of Ricks' },
  image: 'https://rickandmortyapi.com/api/character/avatar/1.jpeg',
  episode: [
    'https://rickandmortyapi.com/api/episode/1',
    'https://rickandmortyapi.com/api/episode/2'
  ]
}

const episode = (id, code, name) => ({ id, episode: code, name, air_date: 'December 2, 2013' })

const ok = (body) => ({ ok: true, status: 200, json: async () => body })

let fetchMock

beforeEach(() => {
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const mountDetail = async (id = '1') => {
  const router = createRouter({ history: createMemoryHistory(), routes })
  router.push(`/character/${id}`)
  await router.isReady()
  const wrapper = mount(CharacterDetail, { props: { id }, global: { plugins: [router] } })
  await flushPromises()
  return { wrapper, router }
}

describe('CharacterDetail', () => {
  it('顯示角色資料與出現的集數', async () => {
    fetchMock
      .mockResolvedValueOnce(ok(rick))
      .mockResolvedValueOnce(
        ok([episode(1, 'S01E01', 'Pilot'), episode(2, 'S01E02', 'Lawnmower Dog')])
      )

    const { wrapper } = await mountDetail()

    expect(fetchMock.mock.calls[0][0]).toBe('https://rickandmortyapi.com/api/character/1')
    // 集數一次抓回來
    expect(fetchMock.mock.calls[1][0]).toBe('https://rickandmortyapi.com/api/episode/1,2')

    expect(wrapper.get('h2').text()).toBe('Rick Sanchez')
    expect(wrapper.text()).toContain('Earth (C-137)')
    expect(wrapper.text()).toContain('Citadel of Ricks')
    const items = wrapper.findAll('[data-testid="episode-list"] li')
    expect(items).toHaveLength(2)
    expect(items[0].text()).toContain('S01E01 · Pilot')
    expect(document.title).toBe('Rick Sanchez | Rick and Morty')
  })

  it('只有一集時也能顯示（API 回傳物件而不是陣列）', async () => {
    fetchMock
      .mockResolvedValueOnce(
        ok({ ...rick, episode: ['https://rickandmortyapi.com/api/episode/5'] })
      )
      .mockResolvedValueOnce(ok(episode(5, 'S01E05', 'Meeseeks and Destroy')))

    const { wrapper } = await mountDetail()

    const items = wrapper.findAll('[data-testid="episode-list"] li')
    expect(items).toHaveLength(1)
    expect(items[0].text()).toContain('Meeseeks and Destroy')
  })

  it('角色不存在時顯示 Not found', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({}) })

    const { wrapper } = await mountDetail('99999')

    expect(wrapper.text()).toContain('No character found.')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('重試後仍失敗才顯示錯誤，按 Retry 可以重新載入', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))

    const { wrapper } = await mountDetail()
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(wrapper.text()).toContain('server is busy')

    fetchMock.mockReset()
    fetchMock.mockResolvedValueOnce(ok(rick)).mockResolvedValueOnce(ok([]))
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Retry')
      .trigger('click')
    await flushPromises()

    expect(wrapper.get('h2').text()).toBe('Rick Sanchez')
  })

  it('直接開啟連結時，Back 回到首頁', async () => {
    fetchMock.mockResolvedValueOnce(ok(rick)).mockResolvedValueOnce(ok([]))

    const { wrapper, router } = await mountDetail()
    await wrapper
      .findAll('button')
      .find((b) => b.text().includes('Back'))
      .trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('characters')
  })

  it('偶爾失敗時自動重試，使用者看不到錯誤', async () => {
    fetchMock
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(ok(rick))
      .mockResolvedValueOnce(ok([episode(1, 'S01E01', 'Pilot')]))

    const { wrapper } = await mountDetail()

    expect(wrapper.get('h2').text()).toBe('Rick Sanchez')
    expect(wrapper.text()).not.toContain('server is busy')
    expect(wrapper.findAll('[data-testid="episode-list"] li')).toHaveLength(1)
  })

  it('集數載入失敗時，角色資料照樣顯示，只有集數區塊可以重試', async () => {
    fetchMock.mockResolvedValueOnce(ok(rick)).mockRejectedValue(new TypeError('Failed to fetch'))

    const { wrapper } = await mountDetail()

    expect(wrapper.get('h2').text()).toBe('Rick Sanchez')
    expect(wrapper.text()).toContain('Earth (C-137)')
    expect(wrapper.text()).toContain('server is busy')

    fetchMock.mockReset()
    fetchMock.mockResolvedValueOnce(ok([episode(1, 'S01E01', 'Pilot')]))
    await wrapper
      .findAll('button')
      .find((b) => b.text() === 'Retry')
      .trigger('click')
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(wrapper.findAll('[data-testid="episode-list"] li')).toHaveLength(1)
  })

  it('從列表點進來的角色直接顯示，不再請求角色資料', async () => {
    rememberCharacters([rick])
    fetchMock.mockResolvedValueOnce(ok([episode(1, 'S01E01', 'Pilot')]))

    const { wrapper } = await mountDetail()

    expect(wrapper.get('h2').text()).toBe('Rick Sanchez')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock.mock.calls[0][0]).toContain('/episode/')
  })
})
