export interface News {
  id: string
  title: string
  content: string
  url: string
  date: string
  category: string
  summary: string
  created_at: string
  updated_at: string
}

export interface NewsLink {
  id: string;
  title: string;
  link: string;
  published_at: string; // ISO 8601 format
  category: '活動' | '轉蛋' | '更新' | '維護' | '其他' | '戰隊戰';
} 