import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'
import yahooFinance from 'yahoo-finance2'

async function getRealTimeMarketData() {
  try {
    const symbols = ['^KS11', 'KRW=X', '005930.KS', '000660.KS', '000270.KS']
    const results = await Promise.all(
      symbols.map(s => yahooFinance.quote(s).catch(() => null))
    )

    const kospi = results[0]
    const usdkrw = results[1]
    const samsung = results[2]
    const hynix = results[3]
    const kia = results[4]

    return {
      kospi_price: kospi?.regularMarketPrice?.toLocaleString() ?? '-',
      kospi_change: kospi?.regularMarketChangePercent?.toFixed(2) ?? '-',
      usdkrw: usdkrw?.regularMarketPrice?.toFixed(0) ?? '-',
      samsung_price: samsung?.regularMarketPrice?.toLocaleString() ?? '-',
      samsung_change: samsung?.regularMarketChangePercent?.toFixed(2) ?? '-',
      hynix_price: hynix?.regularMarketPrice?.toLocaleString() ?? '-',
      hynix_change: hynix?.regularMarketChangePercent?.toFixed(2) ?? '-',
      kia_price: kia?.regularMarketPrice?.toLocaleString() ?? '-',
      kia_change: kia?.regularMarketChangePercent?.toFixed(2) ?? '-',
    }
  } catch {
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