import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

async function getRealTimeMarketData() {
  try {
    const yahooFinance = (await import('yahoo-finance2')).default
    const symbols = ['^KS11', 'KRW=X', '005930.KS', '000660.KS', '000270.KS']
    const results = await Promise.all(
      symbols.map(s => yahooFinance.quote(s).catch(() => null))
    )
    return {
      kospi_price: results[0]?.regularMarketPrice?.toLocaleString() ?? '-',
      kospi_change: results[0]?.regularMarketChangePercent?.toFixed(2) ?? '-',
      usdkrw: results[1]?.regularMarketPrice?.toFixed(0) ?? '-',
      samsung_price: results[2]?.regularMarketPrice?.toLocaleString() ?? '-',
      samsung_change: results[2]?.regularMarketChangePercent?.toFixed(2) ?? '-',
      hynix_price: results[3]?.regularMarketPrice?.toLocaleString() ?? '-',
      hynix_change: results[3]?.regularMarketChangePercent?.toFixed(2) ?? '-',
      kia_price: results[4]?.regularMarketPrice?.toLocaleString() ?? '-',
      kia_change: results[4]?.regularMarketChangePercent?.toFixed(2) ?? '-',
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