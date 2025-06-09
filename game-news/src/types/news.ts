export interface NewsItem {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  summary: string;
  created_at: string;
  updated_at: string;
  category: string;
  type: 'news' | 'update';
  start_date: string | null;
  end_date: string | null;
} 