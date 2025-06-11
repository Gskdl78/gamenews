// 用於公主連結的 News 表
export interface PcrNews {
  id?: string;
  title: string;
  content: string;
  url: string;
  date: string;
  category: string;
  summary: string;
  created_at?: string;
  updated_at?: string;
  start_date: string | null;
  end_date: string | null;
  image_url: string | null;
  type: 'news' | 'updates';
} 