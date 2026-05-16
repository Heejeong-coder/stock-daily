import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateDailyContent, generateMarketBrief } from '@/lib/generator'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

export const maxDuration = 60 // 60초 타임아웃

export async function GET(req: NextRequest) {
  // 보안 — CRON_SECRET 검증
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 한국 시간 기준 오늘 날짜
    const nowKST = toZonedTime(new Date(), 'Asia/Seoul')
    const todayStr = format(nowKST, 'yyyy-MM-dd')

    // 이미 오늘 레슨이 있으면 스킵
    const { data: existing } = await supabaseAdmin
      .from('daily_lessons')
      .select('id')
      .eq('date', todayStr)
      .single()

    if (existing) {
      return NextResponse.json({ message: '오늘 레슨이 이미 생성됨', date: todayStr })
    }

    // 누적 Day 번호 계산
    const { count } = await supabaseAdmin
      .from('daily_lessons')
      .select('*', { count: 'exact', head: true })
    const dayNumber = (count ?? 0) + 1

    console.log(`[Cron] 레슨 생성 시작 — Day ${dayNumber}, ${todayStr}`)

    // 1. 레슨 콘텐츠 생성
    const lessonData = await generateDailyContent(dayNumber, todayStr)

    // 2. 시장 브리핑 생성
    const briefData = await generateMarketBrief(todayStr)

    // 3. DB 저장
    const { error: lessonError } = await supabaseAdmin
      .from('daily_lessons')
      .insert({
        date: todayStr,
        day_number: dayNumber,
        topic: lessonData.topic,
        category: lessonData.category,
        title: lessonData.title,
        intro: lessonData.intro,
        content: lessonData.content,
        key_point: lessonData.key_point,
        market_context: lessonData.market_context,
        quiz: lessonData.quiz,
      })

    if (lessonError) throw lessonError

    const { error: briefError } = await supabaseAdmin
      .from('market_briefs')
      .insert({
        date: todayStr,
        ...briefData,
      })

    if (briefError) throw briefError

    console.log(`[Cron] 완료 — Day ${dayNumber} 생성 성공`)

    return NextResponse.json({
      success: true,
      day: dayNumber,
      date: todayStr,
      topic: lessonData.topic,
    })

  } catch (err) {
    console.error('[Cron] 에러:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
