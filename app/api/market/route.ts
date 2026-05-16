import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { generateDailyContent, generateMarketBrief } from '@/lib/generator'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

export const maxDuration = 60

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const nowKST = toZonedTime(new Date(), 'Asia/Seoul')
    const todayStr = format(nowKST, 'yyyy-MM-dd')

    const { data: existingLesson } = await supabaseAdmin
      .from('daily_lessons')
      .select('id')
      .eq('date', todayStr)
      .single()

    const { data: existingBrief } = await supabaseAdmin
      .from('market_briefs')
      .select('id')
      .eq('date', todayStr)
      .single()

    if (existingLesson && existingBrief) {
      return NextResponse.json({ message: '오늘 레슨이 이미 생성됨', date: todayStr })
    }

    const { count } = await supabaseAdmin
      .from('daily_lessons')
      .select('*', { count: 'exact', head: true })
    const dayNumber = (count ?? 0) + (existingLesson ? 0 : 1)

    if (!existingLesson) {
      console.log(`[Cron] 레슨 생성 시작 — Day ${dayNumber}, ${todayStr}`)
      const lessonData = await generateDailyContent(dayNumber, todayStr)
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
    }

    if (!existingBrief) {
      console.log(`[Cron] 브리핑 생성 시작 — ${todayStr}`)
      const briefData = await generateMarketBrief(todayStr)
      const { error: briefError } = await supabaseAdmin
        .from('market_briefs')
        .insert({ date: todayStr, ...briefData })
      if (briefError) throw briefError
    }

    return NextResponse.json({
      success: true,
      day: dayNumber,
      date: todayStr,
    })

  } catch (err) {
    console.error('[Cron] 에러:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}