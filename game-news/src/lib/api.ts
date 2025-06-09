export interface NewsItem {
  id: string;
  title: string;
  content: string;
  category: string;
  created_at: string;
  updated_at: string;
  image_url?: string;
  type?: 'news' | 'update';
  start_date: string | null;
  end_date: string | null;
}

interface NewsParams {
  type: string;
  category?: string;
  page?: number;
  limit?: number;
}

export async function getBlueArchiveNews({
  type,
  category = 'all',
  page = 1,
  limit = 10
}: NewsParams): Promise<NewsItem[]> {
  // 模擬資料
  const mockData: NewsItem[] = Array.from({ length: limit }, (_, i) => ({
    id: `${page}-${i}`,
    title: `${category} ${type} ${i + 1}`,
    content: '活動內容...',
    category,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    type: 'news',
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  }));

  return mockData;
} 