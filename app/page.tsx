'use client'

import { useEffect, useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday } from 'date-fns'
import { ko } from 'date-fns/locale'

interface Realtime {
  kospi_price: string; kospi_change: string
  nasdaq_price: string; nasdaq_change: string
  usdkrw: string
  samsung_price: string; samsung_change: string
  samsung_p_price: string; samsung_p_change: string
  hynix_price: string; hynix_change: string
  hyundai_price: string; hyundai_change: string
  hsteel_price: string; hsteel_change: string
  kia_price: string; kia_change: string
}

interface Lesson {
  id: string; date: string; day_number: number; topic: string; category: string
  title: string; intro: string
  content: {
    sections: { heading: string; body: string; highlight?: string }[]
    signal_table: { situation: string; meaning: string; action: string; direction: string }[]
    daily_checklist: string[]
  }
  key_point: string; market_context: string
}

interface Brief {
  kospi_comment: string
  key_indicators: Record<string, string>
  foreign_net: string
  risk_level: number
  watch_list: string[]
  ai_comment: string
  news_summary?: string[]
}

interface EconomicEvent {
  date: string
  time: string
  country: string
  event: string
  importance: 'high' | 'medium' | 'low'
  previous?: string
  forecast?: string
}

const CATEGORY_COLORS: Record<string, string> = {
  '수급': '#c8a96e', '밸류': '#4ecdc4', '외인': '#5dbb7a',
  '신용': '#e05c5c', '매크로': '#a78bfa', '섹터': '#f59e0b',
  '파생': '#ec4899', '차트': '#60a5fa', '실전': '#34d399',
}

// 2026년 5~6월 주요 경제지표 일정
const ECONOMIC_CALENDAR: EconomicEvent[] = [
  { date: '2026-05-13', time: '21:30', country: '🇺🇸', event: '미국 CPI (4월)', importance: 'high', previous: '2.4%', forecast: '2.3%' },
  { date: '2026-05-14', time: '21:30', country: '🇺🇸', event: '미국 PPI (4월)', importance: 'high', previous: '2.7%', forecast: '2.5%' },
  { date: '2026-05-15', time: '21:30', country: '🇺🇸', event: '미국 소매판매 (4월)', importance: 'high', previous: '-0.9%', forecast: '0.2%' },
  { date: '2026-05-20', time: '21:30', country: '🇺🇸', event: '미국 주택착공 (4월)', importance: 'medium' },
  { date: '2026-05-21', time: '03:00', country: '🇺🇸', event: 'FOMC 의사록 공개', importance: 'high' },
  { date: '2026-05-22', time: '21:30', country: '🇺🇸', event: '미국 신규실업수당청구', importance: 'medium' },
  { date: '2026-05-23', time: '22:45', country: '🇺🇸', event: '미국 PMI 제조업/서비스업', importance: 'medium' },
  { date: '2026-05-27', time: '10:00', country: '🇰🇷', event: '한국 소비자신뢰지수', importance: 'low' },
  { date: '2026-05-29', time: '21:30', country: '🇺🇸', event: '미국 GDP 수정치 (1분기)', importance: 'high', previous: '-0.3%' },
  { date: '2026-05-30', time: '21:30', country: '🇺🇸', event: '미국 PCE 물가지수 (4월)', importance: 'high', previous: '2.3%' },
  { date: '2026-06-06', time: '21:30', country: '🇺🇸', event: '미국 고용보고서 (5월)', importance: 'high' },
  { date: '2026-06-11', time: '21:30', country: '🇺🇸', event: '미국 CPI (5월)', importance: 'high' },
  { date: '2026-06-12', time: '03:00', country: '🇺🇸', event: 'FOMC 금리결정', importance: 'high' },
  { date: '2026-06-13', time: '09:00', country: '🇰🇷', event: 'MSCI 시장분류 발표', importance: 'high' },
]

function ChangeTag({ change }: { change: string }) {
  const num = parseFloat(change)
  if (isNaN(num)) return <span style={{ color: '#888899', fontSize: 11 }}>-</span>
  const color = num >= 0 ? '#e05c5c' : '#4ecdc4'
  const arrow = num >= 0 ? '▲' : '▼'
  return <span style={{ color, fontSize: 11, fontFamily: 'var(--font-jetbrains)' }}>{arrow}{Math.abs(num).toFixed(2)}%</span>
}

export default function Home() {
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [brief, setBrief] = useState<Brief | null>(null)
  const [realtime, setRealtime] = useState<Realtime | null>(null)
  const [loading, setLoading] = useState(true)
  const [pastLessons, setPastLessons] = useState<Lesson[]>([])
  const [activeTab, setActiveTab] = useState<'market' | 'calendar' | 'lesson' | 'archive'>('market')
  const [calendarMonth, setCalendarMonth] = useState(new Date(2026, 4, 1))
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  useEffect(() => {
    fetchToday()
    fetchPastLessons()
    const interval = setInterval(fetchRealtime, 30000)
    return () => clearInterval(interval)
  }, [])

  async function fetchToday() {
    const res = await fetch('/api/market')
    const data = await res.json()
    setLesson(data.lesson)
    setBrief(data.brief)
    setRealtime(data.realtime)
    setLoading(false)
  }

  async function fetchRealtime() {
    const res = await fetch('/api/market')
    const data = await res.json()
    setRealtime(data.realtime)
  }

  async function fetchPastLessons() {
    const res = await fetch('/api/lessons?limit=20')
    const data = await res.json()
    setPastLessons(Array.isArray(data) ? data.slice(1) : [])
  }

  const today = format(new Date(), 'yyyy년 M월 d일 (EEE)', { locale: ko })
  const catColor = lesson ? (CATEGORY_COLORS[lesson.category] ?? '#c8a96e') : '#c8a96e'

  const stocks = realtime ? [
    { label: '코스피', price: realtime.kospi_price, change: realtime.kospi_change, unit: '' },
    { label: '나스닥', price: realtime.nasdaq_price, change: realtime.nasdaq_change, unit: '' },
    { label: '원/달러', price: realtime.usdkrw, change: null, unit: '원' },
    { label: '삼성전자', price: realtime.samsung_price, change: realtime.samsung_change, unit: '원' },
    { label: '삼성전자우', price: realtime.samsung_p_price, change: realtime.samsung_p_change, unit: '원' },
    { label: 'SK하이닉스', price: realtime.hynix_price, change: realtime.hynix_change, unit: '원' },
    { label: '현대차', price: realtime.hyundai_price, change: realtime.hyundai_change, unit: '원' },
    { label: '현대제철', price: realtime.hsteel_price, change: realtime.hsteel_change, unit: '원' },
    { label: '기아', price: realtime.kia_price, change: realtime.kia_change, unit: '원' },
  ] : []

  // 캘린더 날짜 계산
  const monthStart = startOfMonth(calendarMonth)
  const monthEnd = endOfMonth(calendarMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startPad = getDay(monthStart)

  const eventsOnDate = (dateStr: string) =>
    ECONOMIC_CALENDAR.filter(e => e.date === dateStr)

  const selectedEvents = selectedDate ? eventsOnDate(selectedDate) : []

  const importanceColor = (imp: string) =>
    imp === 'high' ? '#e05c5c' : imp === 'medium' ? '#c8a96e' : '#888899'

  return (
    <div style={{ position: 'relative', zIndex: 1, maxWidth: 820, margin: '0 auto', padding: '32px 20px 80px' }}>

      {/* 헤더 */}
      <div style={{ textAlign: 'center', marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #2a2a3a' }}>
        <div style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 11, color: '#c8a96e', letterSpacing: 3, marginBottom: 8 }}>주식 기초 마스터 클래스</div>
        <h1 style={{ fontSize: 'clamp(22px,4vw,34px)', fontWeight: 700, marginBottom: 8 }}>
          매일 아침 <span style={{ color: '#c8a96e' }}>한 레슨</span>
        </h1>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(200,169,110,0.1)', border: '1px solid rgba(200,169,110,0.3)', borderRadius: 4, padding: '5px 12px', fontFamily: 'var(--font-jetbrains)', fontSize: 12, color: '#c8a96e' }}>
          <div style={{ width: 6, height: 6, background: '#c8a96e', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
          {today}
        </div>
      </div>

      {/* 탭 */}
      <div style={{ display: 'flex', gap: 4, background: '#111118', border: '1px solid #2a2a3a', borderRadius: 8, padding: 4, marginBottom: 24 }}>
        {([
          ['market', '📊 시장'],
          ['calendar', '📅 경제캘린더'],
          ['lesson', '📚 레슨'],
          ['archive', '🗂️ 아카이브'],
        ] as const).map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ flex: 1, padding: '7px 8px', border: 'none', cursor: 'pointer', borderRadius: 6, fontSize: 12, fontFamily: 'var(--font-noto-serif)', transition: 'all 0.2s',
              background: activeTab === tab ? '#c8a96e' : 'transparent',
              color: activeTab === tab ? '#0a0a0f' : '#888899',
              fontWeight: activeTab === tab ? 600 : 400 }}>
            {label}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#888899' }}>
          <div style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 13 }}>불러오는 중...</div>
        </div>
      )}

      {/* ===== 시장 브리핑 탭 ===== */}
      {!loading && activeTab === 'market' && (
        <div className="animate-fade-up">

          {/* 실시간 주가 그리드 */}
          <div style={{ background: '#111118', border: '1px solid #2a2a3a', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 10, color: '#888899', letterSpacing: 2 }}>▶ 실시간 시장 (30초 갱신)</div>
              {!realtime && <div style={{ fontSize: 11, color: '#e05c5c' }}>데이터 로딩 중...</div>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {stocks.map((s) => (
                <div key={s.label} style={{ background: '#1a1a24', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 10, color: '#888899', marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 13, fontWeight: 600, marginBottom: 3 }}>
                    {s.price !== '-' ? `${s.price}${s.unit}` : '-'}
                  </div>
                  {s.change && <ChangeTag change={s.change} />}
                </div>
              ))}
            </div>
          </div>

          {/* 오늘 주요 뉴스 */}
          {brief?.news_summary && brief.news_summary.length > 0 && (
            <div style={{ background: '#111118', border: '1px solid #2a2a3a', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
              <div style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 10, color: '#4ecdc4', letterSpacing: 2, marginBottom: 14 }}>▶ 오늘 주요 뉴스</div>
              {brief.news_summary.map((news, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: i < brief.news_summary!.length - 1 ? '1px solid #1a1a24' : 'none', fontSize: 13, color: '#b8b4ac', lineHeight: 1.6 }}>
                  <span style={{ color: '#c8a96e', fontFamily: 'var(--font-jetbrains)', flexShrink: 0, marginTop: 2 }}>{String(i + 1).padStart(2, '0')}</span>
                  {news}
                </div>
              ))}
            </div>
          )}

          {/* 리스크 레벨 + 코스피 코멘트 */}
          {brief && (
            <div style={{ background: '#111118', border: '1px solid #2a2a3a', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
              <div style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 10, color: '#888899', letterSpacing: 2, marginBottom: 12 }}>오늘 리스크 레벨</div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                {[1,2,3,4,5].map(n => (
                  <div key={n} style={{ flex: 1, height: 6, borderRadius: 3, background: n <= brief.risk_level ? (brief.risk_level >= 4 ? '#e05c5c' : brief.risk_level === 3 ? '#c8a96e' : '#5dbb7a') : '#2a2a3a' }} />
                ))}
              </div>
              <div style={{ fontSize: 13, color: '#b8b4ac', lineHeight: 1.7, marginBottom: 12 }}>{brief.kospi_comment}</div>

              {/* 수급 지표 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
                {Object.entries(brief.key_indicators).map(([key, val]) => (
                  <div key={key} style={{ background: '#1a1a24', borderRadius: 6, padding: '8px 12px' }}>
                    <div style={{ fontSize: 10, color: '#888899', marginBottom: 3 }}>{key}</div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{val as string}</div>
                  </div>
                ))}
              </div>

              <div style={{ fontSize: 12, color: '#888899', lineHeight: 1.6, padding: '10px 0', borderTop: '1px solid #2a2a3a' }}>
                {brief.foreign_net}
              </div>
            </div>
          )}

          {/* 이번 주 이벤트 */}
          {brief && (
            <div style={{ background: '#111118', border: '1px solid #2a2a3a', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
              <div style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 10, color: '#888899', letterSpacing: 2, marginBottom: 14 }}>이번 주 주목 이벤트</div>
              {brief.watch_list.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: i < brief.watch_list.length - 1 ? '1px solid #1a1a24' : 'none', fontSize: 13, color: '#b8b4ac' }}>
                  <span style={{ color: '#c8a96e', fontFamily: 'var(--font-jetbrains)', flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</span>
                  {item}
                </div>
              ))}
            </div>
          )}

          {/* AI 코멘트 */}
          {brief && (
            <div style={{ background: 'linear-gradient(135deg,rgba(200,169,110,0.06),rgba(78,205,196,0.04))', border: '1px solid rgba(200,169,110,0.2)', borderRadius: 12, padding: '16px 20px' }}>
              <div style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 10, color: '#4ecdc4', letterSpacing: 2, marginBottom: 10 }}>▶ 오늘 시장 한마디</div>
              <p style={{ fontSize: 13, color: '#b8b4ac', lineHeight: 1.8 }}>{brief.ai_comment}</p>
            </div>
          )}
        </div>
      )}

      {/* ===== 경제 캘린더 탭 ===== */}
      {activeTab === 'calendar' && (
        <div className="animate-fade-up">

          {/* 월 네비게이션 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
              style={{ background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: 6, padding: '6px 14px', color: '#888899', cursor: 'pointer', fontSize: 13 }}>◀</button>
            <div style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 14, color: '#c8a96e' }}>
              {format(calendarMonth, 'yyyy년 M월', { locale: ko })}
            </div>
            <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
              style={{ background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: 6, padding: '6px 14px', color: '#888899', cursor: 'pointer', fontSize: 13 }}>▶</button>
          </div>

          {/* 중요도 범례 */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 14, fontSize: 11, color: '#888899' }}>
            {[['high', '🔴 높음'], ['medium', '🟡 중간'], ['low', '⚪ 낮음']].map(([imp, label]) => (
              <span key={imp}>{label}</span>
            ))}
          </div>

          {/* 캘린더 그리드 */}
          <div style={{ background: '#111118', border: '1px solid #2a2a3a', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
            {/* 요일 헤더 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #2a2a3a' }}>
              {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
                <div key={d} style={{ padding: '8px 0', textAlign: 'center', fontSize: 11, color: i === 0 ? '#e05c5c' : i === 6 ? '#4ecdc4' : '#888899', fontFamily: 'var(--font-jetbrains)' }}>{d}</div>
              ))}
            </div>

            {/* 날짜 그리드 */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {Array.from({ length: startPad }).map((_, i) => (
                <div key={`pad-${i}`} style={{ height: 60, borderRight: '1px solid #1a1a24', borderBottom: '1px solid #1a1a24' }} />
              ))}
              {days.map((day) => {
                const dateStr = format(day, 'yyyy-MM-dd')
                const events = eventsOnDate(dateStr)
                const isSelected = selectedDate === dateStr
                const todayDay = isToday(day)
                const dayOfWeek = getDay(day)
                return (
                  <div key={dateStr} onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                    style={{ height: 60, borderRight: '1px solid #1a1a24', borderBottom: '1px solid #1a1a24', padding: '4px 6px', cursor: events.length > 0 ? 'pointer' : 'default',
                      background: isSelected ? 'rgba(200,169,110,0.1)' : 'transparent', position: 'relative' }}>
                    <div style={{ fontSize: 11, fontFamily: 'var(--font-jetbrains)', marginBottom: 3,
                      color: todayDay ? '#c8a96e' : dayOfWeek === 0 ? '#e05c5c' : dayOfWeek === 6 ? '#4ecdc4' : '#888899',
                      fontWeight: todayDay ? 700 : 400 }}>
                      {format(day, 'd')}
                      {todayDay && <span style={{ fontSize: 8, marginLeft: 2 }}>●</span>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {events.slice(0, 2).map((e, i) => (
                        <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: importanceColor(e.importance) }} />
                      ))}
                      {events.length > 2 && <div style={{ fontSize: 8, color: '#888899' }}>+{events.length - 2}</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 선택된 날짜 이벤트 */}
          {selectedDate && selectedEvents.length > 0 && (
            <div style={{ background: '#111118', border: '1px solid rgba(200,169,110,0.3)', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
              <div style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 11, color: '#c8a96e', letterSpacing: 2, marginBottom: 14 }}>
                {format(new Date(selectedDate), 'M월 d일 (EEE)', { locale: ko })} 발표 예정
              </div>
              {selectedEvents.map((e, i) => (
                <div key={i} style={{ padding: '12px 0', borderBottom: i < selectedEvents.length - 1 ? '1px solid #1a1a24' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: importanceColor(e.importance), flexShrink: 0, display: 'inline-block' }} />
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{e.country} {e.event}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#888899', paddingLeft: 16 }}>
                    <span>⏰ {e.time} KST</span>
                    {e.previous && <span>이전: {e.previous}</span>}
                    {e.forecast && <span style={{ color: '#c8a96e' }}>예상: {e.forecast}</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 이번 달 전체 일정 */}
          <div style={{ background: '#111118', border: '1px solid #2a2a3a', borderRadius: 12, padding: '16px 20px' }}>
            <div style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 10, color: '#888899', letterSpacing: 2, marginBottom: 14 }}>
              {format(calendarMonth, 'M월', { locale: ko })} 전체 주요 일정
            </div>
            {ECONOMIC_CALENDAR
              .filter(e => e.date.startsWith(format(calendarMonth, 'yyyy-MM')))
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((e, i, arr) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid #1a1a24' : 'none', alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 60, fontFamily: 'var(--font-jetbrains)', fontSize: 11, color: '#888899' }}>
                    {format(new Date(e.date), 'M/d (EEE)', { locale: ko })}
                  </div>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: importanceColor(e.importance), flexShrink: 0, marginTop: 3 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, marginBottom: 2 }}>{e.country} {e.event}</div>
                    <div style={{ fontSize: 11, color: '#888899' }}>
                      {e.time} KST
                      {e.previous && ` · 이전 ${e.previous}`}
                      {e.forecast && ` · 예상 ${e.forecast}`}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ===== 레슨 탭 ===== */}
      {!loading && activeTab === 'lesson' && (
        <>
          {!lesson ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#888899' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>⏰</div>
              <div style={{ fontSize: 16, marginBottom: 8 }}>오늘 레슨이 아직 준비 중입니다</div>
              <div style={{ fontSize: 13, fontFamily: 'var(--font-jetbrains)' }}>매일 자정에 업데이트됩니다</div>
            </div>
          ) : (
            <div className="animate-fade-up">
              <div style={{ background: '#111118', border: '1px solid #2a2a3a', borderRadius: 12, padding: 24, marginBottom: 20, borderTop: `3px solid ${catColor}` }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 11, color: catColor, background: `${catColor}22`, border: `1px solid ${catColor}44`, borderRadius: 4, padding: '3px 8px' }}>Day {lesson.day_number}</span>
                  <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 11, color: '#888899', background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: 4, padding: '3px 8px' }}>{lesson.category}</span>
                </div>
                <div style={{ fontSize: 11, color: '#888899', fontFamily: 'var(--font-jetbrains)', marginBottom: 8 }}>오늘의 주제: {lesson.topic}</div>
                <h2 style={{ fontSize: 'clamp(18px,3vw,24px)', fontWeight: 700, marginBottom: 12, lineHeight: 1.3 }}>{lesson.title}</h2>
                <p style={{ color: '#888899', fontSize: 14, lineHeight: 1.8 }}>{lesson.intro}</p>
              </div>

              {lesson.content.sections.map((sec, i) => (
                <div key={i} style={{ background: '#111118', border: '1px solid #2a2a3a', borderRadius: 12, padding: '20px 24px', marginBottom: 12 }}>
                  <div style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 11, color: catColor, marginBottom: 10 }}>{String(i + 1).padStart(2, '0')}</div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>{sec.heading}</h3>
                  <p style={{ fontSize: 14, color: '#b8b4ac', lineHeight: 1.8 }}>{sec.body}</p>
                  {sec.highlight && (
                    <div style={{ marginTop: 12, padding: '10px 14px', background: `${catColor}0d`, borderLeft: `3px solid ${catColor}`, fontSize: 13, color: catColor, fontWeight: 600 }}>{sec.highlight}</div>
                  )}
                </div>
              ))}

              {lesson.content.signal_table?.length > 0 && (
                <div style={{ background: '#111118', border: '1px solid #2a2a3a', borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
                  <div style={{ padding: '14px 24px 10px', fontFamily: 'var(--font-jetbrains)', fontSize: 11, color: '#888899', letterSpacing: 2, borderBottom: '1px solid #2a2a3a' }}>신호 읽기</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead><tr style={{ borderBottom: '1px solid #2a2a3a' }}>
                      {['상황', '의미', '대응'].map(h => <th key={h} style={{ padding: '8px 16px', textAlign: 'left', color: '#888899', fontWeight: 400, fontSize: 11, fontFamily: 'var(--font-jetbrains)' }}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {lesson.content.signal_table.map((row, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #1a1a24' }}>
                          <td style={{ padding: '10px 16px' }}>{row.situation}</td>
                          <td style={{ padding: '10px 16px', color: '#888899' }}>{row.meaning}</td>
                          <td style={{ padding: '10px 16px', color: row.direction === 'up' ? '#e05c5c' : row.direction === 'down' ? '#4ecdc4' : '#c8a96e', fontWeight: 600 }}>{row.action}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {lesson.market_context && (
                <div style={{ background: 'linear-gradient(135deg,rgba(200,169,110,0.06),rgba(78,205,196,0.04))', border: '1px solid rgba(200,169,110,0.2)', borderRadius: 12, padding: '20px 24px', marginBottom: 12 }}>
                  <div style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 11, color: '#4ecdc4', letterSpacing: 2, marginBottom: 10 }}>▶ 지금 시장과 연결하면</div>
                  <p style={{ fontSize: 14, color: '#b8b4ac', lineHeight: 1.8 }}>{lesson.market_context}</p>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12, padding: '16px 20px', background: 'rgba(200,169,110,0.05)', borderLeft: `3px solid ${catColor}`, borderRadius: '0 8px 8px 0', marginBottom: 20 }}>
                <span style={{ fontSize: 18 }}>💡</span>
                <div>
                  <div style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 10, color: '#888899', letterSpacing: 2, marginBottom: 6 }}>오늘의 핵심</div>
                  <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.7 }}>{lesson.key_point}</div>
                </div>
              </div>

              {lesson.content.daily_checklist?.length > 0 && (
                <div style={{ background: '#111118', border: '1px solid #2a2a3a', borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
                  <div style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 11, color: '#888899', letterSpacing: 2, marginBottom: 14 }}>매일 확인 체크리스트</div>
                  {lesson.content.daily_checklist.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: i < lesson.content.daily_checklist.length - 1 ? '1px solid #1a1a24' : 'none', fontSize: 13, color: '#888899' }}>
                      <span style={{ color: catColor, fontFamily: 'var(--font-jetbrains)' }}>{String(i + 1).padStart(2, '0')}</span>
                      {item}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ===== 아카이브 탭 ===== */}
      {activeTab === 'archive' && (
        <div className="animate-fade-up">
          <div style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 11, color: '#888899', letterSpacing: 2, marginBottom: 16 }}>지난 레슨 아카이브</div>
          {pastLessons.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#888899', fontSize: 14 }}>아직 아카이브가 없습니다</div>
          ) : (
            pastLessons.map((l) => {
              const cc = CATEGORY_COLORS[l.category] ?? '#c8a96e'
              return (
                <div key={l.id} style={{ background: '#111118', border: '1px solid #2a2a3a', borderRadius: 10, padding: '16px 20px', marginBottom: 10, display: 'flex', gap: 14 }}>
                  <div style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 11, color: cc, background: `${cc}22`, border: `1px solid ${cc}44`, borderRadius: 4, padding: '3px 8px', whiteSpace: 'nowrap', marginTop: 2 }}>Day {l.day_number}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: '#888899', fontFamily: 'var(--font-jetbrains)', marginBottom: 4 }}>{l.date} · {l.topic}</div>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{l.title}</div>
                    <div style={{ fontSize: 12, color: '#888899', lineHeight: 1.5 }}>{l.key_point}</div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      <div style={{ textAlign: 'center', marginTop: 48, paddingTop: 32, borderTop: '1px solid #2a2a3a', color: '#888899', fontSize: 12, lineHeight: 1.8 }}>
        <p>본 자료는 투자 교육 목적으로 제공되며 투자 권유가 아닙니다.</p>
        <p>모든 투자 판단과 그에 따른 결과는 투자자 본인에게 있습니다.</p>
      </div>

    </div>
  )
}
