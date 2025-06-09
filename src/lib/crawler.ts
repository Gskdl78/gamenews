import { chromium } from 'playwright'
import { supabase, checkIfNewsExistsByUrl } from './supabase'
import { summarizeContent } from './ollama'
import { subMonths, subDays, parseISO, isAfter, isBefore, parse, isValid } from 'date-fns'
import { chunk } from 'lodash'

const PCR_NEWS_URL = 'https://www.princessconnect.so-net.tw/news'

// 更新類型關鍵字
const UPDATE_KEYWORDS = [
  '更新',
  '實裝',
  '追加',
  '新增',
  '裝備',
  '角色'
]

// 不需要的新聞類型關鍵字
const EXCLUDED_KEYWORDS = [
  '停權',
  '維護完成',
  '維護預告',
  '更新完成',
  '異常',
  '問題',
  '補償',
  '道具',
  '修正',
  '禁止',
  '規範',
  '聲明'
]

// 需要的活動類型
const INCLUDED_CATEGORIES = [
  '活動',
  '轉蛋',
  '戰隊',
  '競賽'
]

// 檢查是否為更新相關新聞
function isUpdateNews(title: string): boolean {
  return UPDATE_KEYWORDS.some(keyword => title.includes(keyword))
}

// 檢查標題是否包含需要排除的關鍵字
function shouldExcludeTitle(title: string): boolean {
  return EXCLUDED_KEYWORDS.some(keyword => title.includes(keyword))
}

// 檢查分類是否是我們需要的
function isValidCategory(category: string): boolean {
  return INCLUDED_CATEGORIES.some(validCategory => category.includes(validCategory))
}

function determineCategory(title: string): string {
  if (title.includes('【更新】') || title.includes('【優惠】')) return '更新';
  if (title.includes('戰隊')) return '戰隊戰';
  if (title.includes('轉蛋')) return '轉蛋';
  return '活動';
}

// 從 Ollama 的摘要中提取活動時間
function extractEventDatesFromSummary(summary: string): { startDate: Date | null; endDate: Date | null } {
  const result = {
    startDate: null as Date | null,
    endDate: null as Date | null,
  };

  const startDateMatch = summary.match(/活動開始時間：\s*(\d{4})\/(\d{2})\/(\d{2})\s*(\d{2}):(\d{2})/);
  if (startDateMatch) {
    const [, year, month, day, hour, minute] = startDateMatch;
    const date = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(minute)
    );
    if (isValid(date)) {
      result.startDate = date;
    }
  }

  const endDateMatch = summary.match(/活動結束時間：\s*(\d{4})\/(\d{2})\/(\d{2})\s*(\d{2}):(\d{2})/);
  if (endDateMatch) {
    const [, year, month, day, hour, minute] = endDateMatch;
    const date = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(minute)
    );
    if (isValid(date)) {
      result.endDate = date;
    }
  }
  
  return result;
}

// 檢查活動是否已結束
function isEventEnded(summary: string): boolean {
  // 如果摘要不存在或為空，無法判斷，假設活動仍在進行
  if (!summary) return false;
  
  const { endDate } = extractEventDatesFromSummary(summary)
  if (!endDate) return false // 如果找不到結束時間，假設活動還在進行中
  return isBefore(endDate, new Date())
}

// 檢查新聞是否需要更新
async function shouldUpdateNews(url: string, type: 'news' | 'updates'): Promise<boolean> {
  const table = type === 'news' ? 'news' : 'updates'
  const { data: existing } = await supabase
    .from(table)
    .select('url')
    .eq('url', url)
    .single()

  return !existing // 如果新聞不存在，需要新增；如果已存在，不需要更新
}

// 儲存更新資訊
async function saveUpdateNews(item: any, content: string, summary: string, imageUrl: string) {
  try {
    const { startDate, endDate } = extractEventDatesFromSummary(summary)

    const newsData = {
      title: item.title,
      content,
      url: item.url,
      image_url: imageUrl,
      date: new Date(item.date).toISOString(),
      category: determineCategory(item.title),
      type: 'update',
      summary,
      start_date: startDate?.toISOString() || null,
      end_date: endDate?.toISOString() || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const { error } = await supabase.from('updates').insert(newsData)

    if (error) {
      if (error.code === '23505' && error.message.includes('updates_url_key')) {
        console.log(`更新新聞已存在，跳過: ${item.title}`)
      } else {
        throw error
      }
    }

  } catch (error) {
    console.error('儲存更新資訊時發生錯誤:', error)
    throw error
  }
}

// 儲存活動新聞
async function saveEventNews(item: any, content: string, summary: string, imageUrl: string) {
  try {
    const { startDate, endDate } = extractEventDatesFromSummary(summary)
    const category = determineCategory(item.title);

    const newsData = {
      title: item.title,
      content,
      url: item.url,
      image_url: imageUrl,
      date: new Date(item.date).toISOString(), // 轉換為 ISO 字串
      category: category,
      type: 'news',
      summary,
      start_date: startDate?.toISOString() || null,
      end_date: endDate?.toISOString() || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // 直接插入新資料
    const { error } = await supabase.from('news').insert(newsData)

    if (error) {
      if (error.code === '23505' && error.message.includes('news_url_key')) {
        console.log(`活動新聞已存在，跳過: ${item.title}`)
      } else {
        throw error
      }
    }
    
  } catch (error) {
    console.error('儲存活動新聞時發生錯誤:', error)
    throw error
  }
}

// 統一處理所有新聞項目
async function processNewsItem(item: any, page: any, type: 'news' | 'updates') {
  try {
    console.log(`正在處理 ${type === 'news' ? '活動' : '更新'} 新聞: ${item.title}`);
    await page.goto(item.url, { waitUntil: 'networkidle', timeout: 60000 });

    // 將選擇器從 'article.news-detail-article' 改為 'article.news_con'
    const newsDetail = await page.evaluate(() => {
      const article = document.querySelector('article.news_con');
      if (!article) return { content: '', imageUrl: '' };
      
      const img = article.querySelector('img');
      return {
        content: article.textContent?.trim() || '',
        imageUrl: img ? img.src : ''
      };
    });

    if (!newsDetail.content) {
      console.log(`跳過：內容為空 - ${item.title}`);
      return;
    }
    
    console.log(`=== 開始生成摘要 ===`);
    console.log(`標題: ${item.title}`);
    console.log(`內容長度: ${newsDetail.content.length}`);
    console.log(`內容預覽: ${newsDetail.content.substring(0, 50)}...`);
    console.log();
    console.log(`正在呼叫 Ollama API...`);

    const summary = await summarizeContent(item.title, newsDetail.content);
    
    console.log('摘要生成完成！');
    console.log(`摘要內容: ${summary}`);

    if (type === 'news') {
      await saveEventNews(item, newsDetail.content, summary, newsDetail.imageUrl);
    } else {
      await saveUpdateNews(item, newsDetail.content, summary, newsDetail.imageUrl);
    }
  } catch (error) {
    console.error(`處理新聞時發生錯誤: ${item.title}`, error);
    throw new Error(`處理單條新聞時發生錯誤: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// 處理更新新聞
async function processUpdateNews(item: any, page: any) {
  try {
    console.log(`處理更新新聞: ${item.title}`);
    await page.goto(item.url, { waitUntil: 'networkidle' });

    const content = await page.evaluate(() => {
      const article = document.querySelector('article.news-detail-article');
      return article ? article.textContent || '' : '';
    });

    const imageUrl = await page.evaluate(() => {
      const img = document.querySelector('article.news-detail-article img');
      return img ? (img as HTMLImageElement).src : '';
    });

    const summary = await summarizeContent(item.title, content);

    await saveUpdateNews(item, content, summary, imageUrl);

  } catch (error) {
    console.error('處理更新新聞時發生錯誤:', item.title, error);
    throw error;
  }
}

// 處理活動新聞
async function processEventNews(item: any, page: any) {
  try {
    console.log('處理活動新聞:', item.title)

    if (!item.url) {
      console.log('跳過：URL 為空')
      return
    }

    // 獲取新聞內容和圖片
    console.log('獲取活動新聞詳細內容:', item.url)
    await page.goto(item.url, {
      waitUntil: 'networkidle',
      timeout: 60000
    })
    // 還原: 等待活動頁面正確的選擇器
    await waitForSelectorWithRetry(page, '.news_con')
    
    // 獲取內容和圖片
    const { content, imageUrl } = await page.evaluate(() => {
      // 還原: 使用活動頁面正確的選擇器
      const contentEl = document.querySelector('.news_con')
      if (!contentEl) return { content: '', imageUrl: '' }
      
      // 尋找圖片
      const img = contentEl.querySelector('img')
      const imageUrl = img ? img.src : ''
      
      // 獲取文章內容
      return {
        content: contentEl.textContent?.trim() || '',
        imageUrl
      }
    })

    if (!content) {
      console.log('跳過：內容為空')
      return
    }

    // 修正：必須先生成摘要，才能從中提取日期
    const summary = await summarizeContent(item.title, content);

    // 不再此處檢查活動是否結束，確保所有新聞都先存入資料庫
    
    // 儲存到資料庫
    await saveEventNews(item, content, summary, imageUrl);
  } catch (error) {
    console.error(`處理活動新聞時發生錯誤: ${item.title}`, error);
    // 重新拋出錯誤，讓上層的 try-catch 捕獲
    throw new Error(`處理單條新聞時發生錯誤: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Playwright 相關操作的重試函數
async function waitForSelectorWithRetry(page: any, selector: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await page.waitForSelector(selector, { timeout: 10000 });
      return;
    } catch (error) {
      console.log(`等待選擇器 ${selector} 第 ${i + 1} 次失敗，重試中...`);
      if (i === maxRetries - 1) throw error;
    }
  }
}

async function clickWithRetry(page: any, selector: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await page.click(selector, { timeout: 5000 });
      return;
    } catch (error) {
      console.log(`點擊選擇器 ${selector} 第 ${i + 1} 次失敗，重試中...`);
      if (i === maxRetries - 1) throw error;
    }
  }
}

export async function crawlNews() {
  console.log('爬蟲任務開始...')
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  try {
    let currentPage = 1
    let shouldContinue = true

    while (shouldContinue) {
      const url = `${PCR_NEWS_URL}?page=${currentPage}`
      console.log(`正在導覽至: ${url}`)
      await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
      console.log(`頁面 ${currentPage} 載入成功`)

      const newsOnPage = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('article.news_con dl dd'))
        return items.map(dd => {
          const dt = dd.previousElementSibling
          if (!dt) return null

          const link = dd.querySelector('a')
          const categorySpan = dt.querySelector('span')
          
          const url = link ? link.getAttribute('href') || '' : ''
          const title = link ? link.textContent?.trim() || '' : ''
          const dateMatch = dt.textContent?.match(/(\d{4})\.(\d{2})\.(\d{2})/)
          const date = dateMatch ? dateMatch.slice(1).join('-') : ''
          const category = categorySpan ? categorySpan.textContent?.trim() || '' : ''

          return {
            title,
            url: url.startsWith('http') ? url : `https://www.princessconnect.so-net.tw${url}`,
            date,
            category,
          }
        }).filter(item => item && item.url && item.title && item.date && item.category)
      })

      if (newsOnPage.length === 0) {
        console.log(`第 ${currentPage} 頁沒有找到新聞，停止爬取。`)
        shouldContinue = false
        continue
      }
      
      console.log(`第 ${currentPage} 頁共找到 ${newsOnPage.length} 則新聞，開始處理...`)

      for (const item of newsOnPage) {
        if (!item) continue;
        const exists = await checkIfNewsExistsByUrl(item.url);
        if (exists) {
          console.log(`發現已存在的公告: "${item.title}"。停止爬取。`);
          shouldContinue = false;
          break; // 中斷內部 for 迴圈
        }

        if (shouldExcludeTitle(item.title)) {
          console.log(`根據關鍵字排除新聞: ${item.title}`)
          continue
        }
        
        if (isUpdateNews(item.title)) {
          await processNewsItem(item, page, 'updates')
        } else if (isValidCategory(item.category)) {
          await processNewsItem(item, page, 'news')
        } else {
          console.log(`新聞分類不符或被排除，跳過: ${item.title} (分類: ${item.category})`)
        }
      }

      if (shouldContinue) {
        const nextPageButton = await page.$('div.paging a[title="下一頁"]');
        if (nextPageButton) {
          currentPage++;
        } else {
          console.log('沒有找到下一頁按鈕，爬取結束。');
          shouldContinue = false;
        }
      }
    }
    
    console.log('所有新聞處理完畢。')
    
    // await cleanupExpiredNews(); // 停用過期清理功能

  } catch (error) {
    console.error(`爬取新聞時發生致命錯誤:`, error)
    throw error
  } finally {
    await browser.close()
    console.log('瀏覽器已關閉，爬蟲任務結束。')
  }
}

async function main() {
  try {
    await crawlNews();
    console.log('爬蟲任務完成');
  } catch (error) {
    console.error('爬蟲主程序發生錯誤:', error);
  }
}

main();