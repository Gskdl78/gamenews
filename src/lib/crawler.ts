import { chromium } from 'playwright'
import { supabase } from './supabase'
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

// 新增：獨立的資料庫清除函數
export async function clearDatabase() {
  console.log('開始清除資料庫...')
  
  // 使用 .not('id', 'is', null) 來安全地刪除所有行
  const { error: newsError } = await supabase.from('news').delete().not('id', 'is', null)
  if (newsError) {
    console.error('清除 news 資料表失敗:', newsError)
    throw newsError
  }
  
  const { error: updatesError } = await supabase.from('updates').delete().not('id', 'is', null)
  if (updatesError) {
    console.error('清除 updates 資料表失敗:', updatesError)
    throw updatesError
  }

  console.log('資料庫清除成功')
}

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

    // 統一使用 'article.news-detail-article' 選擇器
    const newsDetail = await page.evaluate(() => {
      const article = document.querySelector('article.news-detail-article');
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

// 清理過期的活動新聞
async function cleanupExpiredNews() {
  try {
    console.log('開始清理過期的活動新聞...')
    const { data: news } = await supabase
      .from('news')
      .select('*')

    if (!news) return

    for (const item of news) {
      if (isEventEnded(item.summary)) {
        console.log(`刪除過期活動: ${item.title}`)
        await supabase.from('news').delete().eq('id', item.id)
      }
    }
    console.log('清理完成')
  } catch (error) {
    console.error('清理過期活動時發生錯誤:', error)
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
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36'
  })
  const page = await context.newPage()

  try {
    // 清除資料庫
    await clearDatabase()
    console.log('資料庫已清除，開始爬取新聞...')

    // 設定一個月前的日期作為爬取範圍
    const oneMonthAgo = subMonths(new Date(), 1)
    console.log(`設定爬取範圍：從 ${oneMonthAgo.toISOString()} 到現在`)

    let pageNum = 1
    let totalUpdateNews = 0
    let totalEventNews = 0

    while (true) {
      try {
        // 構建頁面 URL
        const pageUrl = pageNum === 1 ? PCR_NEWS_URL : `${PCR_NEWS_URL}?page=${pageNum}`
        console.log(`訪問頁面: ${pageUrl}`)

        await page.goto(pageUrl, { waitUntil: 'networkidle' })
        await waitForSelectorWithRetry(page, '.news_con')

        const newsItems = await page.evaluate(() => {
          const items = Array.from(document.querySelectorAll('.news_con dd a'))
          return items
            .map(item => {
              const dt = item.closest('dd')?.previousElementSibling
              const dateMatch = dt?.textContent?.match(/(\d{4}\.\d{2}\.\d{2})/)
              const dateText = dateMatch ? dateMatch[1].replace(/\./g, '-') : ''

              const url = item.getAttribute('href') || ''
              return {
                title: item.textContent?.trim() || '',
                url: url.startsWith('http') ? url : `https://www.princessconnect.so-net.tw${url}`,
                date: dateText
              }
            })
            .filter(item => item.url && item.title && item.date)
        })

        if (!newsItems.length) {
          console.log(`第 ${pageNum} 頁沒有找到新聞項目，停止爬取。`)
          break
        }

        let updateNewsCount = 0
        let eventNewsCount = 0
        let foundOldNews = false

        for (const item of newsItems) {
          try {
            // 檢查日期是否在一個月內
            const newsDate = parse(item.date, 'yyyy-MM-dd', new Date())
            if (!isValid(newsDate) || isBefore(newsDate, oneMonthAgo)) {
              console.log(`找到早於一個月的公告 (${item.date})，停止爬取: ${item.title}`)
              foundOldNews = true
              break
            }

            // 跳過不需要的新聞
            if (shouldExcludeTitle(item.title)) continue

            // 修正：完善分類邏輯
            const isEvent = isValidCategory(item.title)
            const type = isEvent ? 'news' : 'updates'

            // 檢查新聞是否已存在
            const needsUpdate = await shouldUpdateNews(item.url, type)

            if (!needsUpdate) {
              console.log(`跳過已存在的新聞: ${item.title}`)
              continue
            }

            if (isEvent) {
              eventNewsCount++
              totalEventNews++
              await processEventNews(item, page)
            } else {
              updateNewsCount++
              totalUpdateNews++
              await processUpdateNews(item, page)
            }
          } catch (error) {
            console.error('處理單條新聞時發生錯誤:', error)
            continue
          }
        }

        console.log(
          `第 ${pageNum} 頁找到 ${newsItems.length} 條新聞，其中更新新聞 ${updateNewsCount} 條，活動新聞 ${eventNewsCount} 條`
        )

        if (foundOldNews) {
          console.log('找到超過一個月的新聞，爬取結束。')
          break
        }

        pageNum++
      } catch (error) {
        console.error(`處理第 ${pageNum} 頁時發生錯誤:`, error)
        break
      }
    }

    // 不再清理過期新聞，以保留歷史紀錄
    // await cleanupExpiredNews();

    console.log(`爬蟲完成！總共找到 ${totalUpdateNews} 條更新新聞，${totalEventNews} 條活動新聞`)
  } catch (error) {
    console.error('爬取新聞時發生錯誤:', error)
    throw error
  } finally {
    await browser.close()
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