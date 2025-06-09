import { Ollama } from 'ollama';
import * as dotenv from 'dotenv';
import { join } from 'path';

// 手動加載 .env.local
dotenv.config({ path: join(process.cwd(), '.env.local') });

// 從環境變數讀取 Ollama API 的基礎 URL，如果未設定則使用預設值
const OLLAMA_API_BASE_URL = process.env.OLLAMA_API_BASE_URL || 'http://localhost:11434';

// 建立並匯出 Ollama 實例
export const ollama = new Ollama({ host: OLLAMA_API_BASE_URL });

/**
 * 使用 Ollama 模型生成內容摘要。
 * @param title - 新聞標題。
 * @param content - 新聞的純文字內容。
 * @returns - 返回由 AI 生成的摘要字串。
 */
export async function summarizeContent(title: string, content: string): Promise<string> {
  try {
    console.log('\n=== 開始生成摘要 ===')
    console.log('標題:', title)
    console.log('內容長度:', content.length)
    console.log('內容預覽:', content.substring(0, 100) + '...')

    const prompt = `
      你是一個遊戲公告分析專家。請根據以下提供的公告標題和內容，嚴格按照下面的格式提取並回傳資訊，不要包含任何多餘的說明文字、開頭或結尾、以及任何 Markdown 符號 (例如 **)。

      回傳格式範例：
      1. 活動名稱：(活動的官方名稱)
      2. 活動開始時間：(YYYY/MM/DD HH:mm 格式，如果沒有請留空)
      3. 活動結束時間：(YYYY/MM/DD HH:mm 格式，如果沒有請留空)
      4. 活動摘要：(一段簡潔的活動內容摘要，請不要在摘要中提及任何日期或時間)
      ---
      
      公告標題：${title}
      公告內容：${content}
    `

    console.log('\n正在呼叫 Ollama API...')
    const response = await ollama.chat({
      model: 'gemma3:4b',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    console.log('\n摘要生成完成！')
    
    // 清理最終輸出，移除可能殘留的 markdown
    const cleanedContent = response.message.content.replace(/\*\*/g, '')
    
    console.log('摘要內容:', cleanedContent)
    return cleanedContent
  } catch (error) {
    console.error('\nOllama 處理失敗:', error)
    return '無法生成摘要'
  }
} 