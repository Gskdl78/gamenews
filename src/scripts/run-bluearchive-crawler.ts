import { chromium } from 'playwright-chromium';
import { supabase, getSupabaseAdmin } from '../lib/supabase';
import { ollama } from '../lib/ollama';
import type { Page } from 'playwright-chromium';
import type { BlueArchiveNews } from '../types';

// 使用 Supabase Admin Client 來操作資料庫，以繞過 RLS
const supabaseAdmin = getSupabaseAdmin();

const LOG_PREFIX = '🚀 [Blue Archive Crawler]';

/**
 * 檢查指定的 threadId 是否已存在於資料庫中。
 * @param threadId - 要檢查的 Nexon 論壇 thread ID。
 * @returns 如果 threadId 已存在，則返回 true，否則返回 false。
 */
async function checkExistingThread(threadId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('blue_archive_news')
    .select('id')
    .eq('thread_id', threadId)
    .limit(1);

  if (error) {
    console.error(`${LOG_PREFIX} 檢查 thread_id 時出錯:`, error);
    return false; // 發生錯誤時，假設不存在，讓流程繼續
  }
  return data.length > 0;
}

/**
 * 在 Node.js 環境中解析日期和時間字串。
 * @param dateStr - 日期字串 (例如 "6月10日")
 * @param timeStr - 時間字串 (例如 "上午10點", "下午1:00")
 * @returns - 解析後的 Date 物件，或 null。
 */
function parseDateInNode(dateStr: string, timeStr: string): Date | null {
    const currentYear = new Date().getFullYear();
    if (!dateStr || !timeStr) return null;

    const monthMatch = dateStr.match(/(\d+)月/);
    const dayMatch = dateStr.match(/(\d+)日/);
    const month = monthMatch ? parseInt(monthMatch[1], 10) - 1 : new Date().getMonth();
    const day = dayMatch ? parseInt(dayMatch[1], 10) : null;

    if (day === null) return null;

    let hour = 0, minute = 0;
    const timeMatch = timeStr.match(/(\d+):(\d+)/) || timeStr.match(/(\d+)點/);

    if (timeMatch) {
        hour = parseInt(timeMatch[1], 10);
        if (timeStr.includes('下午') && hour < 12) hour += 12;
        if (timeStr.includes('上午') && hour === 12) hour = 0; // 處理 "上午12點" 為 0 點
        if (timeMatch[2]) minute = parseInt(timeMatch[2], 10);
    }
    
    // 先建立一個基於本地時區的 Date 物件
    const localDate = new Date(currentYear, month, day, hour, minute);
    
    // 假設輸入的時間為台灣時間 (UTC+8)，我們需要從本地時間減去8小時來得到 UTC 時間
    const utcDate = new Date(localDate.getTime() - (8 * 60 * 60 * 1000));

    return utcDate;
}

/**
 * 從主更新公告頁面中解析出所有事件的日程表。
 * @param page - Playwright 的 Page 物件。
 * @returns 一個包含所有事件資訊的陣列。
 */
async function parseScheduleFromPage(page: Page): Promise<Omit<BlueArchiveNews, 'id' | 'content' | 'summary' | 'character_names' | 'image_url' | 'created_at' | 'updated_at'>[]> {
  console.log(`${LOG_PREFIX} 🦾 開始解析主日程表...`);

  type RawEvent = {
    dateRangeStr: string;
    type: string;
    content: string;
  };

  const rawEvents: RawEvent[] = await page.evaluate(() => {
    const scheduleTitleEl = Array.from(document.querySelectorAll('p, strong, span')).find(el => (el as HTMLElement).innerText.trim().includes('更新主要日程'));
    if (!scheduleTitleEl) {
      console.warn('⚠️ 在頁面中找不到「更新主要日程」標題。');
      return [];
    }
    
    let table: Element | null = null;
    let currentNode: Element | null = scheduleTitleEl;
    while(currentNode && !table) {
        let nextSibling = currentNode.nextElementSibling;
        while(nextSibling) {
            if (nextSibling.tagName === 'TABLE') {
                table = nextSibling;
                break;
            }
            nextSibling = nextSibling.nextElementSibling;
        }
        if (!table) {
            currentNode = currentNode.parentElement;
        }
    }

    if (!table || table.tagName !== 'TABLE') {
      console.warn('⚠️ 找不到日程表。');
      return [];
    }

    const events: RawEvent[] = [];
    const rows = table.querySelectorAll('tbody > tr');
    
    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length < 3) return;

      const dateRangeStr = cells[0].innerText.trim();
      const type = cells[1].innerText.trim();
      const content = cells[2].innerText.trim();
      
      if (!type || !content) return;

      events.push({ dateRangeStr, type, content });
    });
    return events;
  });

  const maintenanceEndTime = rawEvents.find(e => e.content.includes('定期維護開始'))
    ?.dateRangeStr.split('~').map((s: string) => s.trim())[0].trim() || null;

  const events: Omit<BlueArchiveNews, 'id' | 'content' | 'summary' | 'character_names' | 'image_url' | 'created_at' | 'updated_at'>[] = [];

  // Pass 2: Parse all events
  for (const rawEvent of rawEvents) {
    const { dateRangeStr, type, content } = rawEvent;

    // FIX: 過濾掉表格標題行
    if (type === '種類') continue;

    let startDate: Date | null = null, endDate: Date | null = null;
    const [startStr, endStr] = dateRangeStr.split('~').map((s: string) => s.trim());

    if (startStr && maintenanceEndTime) {
      startDate = parseDateInNode(startStr, maintenanceEndTime);
    }
    if (endStr && maintenanceEndTime) {
      endDate = parseDateInNode(endStr, maintenanceEndTime);
    }
    
    // 分類標準化
    let standardizedCategory = type;
    if (type.includes('活動劇情')) standardizedCategory = '活動';
    if (type.includes('特選招募')) standardizedCategory = '招募';

    const event: Omit<BlueArchiveNews, 'id' | 'content' | 'summary' | 'character_names' | 'image_url' | 'created_at' | 'updated_at'> = {
      title: content,
      date: startDate || new Date(),
      start_date: startDate,
      end_date: endDate,
      category: standardizedCategory, // 使用標準化後的分類
      sub_category: type, // 保留原始子分類
      original_url: '', // Will be filled later
      thread_id: '', // Will be filled later
    };
    
    events.push(event);
  }

  return events;
}

/**
 * 在正式解析前，驗證頁面是否包含必要的結構元素。
 * @param page - Playwright 的 Page 物件。
 * @returns 如果結構驗證通過，則返回 true，否則返回 false。
 */
async function validatePageStructure(page: Page): Promise<boolean> {
  console.log(`${LOG_PREFIX} 🧐 正在驗證頁面結構...`);
  const hasScheduleTitle = await page.evaluate(() => {
    return !!Array.from(document.querySelectorAll('p, strong, span')).find(el => (el as HTMLElement).innerText.trim().includes('更新主要日程'));
  });

  if (!hasScheduleTitle) {
    console.error(`${LOG_PREFIX} ❌ 結構驗證失敗：在頁面中找不到「更新主要日程」標題。`);
    return false;
  }

  const hasTable = await page.evaluate(() => {
    const scheduleTitleEl = Array.from(document.querySelectorAll('p, strong, span')).find(el => (el as HTMLElement).innerText.trim().includes('更新主要日程'));
    if (!scheduleTitleEl) return false;
    
    // 從標題元素開始，向後遍歷兄弟節點，直到找到 <table>
    let table: Element | null = null;
    let currentNode: Element | null = scheduleTitleEl;
    while(currentNode && !table) {
        // 如果當前節點本身不是 table，就找它的下一個兄弟節點
        let nextSibling = currentNode.nextElementSibling;
        while(nextSibling) {
            if (nextSibling.tagName === 'TABLE') {
                table = nextSibling;
                break;
            }
            nextSibling = nextSibling.nextElementSibling;
        }
        // 如果在當前層級找不到，就往上層找
        if (!table) {
            currentNode = currentNode.parentElement;
        }
    }
    return !!table && table.tagName === 'TABLE';
  });

  if (!hasTable) {
    console.error(`${LOG_PREFIX} ❌ 結構驗證失敗：在「更新主要日程」標題後找不到 <table> 元素。`);
    return false;
  }

  console.log(`${LOG_PREFIX} ✅ 頁面結構驗證通過。`);
  return true;
}

/**
 * 根據事件標題，在頁面中找到對應的詳細內容區塊。
 * @param page - Playwright 的 Page 物件。
 * @param eventTitle - 事件的標題。
 * @returns 包含事件詳細內容的 HTML 字串。
 */
async function findContentForEvent(page: Page, eventTitle: string): Promise<string> {
  const cleanTitle = eventTitle.replace(/\s+/g, '').replace('【', '').replace('】', '');

  return page.evaluate((title) => {
    const allElements = Array.from(document.querySelectorAll('p, strong, span, h1, h2, h3, b')); // FIX: 加入 'b' 標籤搜尋
    const startElement = allElements.find(el => (el as HTMLElement).innerText.replace(/\s+/g, '').includes(title));

    if (!startElement) return '';

    let content = '';
    // 從找到的元素的父級 <p> 開始，這樣更穩定
    let currentEl: Element | null = startElement.closest('p');

    if (!currentEl) return ''; // 如果沒有 <p> 父級，則返回空

    while (currentEl) {
      const elText = (currentEl as HTMLElement).innerText?.trim();
      const boldText = (currentEl.querySelector('b, strong') as HTMLElement)?.innerText?.trim();

      // 停止條件: 如果目前元素不是起始元素，且包含一個以數字開頭的粗體標題，就視為新章節
      if (currentEl !== startElement.closest('p') && boldText && /^\d+\.\s/.test(boldText)) {
        break;
      }
      
      if (currentEl.tagName === 'TABLE' || currentEl.querySelector('img')) {
          content += currentEl.outerHTML;
      } else {
          content += (currentEl as HTMLElement).innerText + '\n';
      }
      currentEl = currentEl.nextElementSibling;
    }
    return content;
  }, cleanTitle);
}

/**
 * 在頁面中尋找與事件標題最相關的圖片 URL。
 * 策略是找到標題元素，然後向上查找，檢查其前面的兄弟元素中是否包含圖片。
 * @param page Playwright 的 Page 物件。
 * @param eventTitle 事件的標題。
 * @returns 圖片的絕對 URL，如果找不到則返回 null。
 */
async function findImageForEvent(page: Page, eventTitle: string): Promise<string | null> {
  const cleanTitle = eventTitle.replace(/\s+/g, '').replace('【', '').replace('】', '');

  return page.evaluate((title) => {
    const allElements = Array.from(document.querySelectorAll('p, strong, span, h1, h2, h3, b'));
    const startElement = allElements.find(el => (el as HTMLElement).innerText.replace(/\s+/g, '').includes(title));

    if (!startElement) return null;

    // 從標題元素向上找到一個有意義的容器，最多上溯 5 層
    let currentElement: HTMLElement | null = startElement as HTMLElement;
    for (let i = 0; i < 5 && currentElement; i++) {
      let sibling = currentElement.previousElementSibling;
      while (sibling) {
        const img = sibling.querySelector('img');
        if (img && img.src) {
          // 將相對路徑轉換為絕對路徑
          return new URL(img.src, document.baseURI).href;
        }
        sibling = sibling.previousElementSibling;
      }
      currentElement = currentElement.parentElement;
    }

    return null;
  }, cleanTitle);
}

/**
 * 使用 Ollama AI 分析內容，生成摘要和提取角色名稱。
 * @param title - 公告標題。
 * @param content - 公告內容。
 * @param category - 公告類別。
 * @returns 包含摘要和角色名稱陣列的物件。
 */
async function analyzeSectionWithAI(
    title: string, 
    content: string, 
    category: string
): Promise<{ summary: string; character_names: string[] }> {
  const prompt = generateAIPrompt(title, content, category);

  try {
    const response = await ollama.generate({
      model: 'gemma3:4b', // FIX: 使用規則中指定的正確模型名稱
      prompt: prompt,
      format: 'json',
      stream: false,
    });
    const result = JSON.parse(response.response);
    return {
      summary: result.summary || '',
      character_names: result.character_names || [],
    };
  } catch (error) {
    console.error(`${LOG_PREFIX} AI 分析時發生錯誤:`, error);
    return { summary: 'AI 分析失敗', character_names: [] };
  }
}

/**
 * 根據類別生成不同的 AI 提示詞。
 */
function generateAIPrompt(title: string, content: string, category: string): string {
  let prompt_template = `你是一位專業的「蔚藍檔案」遊戲公告分析師。請基於以下公告內容，完成兩項任務：
1.  **生成摘要**：用繁體中文、條列式的方式，簡潔地總結公告的重點。
2.  **提取角色名稱**：如果公告中明確提到了任何學生的名字，將他們提取出來。如果沒有，返回空陣列。`;

  if (category.includes('總力戰') || category.includes('大決戰')) {
    prompt_template += `\n請特別關注並提取「頭目名稱」、「活動時間」和「主要獎勵」。`
  } else if (category.includes('招募')) {
    prompt_template += `\n請特別關注並提取「Pick Up 學生」、「招募期間」和「是否有免費招募」。`
  } else if (category.includes('活動')) {
    prompt_template += `\n請特別關注並提取「活動類型」（例如：劇情活動、登入獎勵等）、「活動時間」和「關鍵獎勵」。`
  }

  prompt_template += `

**公告類別**：${category}
**公告標題**：${title}
**公告內容**：
${content.substring(0, 2500)}

請嚴格按照以下 JSON 格式輸出，不要有任何額外的文字或解釋：
{
  "summary": "摘要內容",
  "character_names": ["角色1", "角色2"]
}`;
  return prompt_template;
}

/**
 * 將處理好的新聞項目插入到 Supabase 資料庫中。
 * @param newsItem - 要插入的新聞項目物件。
 */
async function insertNews(newsItem: Omit<BlueArchiveNews, 'id' | 'created_at' | 'updated_at'>) {
  console.log(`${LOG_PREFIX} 📬 準備寫入資料庫: ${newsItem.title}`);
  const { error } = await supabaseAdmin.from('blue_archive_news').insert(newsItem);

  if (error) {
    console.error(`${LOG_PREFIX} ❌ 寫入資料庫時出錯:`, error);
  }
}

/**
 * 清空 blue_archive_news 資料表以進行測試。
 */
async function clearBlueArchiveNewsTable() {
  console.log(`${LOG_PREFIX} 🗑️  正在清空 'blue_archive_news' 資料表...`);
  const { error } = await supabaseAdmin.from('blue_archive_news').delete().neq('id', 0); // neq id 0 是一個刪除所有資料的技巧
  if (error) {
    console.error(`${LOG_PREFIX} ❌ 清空資料表時發生錯誤:`, error);
  } else {
    console.log(`${LOG_PREFIX} ✅ 資料表已成功清空。`);
  }
}

/**
 * 主爬蟲函式。
 */
export async function crawlBlueArchive() {
  console.log(`${LOG_PREFIX} 🚀 爬蟲任務開始...`);

  // 無條件清空資料表
  await clearBlueArchiveNewsTable();

  let browser = null;
  try {
    browser = await chromium.launch({ 
      headless: false, // 改為 headful (有頭) 模式進行調試，以解決潛在的腳本衝突
      args: ['--disable-extensions'] 
    });
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    });
    const page = await context.newPage();

    const boardUrl = 'https://forum.nexon.com/bluearchiveTW/board_list?board=3352';
    await page.goto(boardUrl, { waitUntil: 'networkidle' });
    console.log(`${LOG_PREFIX} 🤖 正在導覽至看板頁面: ${boardUrl}`);

    try {
      // 點擊彈出視窗需要 JS
      await page.click('#nx-full-alert-close', { timeout: 5000 });
      console.log(`${LOG_PREFIX} ✅ 已關閉彈出視窗。`);
    } catch (e) {
      console.log(`${LOG_PREFIX} ℹ️ 未發現或無需處理彈出視窗。`);
    }

    const postSelector = 'div.link-area > a';
    await page.waitForSelector(postSelector, { timeout: 15000 });
    const firstPostUrl = await page.$eval(postSelector, el => (el as HTMLAnchorElement).href);

    const threadIdMatch = firstPostUrl.match(/thread=(\d+)/);
    const threadId = threadIdMatch ? threadIdMatch[1] : null;

    if (!threadId) {
      console.error(`${LOG_PREFIX} ❌ 找不到最新文章的 Thread ID，任務中止。`);
      return;
    }
    
    // 因為已經清空資料庫，這個檢查必定為 false，但保留邏輯的完整性
    if (await checkExistingThread(threadId)) {
      console.log(`${LOG_PREFIX} ✅ Thread ID ${threadId} 的新聞已存在，任務結束。`);
      return;
    }

    console.log(`${LOG_PREFIX} 🔗 找到新文章，Thread ID: ${threadId}。正在導覽至: ${firstPostUrl}`);
    await page.goto(firstPostUrl, { waitUntil: 'networkidle', timeout: 60000 });
    console.log(`${LOG_PREFIX} 📄 文章載入成功，準備開始解析內容...`);

    // 在解析前先驗證頁面結構
    if (!await validatePageStructure(page)) {
      console.error(`${LOG_PREFIX} 任務因頁面結構驗證失敗而中止。`);
      return;
    }

    const scheduledEvents = await parseScheduleFromPage(page);

    if (!scheduledEvents || scheduledEvents.length === 0) {
      console.error(`${LOG_PREFIX} ❌ 未能從主日程表中解析出任何事件。`);
      return;
    }

    console.log(`${LOG_PREFIX} ✅ 成功從主日程表解析出 ${scheduledEvents.length} 個事件.`);
    console.log(JSON.stringify(scheduledEvents, null, 2)); // 像舊版一樣印出解析結果

    for (const event of scheduledEvents) {
      if (event.title.includes('定期維護開始')) {
        console.log(`${LOG_PREFIX} ⏭️  跳過基礎事件: ${event.title}`);
        continue;
      }
      
      let searchTitle = event.title.replace(/\n/g, ' ');
      // FIX: 為「特選招募」分類設置特殊的搜尋關鍵字
      if (event.category === '特選招募') {
          searchTitle = '新學生介紹';
          console.log(`${LOG_PREFIX} ℹ️  為特選招募事件，將搜尋關鍵字改為 "${searchTitle}"`);
      }

      console.log(`${LOG_PREFIX} 🧐 正在尋找事件 "${searchTitle}" 的詳細內容...`);
      const content = await findContentForEvent(page, searchTitle);

      let summary = 'AI 分析失敗';
      let character_names: string[] = [];
      let imageUrl: string | null = null;

      if (content) {
        const aiResult = await analyzeSectionWithAI(event.title, content, event.category);
        summary = aiResult.summary;
        character_names = aiResult.character_names;
      }
      
      imageUrl = await findImageForEvent(page, searchTitle);
      if (imageUrl) {
        console.log(`${LOG_PREFIX} ✅ 找到事件 "${searchTitle}" 的圖片: ${imageUrl}`);
      }

      const newsItem: Omit<BlueArchiveNews, 'id' | 'created_at' | 'updated_at'> = {
        ...event,
        date: event.date instanceof Date ? event.date.toISOString() : event.date,
        start_date: event.start_date instanceof Date ? event.start_date.toISOString() : event.start_date,
        end_date: event.end_date instanceof Date ? event.end_date.toISOString() : event.end_date,
        content: content,
        summary: summary,
        character_names: character_names,
        image_url: imageUrl,
        original_url: firstPostUrl,
        thread_id: threadId,
      };
      
      await insertNews(newsItem);
      await new Promise(resolve => setTimeout(resolve, 1500)); // 避免對 AI 服務造成太大壓力
    }

    console.log(`${LOG_PREFIX} ✅ 所有事件處理完畢！`);

  } catch (error) {
    console.error(`${LOG_PREFIX} ❌ 爬取過程中發生嚴重錯誤:`, error);
  } finally {
    if (browser) {
      await browser.close();
      console.log(`${LOG_PREFIX} 🚪 瀏覽器已關閉。`);
    }
  }
}

// 如果此文件是直接執行的，則運行爬蟲
if (require.main === module) {
  crawlBlueArchive().catch(error => {
    console.error('❌ 執行蔚藍檔案爬蟲時發生未處理的錯誤:', error);
    process.exit(1);
  });
} 