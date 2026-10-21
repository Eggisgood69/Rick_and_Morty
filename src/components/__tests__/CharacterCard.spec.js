import { describe, it, expect } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import CharacterCard from '../CharacterCard.vue'

const rick = {
  id: 1,
  name: 'Rick Sanchez',
  status: 'Alive',
  species: 'Human',
  gender: 'Male',
  image: 'https://rickandmortyapi.com/api/character/avatar/1.jpeg'
}

const mountCard = () =>
  mount(CharacterCard, {
    props: { character: rick },
    global: { stubs: { RouterLink: RouterLinkStub } }
  })

describe('CharacterCard', () => {
  it('顯示角色資料', () => {
    const wrapper = mountCard()

    expect(wrapper.find('h2').text()).toBe('Rick Sanchez')
    expect(wrapper.text()).toContain('Status : Alive')
    expect(wrapper.text()).toContain('Species : Human')
    expect(wrapper.text()).toContain('Gender : Male')
  })

  it('圖片有 alt 並延遲載入', () => {
    const wrapper = mountCard()
    const img = wrapper.find('img')

    expect(img.attributes('src')).toBe(rick.image)
    expect(img.attributes('alt')).toBe('Rick Sanchez')
    expect(img.attributes('loading')).toBe('lazy')
  })

  it('連到角色詳細頁', () => {
    const wrapper = mountCard()

    expect(wrapper.getComponent(RouterLinkStub).props('to')).toEqual({
      name: 'character',
      params: { id: 1 }
    })
  })
})
