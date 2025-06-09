import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { join } from 'path'
import { NewsItem } from '@/types/news'

// 加載環境變數
dotenv.config({ path: join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// 導出類型
export type { User, Session } from '@supabase/supabase-js'

/**
 * 獲取蔚藍檔案的新聞
 * @param category - 可選的新聞分類
 * @param limit - 回傳的數量上限
 */
export async function getBlueArchiveNews({
  category,
  limit = 10,
}: {
  category?: '活動' | '更新' | '招募' | '考試' | '大決戰' | '總力戰';
  limit?: number;
}): Promise<NewsItem[]> {
  let query = supabase.from('blue_archive_news').select('*');

  if (category) {
    query = query.eq('category', category);
  }

  query = query.order('date', { ascending: false }).limit(limit);

  const { data, error } = await query;

  if (error) {
    console.error(`Error fetching Blue Archive news for category ${category}:`, error);
    return [];
  }

  return data as NewsItem[];
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