import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

async function getRealTimeMarketData() {
  try {
    const symbols = [
      '%5EKS11', '%5EIXIC', 'KRW%3DX',
      '005930.KS', '005935.KS', '000660.KS',
      '005380.KS', '004020.KS', '000270.KS',
    ]
    const fetches = symbols.map(s =>
      fetch(`https://query2.finance.yahoo.com/v8/finance/chart/${s}?interval=1d&range=1d`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
      }).then(r => r.json()).catch(() => null)
    )
    const results = await Promise.all(fetches)

    const getMeta = (i: number) => results[i]?.chart?.result?.[0]?.meta ?? null

    const fmt = (m: any): string => {
      if (!m?.regularMarketPrice) return '-'
      return m.regularMarketPrice.toLocaleString('ko-KR')
    }

    const chg = (m: any): string => {
      if (!m) return '-'
      const prev = m.chartPreviousClose ?? m.previousClose
      const curr = m.regularMarketPrice
      if (!prev || !curr) return '-'
      return ((curr - prev) / prev * 100).toFixed(2)
    }

    const metas = symbols.map((_, i) => getMeta(i))

    return {
      kospi_price: fmt(metas[0]),
      kospi_change: chg(metas[0]),
      nasdaq_price: fmt(metas[1]),
      nasdaq_change: chg(metas[1]),
      usdkrw: metas[2]?.regularMarketPrice?.toFixed(0) ?? '-',
      samsung_price: fmt(metas[3]),
      samsung_change: chg(metas[3]),
      samsung_p_price: fmt(metas[4]),
      samsung_p_change: chg(metas[4]),
      hynix_price: fmt(metas[5]),
      hynix_change: chg(metas[5]),
      hyundai_price: fmt(metas[6]),
      hyundai_change: chg(metas[6]),
      hsteel_price: fmt(metas[7]),
      hsteel_change: chg(metas[7]),
      kia_price: fmt(metas[8]),
      kia_change: chg(metas[8]),
    }
  } catch (e) {
    console.error('시장 데이터 에러:', e)
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