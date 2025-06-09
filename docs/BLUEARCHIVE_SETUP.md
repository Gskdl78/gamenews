# 蔚藍檔案爬蟲設置指南

## 📋 概述

此系統為蔚藍檔案官方論壇的自動化新聞爬蟲，結合 Ollama AI 進行內容分析和分類。

## 🏗️ 資料庫設置

### 1. 在 Supabase 中執行 SQL 腳本

```sql
-- 在 Supabase SQL Editor 中執行以下腳本
-- 位置：scripts/create-bluearchive-table.sql
```

### 2. 驗證資料表創建

在 Supabase Dashboard 中確認以下項目已創建：
- ✅ `blue_archive_news` 資料表
- ✅ 相關索引
- ✅ RLS 政策
- ✅ 觸發器

## 🤖 Ollama 設置

### 1. 安裝 Ollama

```bash
# Windows (下載安裝檔)
# 從 https://ollama.ai 下載並安裝

# 驗證安裝
ollama --version
```

### 2. 下載模型

```bash
# 下載 Llama 3.2 模型 (推薦)
ollama pull llama3.2

# 或使用其他模型
ollama pull llama3.1
ollama pull mistral
```

### 3. 啟動 Ollama 服務

```bash
# 啟動 Ollama (預設 port 11434)
ollama serve
```

## 🚀 運行爬蟲

### 1. 安裝依賴

```bash
cd game-news
npm install
```

### 2. 網站結構測試

```bash
# 先測試目標網站結構
npm run test-website
```

### 3. 執行爬蟲

```bash
# 運行蔚藍檔案爬蟲
npm run crawl-bluearchive
```

## 📊 爬蟲流程

### 1. 網站分析
- 爬取論壇列表頁面
- 提取所有更新日誌連結
- 檢查是否已存在於資料庫

### 2. 內容提取
- 訪問每篇文章詳細頁面
- 提取標題、日期、內容
- 獲取論壇討論串ID

### 3. AI 分析
- 使用 Ollama 分析內容
- 自動分類：更新、招募、活動、考試、大決戰、總力戰
- 提取時間資訊、角色名稱、活動摘要

### 4. 資料庫儲存
- 防重複檢查
- 結構化儲存分析結果
- 自動建立索引

## 🎯 分類規則

### 自動分類邏輯
```javascript
{
  "更新": "遊戲版本更新、錯誤修正、功能調整",
  "招募": "新角色招募、招募池相關",
  "活動": "主要活動、活動劇情、迷你活動",
  "考試": "綜合戰術考試",
  "大決戰": "大決戰相關",
  "總力戰": "總力戰相關"
}
```

### 提取資訊
- ✅ **開始/結束時間**：自動解析活動時間
- ✅ **角色名稱**：招募角色清單
- ✅ **活動摘要**：AI 生成的內容摘要
- ✅ **分類標籤**：主分類和子分類

## 🔧 故障排除

### Ollama 連接問題
```bash
# 檢查 Ollama 是否運行
curl http://localhost:11434/api/tags

# 重啟 Ollama
ollama serve
```

### Supabase 連接問題
- 檢查 `.env.local` 中的環境變數
- 確認 RLS 政策設置正確
- 驗證 API Key 權限

### 爬蟲異常
- 檢查網路連接
- 確認目標網站可訪問
- 查看瀏覽器控制台錯誤

## 📈 資料查詢範例

```sql
-- 查詢最新活動
SELECT * FROM blue_archive_news 
WHERE category = '活動' 
ORDER BY start_date DESC;

-- 查詢即將開始的活動
SELECT * FROM blue_archive_upcoming;

-- 查詢即將結束的活動
SELECT * FROM blue_archive_ending_soon;

-- 查詢目前進行中的活動
SELECT * FROM blue_archive_ongoing;
```

## 🔄 定期執行

可以使用 cron 或 Windows Task Scheduler 定期執行爬蟲：

```bash
# 每天執行一次 (Linux/Mac)
0 9 * * * cd /path/to/game-news && npm run crawl-bluearchive

# Windows 工作排程器
# 建立基本工作 -> 每天 -> 執行程式
# 程式: npm
# 引數: run crawl-bluearchive
# 起始於: /path/to/game-news
```

## 📝 注意事項

1. **請求頻率**：爬蟲設有延遲避免過度請求
2. **資料完整性**：定期檢查資料庫資料一致性
3. **模型更新**：定期更新 Ollama 模型以提升準確度
4. **備份資料**：定期備份 Supabase 資料 