import { crawlNews } from '../lib/crawler'
import { CronJob } from 'cron'

// 每天凌晨 4 點執行爬蟲
const job = new CronJob(
  '0 4 * * *',
  async function() {
    console.log('開始執行定時爬蟲任務...')
    try {
      await crawlNews()
      console.log('定時爬蟲任務完成')
    } catch (error) {
      console.error('定時爬蟲任務失敗:', error)
    }
  },
  null,
  false,
  'Asia/Taipei'
)

// 立即執行一次
console.log('執行初始爬蟲...')
crawlNews().catch(error => {
  console.error('初始爬蟲失敗:', error)
})

// 啟動定時任務
job.start()
console.log('定時爬蟲任務已啟動，將於每天凌晨 4 點執行') 