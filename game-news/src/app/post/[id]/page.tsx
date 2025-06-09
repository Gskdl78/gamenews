import { Metadata } from 'next'
import { supabase } from '@/lib/supabase'
import { Post, Comment } from '@/types'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'

interface Props {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost(params.id)
  
  if (!post) {
    return {
      title: '找不到文章 - 公主連結 Re:Dive 討論區'
    }
  }

  return {
    title: `${post.title} - 公主連結 Re:Dive 討論區`,
    description: post.content.substring(0, 160)
  }
}

async function getPost(id: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      category:categories(*),
      author:user_profiles(*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching post:', error)
    return null
  }

  return data
}

async function getComments(postId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      author:user_profiles(*)
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching comments:', error)
    return []
  }

  return data
}

async function incrementViewCount(postId: string): Promise<void> {
  const { error } = await supabase.rpc('increment_view_count', {
    post_id: postId
  })

  if (error) {
    console.error('Error incrementing view count:', error)
  }
}

export default async function PostPage({ params }: Props) {
  const post = await getPost(params.id)
  
  if (!post) {
    notFound()
  }

  const comments = await getComments(params.id)
  await incrementViewCount(params.id)

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link
          href={`/category/${post.category?.slug}`}
          className="text-blue-600 hover:underline mb-4 inline-block"
        >
          ← 返回 {post.category?.name}
        </Link>
        
        <article className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
          
          <div className="mb-4 text-sm text-gray-600 flex items-center gap-4">
            <span>
              作者：{post.author?.username || '未知用戶'}
            </span>
            <span>
              發表於：{format(new Date(post.created_at), 'yyyy-MM-dd HH:mm')}
            </span>
            <span>
              瀏覽：{post.view_count + 1}
            </span>
          </div>
          
          <div className="prose max-w-none">
            {post.content.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-4">
                {paragraph}
              </p>
            ))}
          </div>
        </article>
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">回覆 ({comments.length})</h2>
        
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-white rounded-lg shadow p-4">
              <div className="mb-2 text-sm text-gray-600 flex items-center gap-4">
                <span>
                  {comment.author?.username || '未知用戶'}
                </span>
                <span>
                  {format(new Date(comment.created_at), 'yyyy-MM-dd HH:mm')}
                </span>
              </div>
              <div className="prose max-w-none">
                {comment.content.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-2">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          ))}

          {comments.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              目前還沒有回覆，來發表第一篇回覆吧！
            </div>
          )}
        </div>
      </div>
    </main>
  )
} 