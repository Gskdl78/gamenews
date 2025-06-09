import { crawlNews, clearDatabase } from '../lib/crawler'

async function main() {
  try {
    console.log('\n=== 開始執行爬蟲 ===')
    console.log('執行時間:', new Date().toLocaleString())
    
    await clearDatabase();
    await crawlNews()
    
    console.log('\n=== 爬蟲執行完成 ===')
    console.log('完成時間:', new Date().toLocaleString())
  } catch (error) {
    console.error('\n=== 爬蟲執行失敗 ===')
    console.error('錯誤時間:', new Date().toLocaleString())
    console.error('錯誤詳情:', error)
    
    // 如果是 playwright 相關錯誤，輸出更多信息
    if (error instanceof Error) {
      console.error('錯誤名稱:', error.name)
      console.error('錯誤信息:', error.message)
      console.error('錯誤堆棧:', error.stack)
    }
  }
}

console.log('爬蟲腳本已啟動')
console.log('系統時間:', new Date().toLocaleString())

// 執行一次
main() 