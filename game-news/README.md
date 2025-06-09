# 遊戲快報 - 電玩快報

基於 Next.js 的遊戲資訊網站，參考 Interface In Game 的設計風格。

## 功能特色

- 🎮 遊戲展示滑動卡片
- 📰 最新文章和攻略
- 🎨 Interface In Game 風格設計
- 📱 響應式設計
- 🎥 首頁背景影片支援
- 🎥 **全新背景影片功能** (Interface In Game 風格)

## 背景影片功能

### 文件結構
將影片文件放置在 `public` 目錄中：

```
public/
├── 首頁影片.mp4              # 主要背景影片
├── 公連背景.jpg             # 影片封面/背景圖片  
├── pcr-logo.png             # 遊戲 Logo
└── *.svg                    # 其他圖標文件
```

### 功能特點

1. **自動載入**: 當影片進入可見區域時自動載入
2. **懶載入**: 優化初始頁面載入速度
3. **封面圖片**: 使用公連背景.jpg作為載入前的封面
4. **自動播放**: 支援自動播放（靜音模式）
5. **平滑漸變**: 載入完成後平滑過渡

### 影片規格建議

#### 主要影片 (`首頁影片.mp4`)
- 當前文件大小: 35MB
- 建議解析度: 1920x1080
- 格式: MP4 (H.264)
- 時長: 循環播放
- **建議優化**: 可壓縮至 < 10MB 以提升載入速度

### 影片優化指令

使用 FFmpeg 優化您的首頁影片：

```bash
# 壓縮首頁影片（保持高質量）
ffmpeg -i "首頁影片.mp4" -vcodec libx264 -crf 28 -preset slow -vf scale=1920:1080 -movflags +faststart "首頁影片_優化.mp4"

# 進一步壓縮（如果需要更小文件）
ffmpeg -i "首頁影片.mp4" -vcodec libx264 -crf 32 -preset slow -vf scale=1280:720 -movflags +faststart "首頁影片_小.mp4"
```

## 技術棧

- **框架**: Next.js 14
- **樣式**: Tailwind CSS + Custom CSS
- **圖標**: React Icons
- **語言**: TypeScript

## 開始使用

### 安裝依賴
```bash
cd game-news
npm install
```

### 開發環境
```bash
npm run dev
```

### 構建生產版本
```bash
npm run build
npm start
```

## 🎥 背景影片設置指南

### 1. 影片檔案放置
將影片檔案放在 `public` 目錄下：
```
public/
├── hero-video.mp4     # 主要格式
├── hero-video.webm    # WebM 格式 (更好的壓縮)
└── hero-video-mobile.mp4  # 行動版本 (可選)
```

### 2. 影片優化建議

#### **檔案格式**
- **WebM**: 現代瀏覽器，最佳壓縮比
- **MP4 (H.264)**: 通用格式，兼容性最好

#### **規格建議**
- **解析度**: 1920x1080 (桌面) / 1280x720 (行動)
- **檔案大小**: < 5MB (理想 < 3MB)
- **長度**: 15-30 秒循環
- **幀率**: 24-30 FPS

#### **壓縮設定**
```bash
# 使用 FFmpeg 壓縮影片
ffmpeg -i input.mp4 -c:v libx264 -crf 28 -preset medium -c:a aac -b:a 128k -movflags +faststart hero-video.mp4

# 轉換為 WebM
ffmpeg -i input.mp4 -c:v libvpx-vp9 -crf 30 -b:v 1M -c:a libopus hero-video.webm
```

### 3. 性能優化

#### **預載入策略**
```html
<link rel="preload" href="/hero-video.webm" as="video" type="video/webm">
```

#### **響應式載入**
```javascript
// 根據網路速度決定是否載入影片
if (navigator.connection?.effectiveType === '4g') {
  // 載入高品質影片
} else {
  // 載入靜態背景圖片
}
```

#### **懶載入實作**
```javascript
// 使用 Intersection Observer
const videoRef = useRef(null);

useEffect(() => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const video = entry.target;
        video.play();
      }
    });
  });

  if (videoRef.current) {
    observer.observe(videoRef.current);
  }

  return () => observer.disconnect();
}, []);
```

### 4. 替代方案

#### **CDN 服務** (適合大型影片)
- **Cloudinary**: 自動優化和格式轉換
- **AWS S3 + CloudFront**: 全球分發
- **Vercel Blob**: 與 Vercel 部署整合

#### **動態載入** (適合多個影片)
```javascript
// API 路由返回影片 URL
const { data: videoUrl } = useSWR('/api/hero-video', fetcher);
```

### 5. 監控和分析

#### **Core Web Vitals 監控**
- **LCP**: 確保影片不影響最大內容繪製
- **CLS**: 避免影片載入時的版面位移
- **FID**: 保持互動性

#### **效能測試工具**
- Lighthouse
- WebPageTest
- Google PageSpeed Insights

## 最佳實踐建議

### ✅ 推薦做法
1. **小檔案本地放置** (< 5MB)
2. **提供多種格式** (WebM + MP4)
3. **設置 fallback 背景圖**
4. **使用適當的壓縮**
5. **監控載入效能**

### ❌ 避免做法
1. 超大影片檔案 (> 10MB)
2. 沒有靜音屬性
3. 沒有 fallback 方案
4. 忽略行動裝置優化
5. 沒有效能監控

## 目錄結構

```
game-news/
├── src/
│   ├── app/
│   │   ├── page.tsx          # 首頁
│   │   ├── layout.tsx        # 主佈局
│   │   ├── globals.css       # 全域樣式
│   │   └── games/
│   │       └── [slug]/
│   └── components/           # 共用組件
├── public/
│   ├── pcr-logo.png         # 公連 Logo
│   ├── 公連背景.jpg          # 背景圖片
│   └── hero-video.mp4       # 背景影片
└── README.md
``` 