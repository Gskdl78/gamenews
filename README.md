# 遊戲快報 (Game News )

本專案旨在集中爬取多款遊戲的官方網站公告，透過本地 AI 模型分析與摘要後，以結構化、易於閱讀的形式呈現給玩家。

首波支援遊戲：
- **蔚藍檔案 (Blue Archive)**
- **公主連結 (Princess Connect! Re: Dive)**

---

## 🚀 功能特色 (Features)

- **自動化爬蟲**：定時爬取指定遊戲官網的最新公告。
- **AI 內容摘要**：使用本地運行的 Ollama 模型對新聞內容進行分析，提取關鍵資訊（如活動時間、重點內容）。
- **結構化呈現**：將新聞依據「活動」、「招募」、「更新」等類別進行分類與展示。
- **動態遊戲路由**：採用 `games/[slug]` 動態路由，方便未來擴充支援更多遊戲。
- **資料庫整合**：使用 Supabase 儲存爬取與分析後的遊戲新聞資料。
- **響應式設計**：確保在桌面與行動裝置上皆有良好的瀏覽體驗。

---

## 🛠️ 技術棧 (Tech Stack)

| 類別 | 技術 |
| :--- | :--- |
| **前端框架** | Next.js 14, React 18 |
| **UI 元件庫** | Tailwind CSS, Material-UI (MUI) |
| **狀態管理** | TanStack React Query |
| **後端 & 資料庫** | Supabase |
| **網頁爬蟲** | Playwright, Puppeteer |
| **AI 模型** | Ollama (gemma) |
| **語言** | TypeScript |
| **執行環境** | Node.js 18+ |

---

## 📂 專案結構 (Directory Structure)

```
/
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── page.tsx          # 首頁
│   │   └── games/[slug]/     # 動態遊戲新聞頁面
│   ├── components/           # 共用 React 元件
│   ├── lib/                  # 核心邏輯 (Supabase, Ollama, 爬蟲共用模組)
│   └── types/                # TypeScript 型別定義
├── scripts/                # 獨立的爬蟲執行腳本
├── public/                 # 靜態資源 (圖片, 圖標)
├── tests/                  # 單元測試與 E2E 測試 (Jest, Playwright)
├── .env.local              # 本地環境變數 (需自行建立)
└── package.json
```

---

## 🏁 開始使用 (Getting Started)

### 1. 環境準備
- 安裝 [Node.js](https://nodejs.org/) (v18 或更高版本)
- 註冊並建立一個 [Supabase](https://supabase.com/) 專案
- 安裝並運行 [Ollama](https://ollama.com/)，並拉取模型 (`ollama pull gemma`)

### 2. 安裝與設定
1.  **複製專案**
    ```bash
    git clone https://github.com/your-repo/game-news-express.git
    cd game-news-express
    ```

2.  **安裝依賴**
    ```bash
    npm install
    ```

3.  **設定環境變數**
    複製 `.env.example` (如果存在) 或手動建立 `.env.local` 檔案，並填入您的 Supabase 專案資訊。
    ```
    # .env.local
    NEXT_PUBLIC_SUPABASE_URL="YOUR_SUPABASE_URL"
    NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
    OLLAMA_API_BASE_URL="http://localhost:11434"
    ```

### 3. 啟動開發伺服器
```bash
npm run dev
```
應用程式將會運行在 `http://localhost:3000`。

---

## 📜 可用腳本 (Available Scripts)

-   `npm run dev`: 啟動開發模式。
-   `npm run build`: 建立生產版本。
-   `npm run start`: 運行生產版本。
-   `npm run lint`: 執行 ESLint 程式碼檢查。
-   `npm run crawl:pcr`: 執行公主連結的爬蟲腳本。
-   `npm run crawl:bluearchive`: 執行蔚藍檔案的爬蟲腳本。
-   `npm run check:db`: 檢查資料庫連線狀態。 