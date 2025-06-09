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

// 用於蔚藍檔案的 blue_archive_news 表
export interface BlueArchiveNews {
    id?: number;
    title: string;
    content?: string;
    summary?: string;
    date: string | Date;
    start_date: string | Date | null;
    end_date: string | Date | null;
    category: string;
    sub_category?: string;
    character_names?: string[];
    original_url: string;
    thread_id: string;
    image_url: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  link: string;
  published_at: string; // ISO 8601 format
  category: '活動' | '轉蛋' | '更新' | '維護' | '其他' | '戰隊戰';
}

export type GameSlug = 'princess-connect' | 'blue-archive'; 