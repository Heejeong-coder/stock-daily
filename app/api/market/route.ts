import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

async function getRealTimeMarketData() {
  try {
    const yahooFinance = (await import('yahoo-finance2')).default
    const symbols = ['^KS11', 'KRW=X', '005930.KS', '000660.KS', '000270.KS']
    const results = await Promise.allSettled(
      symbols.map(s => yahooFinance.quote(s))
    )

    function getPrice(i: number): number | null {
      const r = results[i]
      if (r.status === 'fulfilled') return (r.value as any).regularMarketPrice ?? null
      return null
    }
    function getChange(i: number): number | null {
      const r = results[i]
      if (r.status === 'fulfilled') return (r.value as any).regularMarketChangePercent ?? null
      return null
    }

    return {
      kospi_price: getPrice(0)?.toLocaleString() ?? '-',
      kospi_change: getChange(0)?.toFixed(2) ?? '-',
      usdkrw: getPrice(1)?.toFixed(0) ?? '-',
      samsung_price: getPrice(2)?.toLocaleString() ?? '-',
      samsung_change: getChange(2)?.toFixed(2) ?? '-',
      hynix_price: getPrice(3)?.toLocaleString() ?? '-',
      hynix_change: getChange(3)?.toFixed(2) ?? '-',
      kia_price: getPrice(4)?.toLocaleString() ?? '-',
      kia_change: getChange(4)?.toFixed(2) ?? '-',
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