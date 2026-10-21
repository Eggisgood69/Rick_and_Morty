# Rick and Morty Characters

[![CI](https://github.com/Eggisgood69/Rick_and_Morty/actions/workflows/ci.yml/badge.svg)](https://github.com/Eggisgood69/Rick_and_Morty/actions/workflows/ci.yml)

用 Vue 3 串接 [Rick and Morty API](https://rickandmortyapi.com/) 的角色瀏覽網站。

## 功能

- 角色卡片列表，捲到底自動載入下一頁（無限捲動）
- 依名字搜尋全部角色（輸入停 0.3 秒才送出）
- 性別（Male / Female）與狀態（Alive / Dead / Unknown）篩選，可以組合使用，再按一次取消
- 查無結果、網路錯誤時有提示與重試按鈕
- 卡片捲入畫面時的進場動畫（支援 `animation-timeline` 的瀏覽器）
- 回到頂部按鈕

## 技術

Vue 3（`<script setup>`）、Vite、Tailwind CSS、Vitest、Playwright，部署在 Vercel。

## 開發

需要 Node.js 24。

```sh
npm install
npm run dev        # 開發伺服器
npm run build      # 建置正式版
npm run lint       # ESLint
npm run test:unit  # 單元測試（Vitest）
```

### E2E 測試

E2E 測試會攔截 API 請求，不需要連外網路。每次開 PR 或推送到 `main`，GitHub Actions 都會自動跑 lint、單元測試、build 和 E2E 測試。

```sh
npx playwright install   # 第一次執行前安裝瀏覽器
npm run test:e2e
```

## 專案結構

```
src/
├── App.vue                    # 頁首與版面
├── views/CharacterList.vue    # 列表、搜尋、篩選、無限捲動
├── components/
│   ├── CharacterCard.vue      # 角色卡片
│   └── ScrollToTop.vue        # 回到頂部按鈕
└── assets/main.css            # 背景與全域字型樣式
public/images/background.avif  # 背景圖
```
