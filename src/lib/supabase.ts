import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { join } from 'path'
import { NewsItem } from '@/types/news'

// 加載環境變數
dotenv.config({ path: join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// 建立一個具有服務角色的 Supabase 客戶端 (可用於管理員操作)
export function getSupabaseAdmin() {
    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Supabase URL 或 Service Key 未設定。');
    }
    return createClient(supabaseUrl, supabaseServiceKey);
}

// 導出類型
export type { User, Session } from '@supabase/supabase-js'

/**
 * 獲取蔚藍檔案的新聞
 * @param category - 可選的新聞分類
 * @param limit - 回傳的數量上限
 */
export async function getBlueArchiveNews({ limit = 10 }: { limit?: number }): Promise<NewsItem[]> {
  const { data, error } = await supabase
    .from('blue_archive_news')
    .select('*')
    .order('start_date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching Blue Archive news:', error);
    return [];
  }

  // Manually map to ensure type compliance and handle category
  return data.map(item => ({
    ...item,
    id: item.id,
    title: item.title,
    content: item.content || '',
    summary: item.summary || '',
    category: item.sub_category || item.category, // Use sub_category for display, fallback to category
    url: item.original_url,
    published_at: item.created_at, // Align field
    start_date: item.start_date || undefined,
    end_date: item.end_date || undefined,
    image_url: item.image_url || undefined,
  }));
}

/**
 * 獲取公主連結的新聞
 * @param type - 'news' 代表綜合新聞, 'updates' 代表更新
 * @param limit - 回傳的數量上限
 */
export async function getPrincessConnectNews({ 
  type, 
  limit = 20
}: { 
  type: 'news' | 'updates'; 
  limit?: number;
}): Promise<NewsItem[]> {
  const tableName = type === 'news' ? 'news' : 'updates'
  
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .order('date', { ascending: false })
    .limit(limit)

  if (error) {
    console.error(`Error fetching princess connect ${type}:`, error)
    return []
  }

  return data as NewsItem[]
} 

/**
 * 檢查新聞是否已存在於資料庫中
 * @param url - 新聞的唯一 URL
 */
export async function checkIfNewsExistsByUrl(url: string, table: 'news' | 'updates'): Promise<boolean> {
  const { data, error } = await supabase
    .from(table)
    .select('url')
    .eq('url', url)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116: a single row was not returned
    console.error(`檢查 ${table} 表時出錯:`, error);
  }

  return !!data;
} 