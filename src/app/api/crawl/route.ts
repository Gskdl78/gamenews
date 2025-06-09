import { NextResponse } from 'next/server'
import { crawlNews, clearDatabase } from '@/lib/crawler'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    await clearDatabase()
    await crawlNews()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('爬蟲執行失敗:', error)
    return NextResponse.json(
      { error: '爬蟲執行失敗' },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    await clearDatabase()
    await crawlNews()
    return NextResponse.json({ message: '爬蟲執行成功' })
  } catch (error) {
    console.error('爬蟲執行失敗:', error)
    return NextResponse.json({ error: '爬蟲執行失敗' }, { status: 500 })
  }
}

// 清除資料庫內容
export async function DELETE() {
  try {
    await clearDatabase()
    return NextResponse.json({ message: '資料庫清除成功' })
  } catch (error) {
    console.error('清除資料庫失敗:', error)
    return NextResponse.json(
      { 
        error: '清除資料庫失敗', 
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    )
  }
} 