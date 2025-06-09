import { Metadata } from 'next'
import { supabase } from '@/lib/supabase'
import { Category } from '@/types'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import NewPostForm from './NewPostForm'

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
    title: `發表新文章 - ${category.name} - 公主連結 Re:Dive 討論區`,
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

export default async function NewPostPage({ params }: Props) {
  const category = await getCategory(params.slug)
  
  if (!category) {
    notFound()
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Link
          href={`/category/${category.slug}`}
          className="text-blue-600 hover:underline mb-4 inline-block"
        >
          ← 返回 {category.name}
        </Link>
        <h1 className="text-3xl font-bold">發表新文章</h1>
      </div>

      <div className="max-w-2xl">
        <NewPostForm category={category} />
      </div>
    </main>
  )
} 