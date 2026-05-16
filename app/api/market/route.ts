import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

async function getRealTimeMarketData() {
  try {
    const symbols = [
      '%5EKS11',   // 코스피
      '%5EIXIC',   // 나스닥
      'KRW%3DX',   // 원달러
      '005930.KS', // 삼성전자
      '005935.KS', // 삼성전자우
      '000660.KS', // SK하이닉스
      '005380.KS', // 현대차
      '004020.KS', // 현대제철
      '000270.KS', // 기아
    ]

    const results = await Promise.allSettled(
      symbols.map(s =>
        fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${s}?interval=1d&range=1d`, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          next: { revalidate: 30 }
        }).then(r => r.json())
      )
    )

    const getMeta = (i: number) => {
      const r = results[i]
      if (r.status !== 'fulfilled') return null
      return r.value?.chart?.result?.[0]?.meta ?? null
    }

    const price = (m: any): string => {
      if (!m?.regularMarketPrice) return '-'
      return m.regularMarketPrice.toLocaleString('ko-KR')
    }

    const change = (m: any): string => {
      if (!m) return '-'
      const prev = m.chartPreviousClose ?? m.previousClose
      const curr = m.regularMarketPrice
      if (!prev || !curr) return '-'
      return ((curr - prev) / prev * 100).toFixed(2)
    }

    const metas = symbols.map((_, i) => getMeta(i))

    return {
      kospi_price: price(metas[0]),
      kospi_change: change(metas[0]),
      nasdaq_price: price(metas[1]),
      nasdaq_change: change(metas[1]),
      usdkrw: metas[2]?.regularMarketPrice?.toFixed(0) ?? '-',
      samsung_price: price(metas[3]),
      samsung_change: change(metas[3]),
      samsung_p_price: price(metas[4]),
      samsung_p_change: change(metas[4]),
      hynix_price: price(metas[5]),
      hynix_change: change(metas[5]),
      hyundai_price: price(metas[6]),
      hyundai_change: change(metas[6]),
      hsteel_price: price(metas[7]),
      hsteel_change: change(metas[7]),
      kia_price: price(metas[8]),
      kia_change: change(metas[8]),
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