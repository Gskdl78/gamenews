export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  order_index: number
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  title: string
  content: string
  category_id: string
  author_id: string
  is_pinned: boolean
  view_count: number
  created_at: string
  updated_at: string
  category?: Category
  author?: UserProfile
  comment_count?: number
}

export interface Comment {
  id: string
  content: string
  post_id: string
  author_id: string
  parent_id: string | null
  created_at: string
  updated_at: string
  author?: UserProfile
  replies?: Comment[]
}

export interface UserProfile {
  id: string
  username: string
  avatar_url: string | null
  bio: string | null
  created_at: string
  updated_at: string
}

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