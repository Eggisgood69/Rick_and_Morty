import { test, expect } from '@playwright/test'

// 攔截 API，測試不依賴外部網路
const mockCharacters = async (page) => {
  await page.route('https://rickandmortyapi.com/api/character/**', (route) => {
    const params = new URL(route.request().url()).searchParams
    if (params.get('name') === 'zzzz') {
      return route.fulfill({ status: 404, json: { error: 'There is nothing here' } })
    }
    return route.fulfill({
      json: {
        info: { pages: 1 },
        results: [
          {
            id: 1,
            name: 'Rick Sanchez',
            status: 'Alive',
            species: 'Human',
            gender: 'Male',
            image: 'https://rickandmortyapi.com/api/character/avatar/1.jpeg'
          }
        ]
      }
    })
  })
}

test('首頁顯示標題與角色卡片', async ({ page }) => {
  await mockCharacters(page)
  await page.goto('/')

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Rick and Morty Characters')
  await expect(page.getByRole('heading', { name: 'Rick Sanchez' })).toBeVisible()
})

test('搜尋不存在的角色會顯示 Not found', async ({ page }) => {
  await mockCharacters(page)
  await page.goto('/')

  await page.getByPlaceholder('Search Characters').fill('zzzz')
  await expect(page.getByText('Not found Character.')).toBeVisible()
})
