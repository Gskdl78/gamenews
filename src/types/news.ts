export interface NewsItem {
  id: number;
  title: string;
  category: string;
  content: string;
  url: string;
  published_at: string;
  created_at: string;
  updated_at: string;
  start_date?: string;
  end_date?: string;
  image_url?: string;
  summary?: string;
} 