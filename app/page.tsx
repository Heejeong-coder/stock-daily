'use client'

import { useEffect, useState } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday } from 'date-fns'
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
  date: string; time: string; country: string
  event: string; importance: 'high' | 'medium' | 'low'
  previous?: string; forecast?: string
}

const ECONOMIC_CALENDAR: EconomicEvent[] = [
  { date: '2026-05-21', time: '03:00', country: '🇺🇸', event: 'FOMC 의사록 공개', importance: 'high' },
  { date: '2026-05-22', time: '21:30', country: '🇺🇸', event: '신규실업수당청구', importance: 'medium' },
  { date: '2026-05-23', time: '22:45', country: '🇺🇸', event: 'PMI 제조업/서비스업', importance: 'medium' },
  { date: '2026-05-29', time: '21:30', country: '🇺🇸', event: 'GDP 수정치 (1분기)', importance: 'high', previous: '-0.3%' },
  { date: '2026-05-30', time: '21:30', country: '🇺🇸', event: 'PCE 물가지수 (4월)', importance: 'high', previous: '2.3%' },
  { date: '2026-06-06', time: '21:30', country: '🇺🇸', event: '고용보고서 (5월)', importance: 'high' },
  { date: '2026-06-11', time: '21:30', country: '🇺🇸', event: 'CPI (5월)', importance: 'high' },
  { date: '2026-06-12', time: '03:00', country: '🇺🇸', event: 'FOMC 금리결정', importance: 'high' },
  { date: '2026-06-13', time: '09:00', country: '🇰🇷', event: 'MSCI 시장분류 발표', importance: 'high' },
  { date: '2026-06-25', time: '21:30', country: '🇺🇸', event: 'PCE 물가지수 (5월)', importance: 'high' },
]

const CATEGORY_COLORS: Record<string, string> = {
  '수급': '#c8a96e', '밸류': '#4ecdc4', '외인': '#5dbb7a',
  '신용': '#e05c5c', '매크로': '#a78bfa', '섹터': '#f59e0b',
  '파생': '#ec4899', '차트': '#60a5fa', '실전': '#34d399',
}

const IMP_COLOR = { high: '#e05c5c', medium: '#c8a96e', low: '#555566' }

function ChangeTag({ change }: { change: string }) {
  const num = parseFloat(change)
  if (isNaN(num)) return <span style={{ color: '#555566', fontSize: 11 }}>—</span>
  const color = num >= 0 ? '#e05c5c' : '#4ecdc4'
  const arrow = num >= 0 ? '▲' : '▼'
  return (
    <span style={{ color, fontSize: 11, fontFamily: 'var(--font-space)', fontWeight: 500 }}>
      {arrow} {Math.abs(num).toFixed(2)}%
    </span>
  )
}

export default function Home() {
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [brief, setBrief] = useState<Brief | null>(null)
  const [realtime, setRealtime] = useState<Realtime | null>(null)
  const [loading, setLoading] = useState(true)
  const [pastLessons, setPastLessons] = useState<Lesson[]>([])
  const [activeTab, setActiveTab] = useState<'market' | 'lesson' | 'archive'>('market')
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

  const today = format(new Date(), 'M월 d일 (EEE)', { locale: ko })
  const catColor = lesson ? (CATEGORY_COLORS[lesson.category] ?? '#c8a96e') : '#c8a96e'

  const stocks = realtime ? [
    { label: 'KOSPI', price: realtime.kospi_price, change: realtime.kospi_change, unit: '' },
    { label: 'NASDAQ', price: realtime.nasdaq_price, change: realtime.nasdaq_change, unit: '' },
    { label: 'USD/KRW', price: realtime.usdkrw, change: null, unit: '₩' },
    { label: '삼성전자', price: realtime.samsung_price, change: realtime.samsung_change, unit: '₩' },
    { label: '삼성전자우', price: realtime.samsung_p_price, change: realtime.samsung_p_change, unit: '₩' },
    { label: 'SK하이닉스', price: realtime.hynix_price, change: realtime.hynix_change, unit: '₩' },
    { label: '현대차', price: realtime.hyundai_price, change: realtime.hyundai_change, unit: '₩' },
    { label: '현대제철', price: realtime.hsteel_price, change: realtime.hsteel_change, unit: '₩' },
    { label: '기아', price: realtime.kia_price, change: realtime.kia_change, unit: '₩' },
  ] : []

  const monthStart = startOfMonth(calendarMonth)
  const monthEnd = endOfMonth(calendarMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startPad = getDay(monthStart)
  const eventsOnDate = (d: string) => ECONOMIC_CALENDAR.filter(e => e.date === d)
  const selectedEvents = selectedDate ? eventsOnDate(selectedDate) : []

  const s = {
    card: { background: '#111117', border: '1px solid #1e1e2e', borderRadius: 14, padding: '18px 20px', marginBottom: 16 } as React.CSSProperties,
    label: { fontSize: 10, color: '#555566', letterSpacing: '0.15em', textTransform: 'uppercase' as const, fontFamily: 'var(--font-space)', fontWeight: 500, marginBottom: 10 },
  }

  return (
    <div style={{ position: 'relative', zIndex: 1, maxWidth: 840, margin: '0 auto', padding: '36px 20px 100px' }}>

      {/* ── HEADER ── */}
      <header style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: '#c8a96e', letterSpacing: '0.3em', textTransform: 'uppercase', fontFamily: 'var(--font-space)', fontWeight: 500, marginBottom: 6 }}>
              Daily Market Intelligence
            </div>
            <h1 style={{ fontSize: 'clamp(28px,5vw,44px)', fontWeight: 700, letterSpacing: '-0.02em', fontFamily: 'var(--font-space)', lineHeight: 1 }}>
              Heejeong<span style={{ color: '#c8a96e' }}>'s</span> Desk
            </h1>
            <div style={{ fontSize: 13, color: '#555566', marginTop: 6, fontWeight: 400 }}>
              시장을 읽는 눈 — 매일 업데이트
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(200,169,110,0.08)', border: '1px solid rgba(200,169,110,0.2)', borderRadius: 8, padding: '8px 16px' }}>
            <div style={{ width: 6, height: 6, background: '#5dbb7a', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
            <span style={{ fontFamily: 'var(--font-space)', fontSize: 13, color: '#c8a96e', fontWeight: 500 }}>{today}</span>
          </div>
        </div>
        <div style={{ height: 1, background: 'linear-gradient(90deg, rgba(200,169,110,0.3), transparent)', marginTop: 20 }} />
      </header>

      {/* ── TABS ── */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 28, borderBottom: '1px solid #1e1e2e', paddingBottom: 0 }}>
        {([
          ['market', 'Market & Calendar'],
          ['lesson', `Day ${lesson?.day_number ?? '—'} · 레슨`],
          ['archive', 'Archive'],
        ] as const).map(([tab, label]) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '10px 20px', border: 'none', cursor: 'pointer', fontSize: 13,
            fontFamily: 'var(--font-space)', fontWeight: 500, transition: 'all 0.2s',
            background: 'transparent', borderBottom: activeTab === tab ? '2px solid #c8a96e' : '2px solid transparent',
            color: activeTab === tab ? '#c8a96e' : '#555566', marginBottom: -1,
          }}>
            {label}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#555566' }}>
          <div style={{ fontFamily: 'var(--font-space)', fontSize: 13 }}>Loading...</div>
        </div>
      )}

      {/* ══════════════════════════════════
          TAB 1: MARKET + CALENDAR
      ══════════════════════════════════ */}
      {!loading && activeTab === 'market' && (
        <div className="animate-fade-up">

          {/* 실시간 주가 */}
          <div style={s.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={s.label}>Live Prices · 30s refresh</div>
              {!realtime && <span style={{ fontSize: 11, color: '#e05c5c' }}>연결 중...</span>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {stocks.map((st) => (
                <div key={st.label} style={{ background: '#0d0d14', borderRadius: 10, padding: '12px 14px', border: '1px solid #1e1e2e' }}>
                  <div style={{ fontSize: 10, color: '#555566', fontFamily: 'var(--font-space)', fontWeight: 500, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{st.label}</div>
                  <div style={{ fontFamily: 'var(--font-space)', fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                    {st.price !== '-' ? `${st.unit}${st.price}` : '—'}
                  </div>
                  {st.change !== null && <ChangeTag change={st.change} />}
                </div>
              ))}
            </div>
          </div>

          {/* 오늘 뉴스 */}
          {brief?.news_summary && brief.news_summary.length > 0 && (
            <div style={s.card}>
              <div style={s.label}>Today's Headlines</div>
              {brief.news_summary.map((news, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '9px 0', borderBottom: i < brief.news_summary!.length - 1 ? '1px solid #1e1e2e' : 'none', fontSize: 13, color: '#b8b4ac', lineHeight: 1.6 }}>
                  <span style={{ color: '#c8a96e', fontFamily: 'var(--font-space)', fontWeight: 600, flexShrink: 0, fontSize: 11 }}>{String(i + 1).padStart(2, '0')}</span>
                  {news}
                </div>
              ))}
            </div>
          )}

          {/* 리스크 + 수급 */}
          {brief && (
            <div style={s.card}>
              <div style={s.label}>Market Overview</div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                {[1,2,3,4,5].map(n => (
                  <div key={n} style={{ flex: 1, height: 4, borderRadius: 2, transition: 'background 0.3s',
                    background: n <= brief.risk_level ? (brief.risk_level >= 4 ? '#e05c5c' : brief.risk_level === 3 ? '#c8a96e' : '#5dbb7a') : '#1e1e2e' }} />
                ))}
              </div>
              <div style={{ fontSize: 13, color: '#b8b4ac', lineHeight: 1.7, marginBottom: 14 }}>{brief.kospi_comment}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 14 }}>
                {Object.entries(brief.key_indicators).map(([key, val]) => (
                  <div key={key} style={{ background: '#0d0d14', borderRadius: 8, padding: '10px 12px', border: '1px solid #1e1e2e' }}>
                    <div style={{ fontSize: 10, color: '#555566', fontFamily: 'var(--font-space)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{key}</div>
                    <div style={{ fontSize: 12, fontWeight: 600 }}>{val as string}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 12, color: '#555566', lineHeight: 1.6, padding: '10px 0', borderTop: '1px solid #1e1e2e' }}>{brief.foreign_net}</div>
            </div>
          )}

          {/* Watch List */}
          {brief && (
            <div style={s.card}>
              <div style={s.label}>This Week · Watch List</div>
              {brief.watch_list.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '8px 0', borderBottom: i < brief.watch_list.length - 1 ? '1px solid #1e1e2e' : 'none', fontSize: 13, color: '#b8b4ac' }}>
                  <span style={{ color: '#c8a96e', fontFamily: 'var(--font-space)', fontWeight: 600, flexShrink: 0, fontSize: 11 }}>{String(i + 1).padStart(2, '0')}</span>
                  {item}
                </div>
              ))}
            </div>
          )}

          {/* AI 코멘트 */}
          {brief && (
            <div style={{ ...s.card, background: 'linear-gradient(135deg, rgba(200,169,110,0.05), rgba(78,205,196,0.03))', border: '1px solid rgba(200,169,110,0.15)' }}>
              <div style={{ ...s.label, color: '#4ecdc4' }}>AI Market Comment</div>
              <p style={{ fontSize: 13, color: '#b8b4ac', lineHeight: 1.9 }}>{brief.ai_comment}</p>
            </div>
          )}

          {/* ── 경제 캘린더 ── */}
          <div style={{ height: 1, background: 'linear-gradient(90deg, rgba(200,169,110,0.2), transparent)', margin: '8px 0 24px' }} />
          <div style={{ fontSize: 11, color: '#555566', letterSpacing: '0.2em', textTransform: 'uppercase', fontFamily: 'var(--font-space)', fontWeight: 500, marginBottom: 16 }}>
            Economic Calendar
          </div>

          {/* 월 네비 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
              style={{ background: '#111117', border: '1px solid #1e1e2e', borderRadius: 8, padding: '6px 14px', color: '#555566', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-space)' }}>◀</button>
            <div style={{ fontFamily: 'var(--font-space)', fontSize: 14, fontWeight: 600, color: '#c8a96e' }}>
              {format(calendarMonth, 'yyyy년 M월', { locale: ko })}
            </div>
            <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
              style={{ background: '#111117', border: '1px solid #1e1e2e', borderRadius: 8, padding: '6px 14px', color: '#555566', cursor: 'pointer', fontSize: 12, fontFamily: 'var(--font-space)' }}>▶</button>
          </div>

          {/* 캘린더 */}
          <div style={{ background: '#111117', border: '1px solid #1e1e2e', borderRadius: 14, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #1e1e2e' }}>
              {['SUN','MON','TUE','WED','THU','FRI','SAT'].map((d, i) => (
                <div key={d} style={{ padding: '8px 0', textAlign: 'center', fontSize: 10, fontFamily: 'var(--font-space)', fontWeight: 600, letterSpacing: '0.1em',
                  color: i === 0 ? '#e05c5c' : i === 6 ? '#4ecdc4' : '#555566' }}>{d}</div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
              {Array.from({ length: startPad }).map((_, i) => (
                <div key={`p${i}`} style={{ minHeight: 64, borderRight: '1px solid #1a1a24', borderBottom: '1px solid #1a1a24' }} />
              ))}
              {days.map((day) => {
                const ds = format(day, 'yyyy-MM-dd')
                const evts = eventsOnDate(ds)
                const isSel = selectedDate === ds
                const todayDay = isToday(day)
                const dow = getDay(day)
                return (
                  <div key={ds} onClick={() => evts.length > 0 && setSelectedDate(isSel ? null : ds)}
                    style={{ minHeight: 64, borderRight: '1px solid #1a1a24', borderBottom: '1px solid #1a1a24', padding: '6px 8px',
                      cursor: evts.length > 0 ? 'pointer' : 'default', background: isSel ? 'rgba(200,169,110,0.08)' : todayDay ? 'rgba(200,169,110,0.04)' : 'transparent', transition: 'background 0.2s' }}>
                    <div style={{ fontSize: 11, fontFamily: 'var(--font-space)', fontWeight: todayDay ? 700 : 400, marginBottom: 4,
                      color: todayDay ? '#c8a96e' : dow === 0 ? '#e05c5c' : dow === 6 ? '#4ecdc4' : '#888899' }}>
                      {format(day, 'd')}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {evts.slice(0, 3).map((e, i) => (
                        <div key={i} style={{ height: 3, borderRadius: 2, background: IMP_COLOR[e.importance] }} />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 선택된 날 이벤트 */}
          {selectedDate && selectedEvents.length > 0 && (
            <div style={{ background: '#111117', border: '1px solid rgba(200,169,110,0.2)', borderRadius: 12, padding: '16px 20px', marginBottom: 16 }}>
              <div style={{ ...s.label, color: '#c8a96e' }}>{format(new Date(selectedDate), 'M월 d일 (EEE)', { locale: ko })} 발표 일정</div>
              {selectedEvents.map((e, i) => (
                <div key={i} style={{ padding: '10px 0', borderBottom: i < selectedEvents.length - 1 ? '1px solid #1e1e2e' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: IMP_COLOR[e.importance], flexShrink: 0 }} />
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{e.country} {e.event}</span>
                  </div>
                  <div style={{ fontSize: 12, color: '#555566', paddingLeft: 16, display: 'flex', gap: 12 }}>
                    <span>⏰ {e.time} KST</span>
                    {e.previous && <span>이전: <strong style={{ color: '#888899' }}>{e.previous}</strong></span>}
                    {e.forecast && <span style={{ color: '#c8a96e' }}>예상: <strong>{e.forecast}</strong></span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 월간 일정 리스트 */}
          <div style={s.card}>
            <div style={s.label}>{format(calendarMonth, 'M월', { locale: ko })} 주요 경제 일정</div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: 11, color: '#555566', fontFamily: 'var(--font-space)' }}>
              <span><span style={{ color: '#e05c5c' }}>●</span> 높음</span>
              <span><span style={{ color: '#c8a96e' }}>●</span> 중간</span>
              <span><span style={{ color: '#555566' }}>●</span> 낮음</span>
            </div>
            {ECONOMIC_CALENDAR
              .filter(e => e.date.startsWith(format(calendarMonth, 'yyyy-MM')))
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((e, i, arr) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid #1e1e2e' : 'none', alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 72, fontFamily: 'var(--font-space)', fontSize: 11, color: '#555566', fontWeight: 500 }}>
                    {format(new Date(e.date), 'M/d (EEE)', { locale: ko })}
                  </div>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: IMP_COLOR[e.importance], flexShrink: 0, marginTop: 4 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, marginBottom: 3, fontWeight: 500 }}>{e.country} {e.event}</div>
                    <div style={{ fontSize: 11, color: '#555566', fontFamily: 'var(--font-space)' }}>
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

      {/* ══════════════════════════════════
          TAB 2: LESSON
      ══════════════════════════════════ */}
      {!loading && activeTab === 'lesson' && (
        <>
          {!lesson ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#555566' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>⏰</div>
              <div style={{ fontSize: 16, marginBottom: 8, fontWeight: 500 }}>오늘 레슨 준비 중</div>
              <div style={{ fontSize: 13, fontFamily: 'var(--font-space)' }}>매일 자정 업데이트</div>
            </div>
          ) : (
            <div className="animate-fade-up">
              <div style={{ ...s.card, borderTop: `2px solid ${catColor}` }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  <span style={{ fontFamily: 'var(--font-space)', fontSize: 11, fontWeight: 600, color: catColor, background: `${catColor}18`, border: `1px solid ${catColor}30`, borderRadius: 6, padding: '3px 10px' }}>Day {lesson.day_number}</span>
                  <span style={{ fontFamily: 'var(--font-space)', fontSize: 11, color: '#555566', background: '#0d0d14', border: '1px solid #1e1e2e', borderRadius: 6, padding: '3px 10px' }}>{lesson.category}</span>
                </div>
                <div style={{ fontSize: 11, color: '#555566', fontFamily: 'var(--font-space)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Topic: {lesson.topic}</div>
                <h2 style={{ fontSize: 'clamp(18px,3vw,24px)', fontWeight: 700, marginBottom: 12, lineHeight: 1.3, fontFamily: 'var(--font-space)', letterSpacing: '-0.01em' }}>{lesson.title}</h2>
                <p style={{ color: '#888899', fontSize: 14, lineHeight: 1.9 }}>{lesson.intro}</p>
              </div>

              {lesson.content.sections.map((sec, i) => (
                <div key={i} style={s.card}>
                  <div style={{ fontFamily: 'var(--font-space)', fontSize: 10, color: catColor, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 10 }}>{String(i + 1).padStart(2, '0')}</div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10, fontFamily: 'var(--font-space)', letterSpacing: '-0.01em' }}>{sec.heading}</h3>
                  <p style={{ fontSize: 14, color: '#888899', lineHeight: 1.9 }}>{sec.body}</p>
                  {sec.highlight && (
                    <div style={{ marginTop: 14, padding: '10px 16px', background: `${catColor}0a`, borderLeft: `2px solid ${catColor}`, borderRadius: '0 6px 6px 0', fontSize: 13, color: catColor, fontWeight: 600 }}>{sec.highlight}</div>
                  )}
                </div>
              ))}

              {lesson.content.signal_table?.length > 0 && (
                <div style={{ ...s.card, padding: 0, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 20px 10px', fontSize: 10, color: '#555566', fontFamily: 'var(--font-space)', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', borderBottom: '1px solid #1e1e2e' }}>Signal Table</div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead><tr style={{ borderBottom: '1px solid #1e1e2e' }}>
                      {['상황', '의미', '대응'].map(h => <th key={h} style={{ padding: '8px 16px', textAlign: 'left', color: '#555566', fontWeight: 500, fontSize: 10, fontFamily: 'var(--font-space)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{h}</th>)}
                    </tr></thead>
                    <tbody>
                      {lesson.content.signal_table.map((row, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #1a1a24' }}>
                          <td style={{ padding: '10px 16px', fontSize: 13 }}>{row.situation}</td>
                          <td style={{ padding: '10px 16px', color: '#888899', fontSize: 13 }}>{row.meaning}</td>
                          <td style={{ padding: '10px 16px', color: row.direction === 'up' ? '#e05c5c' : row.direction === 'down' ? '#4ecdc4' : '#c8a96e', fontWeight: 600, fontSize: 13 }}>{row.action}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {lesson.market_context && (
                <div style={{ ...s.card, background: 'linear-gradient(135deg,rgba(200,169,110,0.04),rgba(78,205,196,0.02))', border: '1px solid rgba(200,169,110,0.12)' }}>
                  <div style={{ ...s.label, color: '#4ecdc4' }}>Market Context</div>
                  <p style={{ fontSize: 14, color: '#888899', lineHeight: 1.9 }}>{lesson.market_context}</p>
                </div>
              )}

              <div style={{ display: 'flex', gap: 14, padding: '16px 20px', background: `${catColor}08`, borderLeft: `2px solid ${catColor}`, borderRadius: '0 10px 10px 0', marginBottom: 16 }}>
                <span style={{ fontSize: 18 }}>💡</span>
                <div>
                  <div style={{ fontSize: 10, color: '#555566', fontFamily: 'var(--font-space)', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>Key Takeaway</div>
                  <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.7, fontFamily: 'var(--font-space)' }}>{lesson.key_point}</div>
                </div>
              </div>

              {lesson.content.daily_checklist?.length > 0 && (
                <div style={s.card}>
                  <div style={s.label}>Daily Checklist</div>
                  {lesson.content.daily_checklist.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, padding: '9px 0', borderBottom: i < lesson.content.daily_checklist.length - 1 ? '1px solid #1e1e2e' : 'none', fontSize: 13, color: '#888899' }}>
                      <span style={{ color: catColor, fontFamily: 'var(--font-space)', fontWeight: 600, flexShrink: 0, fontSize: 11 }}>{String(i + 1).padStart(2, '0')}</span>
                      {item}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ══════════════════════════════════
          TAB 3: ARCHIVE
      ══════════════════════════════════ */}
      {activeTab === 'archive' && (
        <div className="animate-fade-up">
          <div style={s.label}>Lesson Archive</div>
          {pastLessons.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#555566', fontSize: 14 }}>아직 아카이브가 없습니다</div>
          ) : (
            pastLessons.map((l) => {
              const cc = CATEGORY_COLORS[l.category] ?? '#c8a96e'
              return (
                <div key={l.id} style={{ background: '#111117', border: '1px solid #1e1e2e', borderRadius: 12, padding: '14px 18px', marginBottom: 10, display: 'flex', gap: 14, transition: 'border-color 0.2s' }}>
                  <div style={{ fontFamily: 'var(--font-space)', fontSize: 11, fontWeight: 600, color: cc, background: `${cc}18`, border: `1px solid ${cc}30`, borderRadius: 6, padding: '3px 10px', whiteSpace: 'nowrap', marginTop: 2 }}>Day {l.day_number}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: '#555566', fontFamily: 'var(--font-space)', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{l.date} · {l.topic}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, fontFamily: 'var(--font-space)', letterSpacing: '-0.01em' }}>{l.title}</div>
                    <div style={{ fontSize: 12, color: '#555566', lineHeight: 1.5 }}>{l.key_point}</div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      <footer style={{ textAlign: 'center', marginTop: 60, paddingTop: 24, borderTop: '1px solid #1e1e2e', color: '#333344', fontSize: 11, lineHeight: 1.8, fontFamily: 'var(--font-space)' }}>
        <p>For educational purposes only · Not investment advice</p>
        <p>© 2026 Heejeong's Desk</p>
      </footer>

    </div>
  )
}
