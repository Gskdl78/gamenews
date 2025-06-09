import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('date', { ascending: false })

    if (error) {
      console.error('Error fetching news:', error)
      return NextResponse.json(
        { error: '獲取新聞失敗' },
        { status: 500 }
      )
    }

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error in GET /api/news:', error)
    return NextResponse.json(
      { error: '獲取新聞失敗' },
      { status: 500 }
    )
  }
} 