'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'

interface Update {
  id: number
  title: string
  content: string
  url: string
  image_url: string
  date: string
  type: string
  summary: string
  created_at: string
  updated_at: string
}

export default function UpdateNews() {
  const [updates, setUpdates] = useState<Update[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchUpdates()
  }, [])

  async function fetchUpdates() {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('updates')
        .select('*')
        .order('date', { ascending: false })

      if (error) throw error

      setUpdates(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : '載入更新資訊時發生錯誤')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  // 將摘要內容格式化為結構化資訊
  function formatSummary(summary: string): string[] {
    return summary
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('好的，'))
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center">遊戲更新資訊</h1>
      <div className="max-w-4xl mx-auto space-y-8">
        {updates.map((update) => (
          <div key={update.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-500 text-sm">
                  {format(new Date(update.date), 'yyyy年MM月dd日', { locale: zhTW })}
                </span>
                <span className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                  {update.type}
                </span>
              </div>
              
              <h2 className="text-xl font-bold mb-4 text-gray-800">
                {update.title}
              </h2>

              {update.image_url && (
                <div className="relative h-64 mb-6">
                  <img
                    src={update.image_url}
                    alt={update.title}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}

              <div className="prose max-w-none">
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  {formatSummary(update.summary).map((point, index) => (
                    <div key={index} className="flex items-start">
                      {point.startsWith('**') ? (
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                          {point.replace(/\*\*/g, '')}
                        </h3>
                      ) : (
                        <div className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          <p className="text-gray-600">{point}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {updates.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          目前沒有更新資訊
        </div>
      )}
    </div>
  )
} 