import { chromium } from 'playwright'
import * as fs from 'fs'
import * as path from 'path'

async function checkStructure() {
  console.log('\n=== 開始執行網站結構檢查 ===\n')
  console.log('開始檢查網站結構...')
  
  const browser = await chromium.launch({
    headless: true
  })
  
  try {
    console.log('正在啟動瀏覽器...')
    const page = await browser.newPage()
    console.log('瀏覽器已啟動')
    
    const url = 'https://www.princessconnect.so-net.tw/news'
    console.log('正在訪問網頁:', url)
    
    const response = await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30000
    })
    
    console.log('頁面狀態碼:', response?.status())
    console.log('頁面載入完成')
    
    console.log('等待 30 秒以便觀察頁面結構...')
    await page.waitForTimeout(30000)
    
    console.log('正在保存頁面截圖...')
    await page.screenshot({ path: 'page.png' })
    
    console.log('正在分析頁面結構...')
    
    // 保存完整的 HTML
    const html = await page.content()
    fs.writeFileSync('page.html', html)
    
    console.log('\n=== 頁面結構分析結果 ===\n')
    
    // 檢查可能的新聞容器
    const containers = [
      '.news_list',
      '.news-list',
      '.newsList',
      '.news_content',
      '.news-content',
      '#news-list',
      '#newsList',
      'article',
      '.article',
      '.news-item',
      '.newsItem',
      '.news_con',
      '.news_con a',
      '.news_con article',
      '.news_con div'
    ]
    
    console.log('1. 可能的新聞容器:')
    for (const selector of containers) {
      const count = await page.evaluate((sel) => document.querySelectorAll(sel).length, selector)
      console.log(`${selector}: ${count > 0 ? '存在' : '不存在'} (數量: ${count})`)
      
      if (count > 0) {
        // 輸出第一個元素的內容
        const content = await page.evaluate((sel) => {
          const el = document.querySelector(sel)
          return el ? {
            text: el.textContent?.trim(),
            html: el.innerHTML,
            classes: Array.from(el.classList),
            attributes: Array.from(el.attributes).map(attr => `${attr.name}="${attr.value}"`)
          } : null
        }, selector)
        
        console.log(`\n${selector} 的第一個元素:`)
        console.log('文本:', content?.text)
        console.log('HTML:', content?.html)
        console.log('類名:', content?.classes)
        console.log('屬性:', content?.attributes)
        console.log()
      }
    }
    
    // 獲取所有的 class 名稱
    const classes = await page.evaluate(() => {
      const elements = Array.from(document.getElementsByTagName('*'))
      const classes = new Set<string>()
      elements.forEach(el => {
        el.classList.forEach(className => classes.add(className))
      })
      return Array.from(classes)
    })
    
    console.log('\n2. 頁面所有的 class 名稱:')
    console.log(classes.join(', '))
    
    // 輸出頁面結構
    console.log('\n3. 頁面 HTML 片段:')
    const bodyHtml = await page.evaluate(() => document.body.innerHTML)
    console.log(bodyHtml.substring(0, 1000))
    
  } catch (error) {
    console.error('檢查失敗:', error)
  } finally {
    console.log('\n正在關閉瀏覽器...')
    await browser.close()
    console.log('檢查完成\n')
  }
}

checkStructure() 