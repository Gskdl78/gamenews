# 遊戲快報 (Game News Express)

這是一個多遊戲公告平台，旨在提供一個集中、統一的介面，追蹤並展示各款遊戲的最新消息。平台會自動爬取官方網站的公告，使用本地 AI 模型進行內容整理，並以結構化的方式呈現給使用者。

## 核心功能

-   **多遊戲支援**：平台化架構，已支援**公主連結**與**蔚藍檔案**，並可輕鬆擴充。
-   **獨立爬蟲系統**：每個遊戲擁有獨立的爬蟲邏輯，互不干擾。
-   **智慧分類與摘要**：使用本地 Ollama (`gemma3:4b` 模型) 對遊戲公告進行智慧分析，提取關鍵資訊，如活動類型、時間、相關角色等。
-   **結構化展示**：前端頁面將各遊戲的新聞進行分類展示。
-   **後端與儲存**：使用 Supabase 作為統一的後端資料庫。

## 專案結構

所有專案檔案都位於 `game-news` 目錄中。

-   `/`：平台入口頁，展示所有支援的遊戲。
-   `/games/[slug]`：各遊戲專屬的新聞資訊站 (`/games/princess-connect`, `/games/blue-archive`)。
-   `/scripts`: 存放 **蔚藍檔案** 爬蟲的主要腳本 (`run-bluearchive-crawler.js`)。
-   `/src/lib`: 存放 **公主連結** 爬蟲的核心邏輯 (`crawler.ts`) 及共用模組 (Supabase, Ollama)。

## 技術棧

-   **前端**：Next.js 14, React, Tailwind CSS
-   **後端 & 資料庫**：Supabase
-   **網頁爬蟲**：Playwright (公主連結), Puppeteer (蔚藍檔案)
-   **AI 模型**：Ollama (`gemma3:4b` 模型，本地運行)
-   **日期處理**：`date-fns`

## 安裝與設定

1.  **進入專案目錄**：
    ```bash
    cd game-news
    ```

2.  **安裝依賴**：
    ```bash
    npm install
    ```

3.  **設定環境變數**：
    在 `game-news` 專案根目錄創建 `.env.local` 文件，並填入您的 Supabase 連接資訊及 Ollama 主機位址：
    ```
    NEXT_PUBLIC_SUPABASE_URL=你的_SUPABASE_URL
    NEXT_PUBLIC_SUPABASE_ANON_KEY=你的_SUPABASE_ANON_KEY
    OLLAMA_HOST=http://localhost:11434
    ```

4.  **下載並運行 Ollama 模型**：
    確保您的 Ollama 服務已在本地啟動，然後在終端機執行以下指令來下載模型：
    ```bash
    ollama pull gemma3:4b
    ```

5.  **啟動開發伺服器**：
    ```bash
    npm run dev
    ```
    現在可以通過 `http://localhost:3000` 訪問網站。

## 可用腳本

**請注意：所有腳本都必須在 `game-news` 目錄下執行。**

-   `npm run dev`：啟動前端開發伺服器。
-   `npm run build`：建置生產環境的應用程式。
-   `npm run start`：啟動生產模式伺服器。
-   `npm run crawl:pcr`：執行 **公主連結** 的爬蟲任務。**此指令會先清空相關資料表。**
-   `npm run crawl:bluearchive`：執行 **蔚藍檔案** 的爬蟲任務。**此指令會先清空該文章的舊記錄。**
-   `npm run check:db`：一個快速檢查 `blue_archive_news` 資料表內容的工具。

## 爬蟲模組詳解

本專案針對不同遊戲的官網結構和內容特性，採用了兩種不同的爬蟲策略。

### 公主連結 (`/src/lib/crawler.ts`)

-   **技術**：使用 **Playwright** 搭配 TypeScript。
-   **目標網站**：[公主連結官網新聞頁](https://www.princessconnect.so-net.tw/news)
-   **執行流程**：
    1.  **清空資料庫**：執行前，腳本會清空 `news` 和 `updates` 兩個資料表。
    2.  **遍歷列表**：從新聞列表第一頁開始，逐頁爬取公告的標題、連結和日期。
    3.  **時間範圍**：為了效率，爬蟲只處理**最近一個月內**的公告，遇到更早的公告即停止。
    4.  **內容過濾**：
        -   使用關鍵字 (`EXCLUDED_KEYWORDS`) 過濾掉非關鍵公告（如停權名單、維護完成）。
        -   根據標題關鍵字 (`INCLUDED_CATEGORIES`) 將公告分為**活動** (`news` 資料表) 和**更新** (`updates` 資料表)。
    5.  **深入爬取**：進入每個有效公告的頁面，爬取完整內文和圖片。
    6.  **AI 分析**：將標題和內文傳送給 Ollama (`gemma3:4b`)，生成摘要並提取**活動開始/結束時間**。
    7.  **儲存**：將結構化後的資料存入對應的 Supabase 資料表中，並透過 URL 防止重複寫入。

### 蔚藍檔案 (`/scripts/run-bluearchive-crawler.js`)

-   **技術**：使用 **Puppeteer**。
-   **目標網站**：[Nexon 官方論壇](https://forum.nexon.com/bluearchiveTW) (目前腳本內硬編碼特定文章 URL 以供分析)
-   **執行流程**：
    1.  **清空舊記錄**：執行前，腳本會根據硬編碼的 `thread_id` 刪除 `blue_archive_news` 資料表中對應的舊記錄，方便重複測試。
    2.  **鎖定單一文章**：啟動 Puppeteer 前往指定的公告頁面。
    3.  **智慧分段**：此爬蟲的核心特色。它會讀取整篇文章的內文，並透過 `splitContentBySections` 函式，依據文章中的標題（如 `[標題]` 或 `1. 標題`）將一篇長公告智慧地**分割成數個獨立的段落**。
    4.  **逐段分析**：
        -   針對每一個小段落，獨立呼叫 Ollama (`gemma3:4b`)。
        -   AI 會對該段落進行**分類** (共10類，如 `招募活動`、`活動劇情` 等)、**撰寫摘要**、**提取時間**和**辨識相關角色**。
        -   如果 AI 分析失敗，會啟用一個基於關鍵字的備用分類邏輯。
    5.  **儲存**：每個經過分析的段落都會作為**一筆獨立的記錄**儲存到 `blue_archive_news` 資料表中。這種做法能將一篇混合多種活動的長篇公告，拆解成結構清晰的資料。

## 資料庫結構

本專案在 Supabase 中為每個遊戲使用獨立的資料表。

### `news` & `updates` (公主連結)

儲存公主連結的活動與更新資訊，主要欄位包含：`title`, `content`, `url`, `image_url`, `date`, `category`, `summary`, `start_date`, `end_date`。

### `blue_archive_news` (蔚藍檔案)

儲存蔚藍檔案的結構化新聞資訊，主要欄位包含：

-   `id`: `int8` (主鍵)
-   `title`: `text` (標題)
-   `content`: `text` (爬取到的原始內文)
-   `summary`: `text` (由 AI 生成的簡短摘要)
-   `category`: `text` (AI分析的10大分類，如 `招募活動`, `活動劇情` 等)
-   `character_names`: `_text` (陣列格式，儲存相關角色名稱)
-   `start_date`, `end_date`: `timestamptz` (活動開始/結束時間)
-   `image_url`: `text` (新聞相關圖片連結)
-   `original_url`: `text` (原始公告連結)
-   `thread_id`: `text` (用於識別同一篇文章，方便更新)
-   `created_at`: `timestamptz` (建立時間)

## 注意事項

-   執行爬蟲腳本前，請務必確保本地的 Ollama 服務正在運行，且 `gemma3:4b` 模型已成功下載。
-   請遵守目標網站的使用條款和爬蟲政策，建議設定合理的爬蟲頻率，避免對其伺服器造成過大負擔。
-   本專案僅供學習和技術研究使用。 