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