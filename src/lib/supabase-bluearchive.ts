import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { join } from 'path'

// 加載環境變數
dotenv.config({ path: join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// 蔚藍檔案新聞項目類型
export interface BlueArchiveNewsItem {
  id?: number;
  title: string;
  content?: string;
  summary?: string;
  date?: string;
  start_date?: string;
  end_date?: string;
  category?: '更新' | '招募' | '活動' | '考試' | '大決戰' | '總力戰' | '其他';
  sub_category?: string;
  character_names?: string[];
  original_url?: string;
  thread_id?: string;
  created_at?: string;
  updated_at?: string;
}

export async function getBlueArchiveNews(filter: {
  type: 'latest' | 'upcoming' | 'ending_soon' | 'historical' | 'ongoing' | 'updates' | 'by_category';
  category?: '更新' | '招募' | '活動' | '考試' | '大決戰' | '總力戰' | '其他';
  limit?: number;
}): Promise<BlueArchiveNewsItem[]> {
  const now = new Date();
  let query = supabase.from('blue_archive_news').select('*');

  // Add category filter if provided
  if (filter.category) {
    query = query.eq('category', filter.category);
  }

  // Apply type-based filters and sorting
  switch (filter.type) {
    case 'latest':
      query = query
        .or(`end_date.is.null,end_date.gt.${now.toISOString()}`)
        .order('date', { ascending: false });
      break;
    case 'upcoming':
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      query = query
        .gt('start_date', now.toISOString())
        .lte('start_date', tomorrow.toISOString())
        .order('start_date', { ascending: true });
      break;
    case 'ending_soon':
      const threeDaysLater = new Date(now);
      threeDaysLater.setDate(now.getDate() + 3);
      query = query
        .gt('end_date', now.toISOString())
        .lte('end_date', threeDaysLater.toISOString())
        .order('end_date', { ascending: true });
      break;
    case 'historical':
      query = query
        .lt('end_date', now.toISOString())
        .order('end_date', { ascending: false });
      break;
    case 'ongoing':
      query = query
        .lte('start_date', now.toISOString())
        .or(`end_date.is.null,end_date.gt.${now.toISOString()}`)
        .order('date', { ascending: false });
      break;
    case 'updates':
       query = query.eq('category', '更新').order('date', { ascending: false });
       break;
    case 'by_category':
      if (filter.category) {
        query = query.eq('category', filter.category).order('date', { ascending: false });
      } else {
        query = query.order('date', { ascending: false });
      }
      break;
  }

  // Apply limit if provided
  if (filter.limit) {
    query = query.limit(filter.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error(`Error fetching blue archive news for filter ${JSON.stringify(filter)}:`, error);
    return [];
  }

  return data as BlueArchiveNewsItem[];
}

// 插入新聞項目
export async function insertBlueArchiveNews(newsItem: Omit<BlueArchiveNewsItem, 'id' | 'created_at' | 'updated_at'>): Promise<BlueArchiveNewsItem | null> {
  const { data, error } = await supabase
    .from('blue_archive_news')
    .insert([newsItem])
    .select()
    .single();

  if (error) {
    console.error('Error inserting blue archive news:', error);
    return null;
  }

  return data as BlueArchiveNewsItem;
}

// 更新新聞項目
export async function updateBlueArchiveNews(id: number, updates: Partial<BlueArchiveNewsItem>): Promise<BlueArchiveNewsItem | null> {
  const { data, error } = await supabase
    .from('blue_archive_news')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating blue archive news:', error);
    return null;
  }

  return data as BlueArchiveNewsItem;
}

// 檢查是否已存在相同的討論串
export async function checkExistingThread(threadId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('blue_archive_news')
    .select('id')
    .eq('thread_id', threadId)
    .limit(1);

  if (error) {
    console.error('Error checking existing thread:', error);
    return false;
  }

  return data && data.length > 0;
} 