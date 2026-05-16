import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

async function getRealTimeMarketData() {
  try {
    const [kospiRes, exchangeRes, samsungRes, hynixRes, kiaRes] = await Promise.allSettled([
      fetch('https://query1.finance.yahoo.com/v8/finance/chart/%5EKS11?interval=1d&range=1d', { headers: { 'User-Agent': 'Mozilla/5.0' } }),
      fetch('https://query1.finance.yahoo.com/v8/finance/chart/KRW%3DX?interval=1d&range=1d', { headers: { 'User-Agent': 'Mozilla/5.0' } }),
      fetch('https://query1.finance.yahoo.com/v8/finance/chart/005930.KS?interval=1d&range=1d', { headers: { 'User-Agent': 'Mozilla/5.0' } }),
      fetch('https://query1.finance.yahoo.com/v8/finance/chart/000660.KS?interval=1d&range=1d', { headers: { 'User-Agent': 'Mozilla/5.0' } }),
      fetch('https://query1.finance.yahoo.com/v8/finance/chart/000270.KS?interval=1d&range=1d', { headers: { 'User-Agent': 'Mozilla/5.0' } }),
    ])

    const getData = async (res: PromiseSettledResult<Response>) => {
      if (res.status !== 'fulfilled') return null
      try {
        const json = await res.value.json()
        const meta = json?.chart?.result?.[0]?.meta
        return meta ?? null
      } catch { return null }
    }

    const [kospi, exchange, samsung, hynix, kia] = await Promise.all([
      getData(kospiRes),
      getData(exchangeRes),
      getData(samsungRes),
      getData(hynixRes),
      getData(kiaRes),
    ])

    const price = (m: any) => m?.regularMarketPrice?.toLocaleString() ?? '-'
    const change = (m: any) => {
      if (!m) return '-'
      const prev = m.chartPreviousClose ?? m.previousClose
      const curr = m.regularMarketPrice
      if (!prev || !curr) return '-'
      return ((curr - prev) / prev * 100).toFixed(2)
    }

    return {
      kospi_price: price(kospi),
      kospi_change: change(kospi),
      usdkrw: exchange?.regularMarketPrice?.toFixed(0) ?? '-',
      samsung_price: price(samsung),
      samsung_change: change(samsung),
      hynix_price: price(hynix),
      hynix_change: change(hynix),
      kia_price: price(kia),
      kia_change: change(kia),
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