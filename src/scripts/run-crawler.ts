import { crawlNews } from '../lib/crawler'

async function main() {
  try {
    console.log('開始執行爬蟲腳本...')
    await crawlNews()
    console.log('爬蟲腳本執行完畢。')
  } catch (error) {
    console.error('執行爬蟲腳本時發生錯誤:', error)
    // 如果是 playwright 相關錯誤，輸出更多信息
    if (error instanceof Error && error.message.includes('playwright')) {
        console.error("Playwright 相關錯誤，請檢查瀏覽器是否正確安裝或路徑是否正確。")
    }
    process.exit(1)
  }
}

main() 