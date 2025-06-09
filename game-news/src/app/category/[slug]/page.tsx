import { Metadata } from 'next'
import { supabase } from '@/lib/supabase'
import { Category, Post } from '@/types/index'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'

interface Props {
  params: {
    slug: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await getCategory(params.slug)
  
  if (!category) {
    return {
      title: '找不到分類 - 公主連結 Re:Dive 討論區'
    }
  }

  return {
    title: `${category.name} - 公主連結 Re:Dive 討論區`,
    description: category.description || undefined
  }
}

async function getCategory(slug: string): Promise<Category | null> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    console.error('Error fetching category:', error)
    return null
  }

  return data
}

async function getPosts(categoryId: string): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      category:categories(*),
      author:user_profiles(*),
      comment_count:comments(count)
    `)
    .eq('category_id', categoryId)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching posts:', error)
    return []
  }

  return data.map((post: any) => ({
    ...post,
    comment_count: post.comment_count?.[0]?.count || 0
  }))
}

export default async function CategoryPage({ params }: Props) {
  const category = await getCategory(params.slug)
  
  if (!category) {
    notFound()
  }

  const posts = await getPosts(category.id)

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/" className="text-blue-600 hover:underline mb-4 inline-block">
          ← 返回首頁
        </Link>
        {category.description && (
          <p className="text-gray-600 mt-2">{category.description}</p>
        )}
      </div>

      <div className="mb-6">
        <Link
          href={`/category/${category.slug}/new`}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          發表新文章
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow">
        {posts.map((post, index) => (
          <div
            key={post.id}
            className={`p-4 ${
              index !== posts.length - 1 ? 'border-b border-gray-200' : ''
            }`}
          >
            <div className="flex items-center gap-4">
              {post.is_pinned && (
                <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                  置頂
                </span>
              )}
              <Link
                href={`/post/${post.id}`}
                className="text-lg font-medium hover:text-blue-600"
              >
                {post.title}
              </Link>
            </div>
            <div className="mt-2 text-sm text-gray-600 flex items-center gap-4">
              <span>
                作者：
                {post.author?.username || '未知用戶'}
              </span>
              <span>
                發表於：
                {format(new Date(post.created_at), 'yyyy-MM-dd HH:mm')}
              </span>
              <span>
                回覆：{post.comment_count}
              </span>
              <span>
                瀏覽：{post.view_count}
              </span>
            </div>
          </div>
        ))}

        {posts.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            目前還沒有文章，來發表第一篇吧！
          </div>
        )}
      </div>
    </main>
  )
} 