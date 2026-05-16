import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { toZonedTime } from 'date-fns-tz'

const AV_KEY = process.env.ALPHA_VANTAGE_KEY

async function getQuote(symbol: string) {
  try {
    const res = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${AV_KEY}`
    )
    const data = await res.json()
    const q = data['Global Quote']
    if (!q || !q['05. price']) return { price: '-', change: '-' }
    const price = parseFloat(q['05. price'])
    const changePct = parseFloat(q['10. change percent'].replace('%', ''))
    return {
      price: price.toLocaleString('ko-KR'),
      change: changePct.toFixed(2),
    }
  } catch {
    return { price: '-', change: '-' }
  }
}

async function getForex() {
  try {
    const res = await fetch(
      `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=KRW&apikey=${AV_KEY}`
    )
    const data = await res.json()
    const rate = data['Realtime Currency Exchange Rate']?.['5. Exchange Rate']
    return rate ? parseFloat(rate).toFixed(0) : '-'
  } catch {
    return '-'
  }
}

async function getRealTimeMarketData() {
  try {
    const [
      kospi, nasdaq,
      samsung, samsungP, hynix,
      hyundai, hsteel, kia,
      usdkrw
    ] = await Promise.all([
      getQuote('105781.KS'),   // 코스피 ETF (KODEX200)
      getQuote('QQQ'),          // 나스닥 ETF
      getQuote('005930.KS'),    // 삼성전자
      getQuote('005935.KS'),    // 삼성전자우
      getQuote('000660.KS'),    // SK하이닉스
      getQuote('005380.KS'),    // 현대차
      getQuote('004020.KS'),    // 현대제철
      getQuote('000270.KS'),    // 기아
      getForex(),               // 환율
    ])

    return {
      kospi_price: kospi.price,
      kospi_change: kospi.change,
      nasdaq_price: nasdaq.price,
      nasdaq_change: nasdaq.change,
      usdkrw,
      samsung_price: samsung.price,
      samsung_change: samsung.change,
      samsung_p_price: samsungP.price,
      samsung_p_change: samsungP.change,
      hynix_price: hynix.price,
      hynix_change: hynix.change,
      hyundai_price: hyundai.price,
      hyundai_change: hyundai.change,
      hsteel_price: hsteel.price,
      hsteel_change: hsteel.change,
      kia_price: kia.price,
      kia_change: kia.change,
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