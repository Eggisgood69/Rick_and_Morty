import { test, expect } from '@playwright/test'

const character = (id, name, gender = 'Male') => ({
  id,
  name,
  status: 'Alive',
  species: 'Human',
  type: '',
  gender,
  origin: { name: 'Earth (C-137)' },
  location: { name: 'Citadel of Ricks' },
  image: `https://rickandmortyapi.com/api/character/avatar/${id}.jpeg`,
  episode: ['https://rickandmortyapi.com/api/episode/1']
})

const rick = character(1, 'Rick Sanchez')
const summer = character(3, 'Summer Smith', 'Female')

// 攔截 API，測試不依賴外部網路
const mockApi = async (page) => {
  // 角色圖片不需要真的下載
  await page.route('https://rickandmortyapi.com/api/character/avatar/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg"/>'
    })
  )
  await page.route('https://rickandmortyapi.com/api/character/1', (route) =>
    route.fulfill({ json: rick })
  )
  await page.route('https://rickandmortyapi.com/api/episode/**', (route) =>
    route.fulfill({
      json: { id: 1, episode: 'S01E01', name: 'Pilot', air_date: 'December 2, 2013' }
    })
  )
  await page.route(
    (url) => url.hostname === 'rickandmortyapi.com' && url.pathname === '/api/character/',
    (route) => {
      const params = new URL(route.request().url()).searchParams
      if (params.get('name') === 'zzzz') {
        return route.fulfill({ status: 404, json: { error: 'There is nothing here' } })
      }
      const results = params.get('gender') === 'Female' ? [summer] : [rick, summer]
      return route.fulfill({ json: { info: { pages: 1, count: results.length }, results } })
    }
  )
}

test.beforeEach(async ({ page }) => {
  await mockApi(page)
})

test('首頁顯示標題、角色卡片與總數', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Rick and Morty Characters')
  await expect(page.getByRole('heading', { name: 'Rick Sanchez' })).toBeVisible()
  await expect(page.getByTestId('total-count')).toHaveText('2 characters')
})

test('搜尋不存在的角色會顯示 Not found', async ({ page }) => {
  await page.goto('/')

  await page.getByPlaceholder('Search Characters').fill('zzzz')
  await expect(page.getByText('Not found Character.')).toBeVisible()
  await expect(page).toHaveURL(/\?name=zzzz$/)
})

test('篩選條件寫進網址，重新整理後保留', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: '#Female' }).click()
  await expect(page).toHaveURL(/\?gender=Female$/)
  await expect(page.getByTestId('total-count')).toHaveText('1 character')

  await page.reload()
  await expect(page.getByRole('button', { name: '#Female' })).toHaveAttribute(
    'aria-pressed',
    'true'
  )
  await expect(page.getByRole('heading', { name: 'Summer Smith' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Rick Sanchez' })).toHaveCount(0)
})

test('點卡片進詳細頁，Back 回到原本的篩選', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('link', { name: /Rick Sanchez/ }).click()
  await expect(page).toHaveURL(/\/character\/1$/)
  await expect(page.getByRole('heading', { name: 'Rick Sanchez' })).toBeVisible()
  await expect(page.getByText('Earth (C-137)')).toBeVisible()
  await expect(page.getByText('S01E01')).toBeVisible()

  await page.getByRole('button', { name: /Back/ }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByTestId('total-count')).toHaveText('2 characters')
})

test('直接開啟詳細頁連結', async ({ page }) => {
  await page.goto('/character/1')

  await expect(page.getByRole('heading', { name: 'Rick Sanchez' })).toBeVisible()
  await expect(page.getByText('Citadel of Ricks')).toBeVisible()
})
