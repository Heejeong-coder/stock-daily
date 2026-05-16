import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

async function getRealTimeMarketData() {
  try {
    const yf = (await import('yahoo-finance2')).default
    const symbols = ['^KS11', 'KRW=X', '005930.KS', '000660.KS', '000270.KS']
    const results = await Promise.allSettled(symbols.map(s => yf.quote(s)))

    const v = (i: number, key: string): string => {
      const r = results[i]
      if (r.status !== 'fulfilled') return '-'
      const val = (r.value as any)[key]
      return val != null ? String(val) : '-'
    }

    return {
      kospi_price: v(0, 'regularMarketPrice'),
      kospi_change: v(0, 'regularMarketChangePercent'),
      usdkrw: v(1, 'regularMarketPrice'),
      samsung_price: v(2, 'regularMarketPrice'),
      samsung_change: v(2, 'regularMarketChangePercent'),
      hynix_price: v(3, 'regularMarketPrice'),
      hynix_change: v(3, 'regularMarketChangePercent'),
      kia_price: v(4, 'regularMarketPrice'),
      kia_change: v(4, 'regularMarketChangePercent'),
    }
  } catch (e) {
    console.error('Yahoo Finance 에러:', e)
    return null
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const dateParam = searchParams.get('date')
  const dateStr = dateParam ?? format(toZonedTime(new Date(), 'Asia/Seoul'), 'yyyy-MM-dd')

  const [lessonRes, briefRes, marketData] = await Promise.all([
    supabase.from('daily_lessons').select('*').eq('date', dateStr).single(),
    supabase.from('market_briefs').select('*').eq('date', dateStr).single(),
    getRealTimeMarketData(),
  ])

  return NextResponse.json({
    lesson: lessonRes.data ?? null,
    brief: briefRes.data ?? null,
    date: dateStr,
    realtime: marketData,
  })
}