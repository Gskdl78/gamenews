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

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// 導出類型
export type { User, Session } from '@supabase/supabase-js'

export async function getNews(filter: {
  type: 'latest' | 'upcoming' | 'ending_soon' | 'historical' | 'ongoing' | 'updates' | 'by_category';
  category?: '活動' | '轉蛋' | '戰隊戰';
  limit?: number;
}): Promise<NewsItem[]> {
  const now = new Date();
  let query = supabase.from('news').select('*');

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
        // Handle case where by_category is used without a category
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
    console.error(`Error fetching news for filter ${JSON.stringify(filter)}:`, error);
    return [];
  }

  return data as NewsItem[];
} 

// 蔚藍檔案專用的新聞獲取函數
export async function getBlueArchiveNews(filter: {
  type: 'latest' | 'upcoming' | 'ending_soon' | 'historical' | 'ongoing' | 'updates' | 'by_category';
  category?: '招募' | '活動' | '考試' | '大決戰' | '總力戰' | '更新' | '轉蛋' | '戰隊戰';
  limit?: number;
}): Promise<NewsItem[]> {
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
        // Handle case where by_category is used without a category
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
    console.error(`Error fetching Blue Archive news for filter ${JSON.stringify(filter)}:`, error);
    return [];
  }

  return data as NewsItem[];
} 

// 公主連結專用的新聞獲取函數
export async function getPrincessConnectNews(filter: {
  type?: 'latest' | 'upcoming' | 'ending_soon' | 'historical' | 'ongoing' | 'updates' | 'by_category';
  category?:  '活動' | '轉蛋' | '更新' | '戰隊戰';
  limit?: number;
} = {}): Promise<NewsItem[]> {
  const now = new Date();
  let query = supabase.from('news').select('*');

  // Add category filter if provided
  if (filter.category) {
    query = query.eq('category', filter.category);
  }

  // Apply type-based filters and sorting
  const filterType = filter.type || 'latest';
  switch (filterType) {
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
    console.error(`Error fetching Princess Connect news:`, error);
    return [];
  }

  return data as NewsItem[];
} 