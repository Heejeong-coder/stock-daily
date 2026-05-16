import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  // 날짜 파라미터 없으면 오늘 (KST 기준)
  const dateParam = searchParams.get('date')
  const dateStr = dateParam ?? format(toZonedTime(new Date(), 'Asia/Seoul'), 'yyyy-MM-dd')

  const [lessonRes, briefRes] = await Promise.all([
    supabase
      .from('daily_lessons')
      .select('*')
      .eq('date', dateStr)
      .single(),
    supabase
      .from('market_briefs')
      .select('*')
      .eq('date', dateStr)
      .single(),
  ])

  if (lessonRes.error && lessonRes.error.code !== 'PGRST116') {
    return NextResponse.json({ error: lessonRes.error.message }, { status: 500 })
  }

  return NextResponse.json({
    lesson: lessonRes.data ?? null,
    brief: briefRes.data ?? null,
    date: dateStr,
  })
}
