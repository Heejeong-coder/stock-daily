'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

interface Lesson {
  id: string
  date: string
  day_number: number
  topic: string
  category: string
  title: string
  intro: string
  content: {
    sections: { heading: string; body: string; highlight?: string }[]
    signal_table: { situation: string; meaning: string; action: string; direction: string }[]
    daily_checklist: string[]
  }
  key_point: string
  market_context: string
  quiz: { question: string; options: string[]; answer: number; explanation: string }
}

interface Brief {
  kospi_comment: string
  key_indicators: Record<string, string>
  foreign_net: string
  risk_level: number
  watch_list: string[]
  ai_comment: string
}

const CATEGORY_COLORS: Record<string, string> = {
  '수급': '#c8a96e',
  '밸류': '#4ecdc4',
  '외인': '#5dbb7a',
  '신용': '#e05c5c',
  '매크로': '#a78bfa',
  '섹터': '#f59e0b',
  '파생': '#ec4899',
  '차트': '#60a5fa',
  '실전': '#34d399',
}

export default function Home() {
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [brief, setBrief] = useState<Brief | null>(null)
  const [loading, setLoading] = useState(true)
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [pastLessons, setPastLessons] = useState<Lesson[]>([])
  const [activeTab, setActiveTab] = useState<'lesson' | 'brief' | 'archive'>('lesson')

  useEffect(() => {
    fetchToday()
    fetchPastLessons()
  }, [])

  async function fetchToday() {
    const res = await fetch('/api/market')
    const data = await res.json()
    setLesson(data.lesson)
    setBrief(data.brief)
    setLoading(false)
  }

  async function fetchPastLessons() {
    const res = await fetch('/api/lessons?limit=20')
    const data = await res.json()
    setPastLessons(Array.isArray(data) ? data.slice(1) : [])
  }

  const today = format(new Date(), 'yyyy년 M월 d일 (EEE)', { locale: ko })
  const catColor = lesson ? (CATEGORY_COLORS[lesson.category] ?? '#c8a96e') : '#c8a96e'

  return (
    <div style={{ position: 'relative', zIndex: 1, maxWidth: 760, margin: '0 auto', padding: '40px 20px 80px' }}>

      {/* 헤더 */}
      <div style={{ textAlign: 'center', marginBottom: 48, paddingBottom: 32, borderBottom: '1px solid #2a2a3a' }}>
        <div style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 11, color: '#c8a96e', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 16 }}>
          주식 기초 마스터 클래스
        </div>
        <h1 style={{ fontSize: 'clamp(26px,5vw,40px)', fontWeight: 700, lineHeight: 1.2, marginBottom: 12 }}>
          매일 아침 <span style={{ color: '#c8a96e' }}>한 레슨</span>
        </h1>
        <p style={{ color: '#888899', fontSize: 14 }}>전문가들이 매일 보는 지표 — 읽다 보면 시장이 보입니다</p>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 16, background: 'rgba(200,169,110,0.1)', border: '1px solid rgba(200,169,110,0.3)', borderRadius: 4, padding: '6px 14px', fontFamily: 'var(--font-jetbrains)', fontSize: 12, color: '#c8a96e' }}>
          <div style={{ width: 6, height: 6, background: '#c8a96e', borderRadius: '50%', animation: 'pulse 2s infinite' }} />
          {today}
        </div>
      </div>

      {/* 탭 */}
      <div style={{ display: 'flex', gap: 4, background: '#111118', border: '1px solid #2a2a3a', borderRadius: 8, padding: 4, marginBottom: 32 }}>
        {(['lesson', 'brief', 'archive'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ flex: 1, padding: '8px 12px', border: 'none', cursor: 'pointer', borderRadius: 6, fontSize: 13, fontFamily: 'var(--font-noto-serif)', transition: 'all 0.2s',
              background: activeTab === tab ? '#c8a96e' : 'transparent',
              color: activeTab === tab ? '#0a0a0f' : '#888899',
              fontWeight: activeTab === tab ? 600 : 400 }}>
            {tab === 'lesson' ? '📚 오늘 레슨' : tab === 'brief' ? '📊 시장 브리핑' : '🗂️ 지난 레슨'}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#888899' }}>
          <div style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 13 }}>오늘의 레슨 불러오는 중...</div>
        </div>
      )}

      {/* 오늘 레슨 탭 */}
      {!loading && activeTab === 'lesson' && (
        <>
          {!lesson ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#888899' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>⏰</div>
              <div style={{ fontSize: 16, marginBottom: 8 }}>오늘 레슨이 아직 준비 중입니다</div>
              <div style={{ fontSize: 13, fontFamily: 'var(--font-jetbrains)' }}>매일 오전 6시에 업데이트됩니다</div>
            </div>
          ) : (
            <div className="animate-fade-up">

              {/* 레슨 헤더 카드 */}
              <div style={{ background: '#111118', border: '1px solid #2a2a3a', borderRadius: 12, padding: '24px', marginBottom: 20, borderTop: `3px solid ${catColor}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 11, color: catColor, background: `${catColor}22`, border: `1px solid ${catColor}44`, borderRadius: 4, padding: '3px 8px' }}>
                    Day {lesson.day_number}
                  </span>
                  <span style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 11, color: '#888899', background: '#1a1a24', border: '1px solid #2a2a3a', borderRadius: 4, padding: '3px 8px' }}>
                    {lesson.category}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: '#888899', fontFamily: 'var(--font-jetbrains)', marginBottom: 8 }}>오늘의 주제: {lesson.topic}</div>
                <h2 style={{ fontSize: 'clamp(18px,3vw,24px)', fontWeight: 700, marginBottom: 12, lineHeight: 1.3 }}>{lesson.title}</h2>
                <p style={{ color: '#888899', fontSize: 14, lineHeight: 1.8 }}>{lesson.intro}</p>
              </div>

              {/* 본문 섹션들 */}
              {lesson.content.sections.map((sec, i) => (
                <div key={i} style={{ background: '#111118', border: '1px solid #2a2a3a', borderRadius: 12, padding: '20px 24px', marginBottom: 12 }}>
                  <div style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 11, color: catColor, letterSpacing: 1, marginBottom: 10 }}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>{sec.heading}</h3>
                  <p style={{ fontSize: 14, color: '#b8b4ac', lineHeight: 1.8 }}>{sec.body}</p>
                  {sec.highlight && (
                    <div style={{ marginTop: 12, padding: '10px 14px', background: `${catColor}0d`, borderLeft: `3px solid ${catColor}`, borderRadius: '0 6px 6px 0', fontSize: 13, color: catColor, fontWeight: 600 }}>
                      {sec.highlight}
                    </div>
                  )}
                </div>
              ))}

              {/* 신호 테이블 */}
              {lesson.content.signal_table?.length > 0 && (
                <div style={{ background: '#111118', border: '1px solid #2a2a3a', borderRadius: 12, overflow: 'hidden', marginBottom: 12 }}>
                  <div style={{ padding: '16px 24px 12px', fontFamily: 'var(--font-jetbrains)', fontSize: 11, color: '#888899', letterSpacing: 2, borderBottom: '1px solid #2a2a3a' }}>
                    신호 읽기
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #2a2a3a' }}>
                        {['상황', '의미', '대응'].map(h => (
                          <th key={h} style={{ padding: '8px 16px', textAlign: 'left', color: '#888899', fontWeight: 400, fontFamily: 'var(--font-jetbrains)', fontSize: 11 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {lesson.content.signal_table.map((row, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #1a1a24' }}>
                          <td style={{ padding: '10px 16px', color: '#e8e4dc' }}>{row.situation}</td>
                          <td style={{ padding: '10px 16px', color: '#888899' }}>{row.meaning}</td>
                          <td style={{ padding: '10px 16px', color: row.direction === 'up' ? '#e05c5c' : row.direction === 'down' ? '#4ecdc4' : '#c8a96e', fontWeight: 600 }}>
                            {row.action}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* 오늘 시장 맥락 */}
              {lesson.market_context && (
                <div style={{ background: 'linear-gradient(135deg, rgba(200,169,110,0.06), rgba(78,205,196,0.04))', border: '1px solid rgba(200,169,110,0.2)', borderRadius: 12, padding: '20px 24px', marginBottom: 12 }}>
                  <div style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 11, color: '#4ecdc4', letterSpacing: 2, marginBottom: 10 }}>▶ 지금 시장과 연결하면</div>
                  <p style={{ fontSize: 14, color: '#b8b4ac', lineHeight: 1.8 }}>{lesson.market_context}</p>
                </div>
              )}

              {/* 핵심 포인트 */}
              <div style={{ display: 'flex', gap: 12, padding: '16px 20px', background: 'rgba(200,169,110,0.05)', borderLeft: `3px solid ${catColor}`, borderRadius: '0 8px 8px 0', marginBottom: 20 }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
                <div>
                  <div style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 10, color: '#888899', letterSpacing: 2, marginBottom: 6 }}>오늘의 핵심</div>
                  <div style={{ fontSize: 14, color: '#e8e4dc', lineHeight: 1.7, fontWeight: 600 }}>{lesson.key_point}</div>
                </div>
              </div>

              {/* 데일리 체크리스트 */}
              {lesson.content.daily_checklist?.length > 0 && (
                <div style={{ background: '#111118', border: '1px solid #2a2a3a', borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
                  <div style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 11, color: '#888899', letterSpacing: 2, marginBottom: 14 }}>매일 확인 체크리스트</div>
                  {lesson.content.daily_checklist.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: i < lesson.content.daily_checklist.length - 1 ? '1px solid #1a1a24' : 'none', fontSize: 13, color: '#888899', lineHeight: 1.6 }}>
                      <span style={{ color: catColor, flexShrink: 0, fontFamily: 'var(--font-jetbrains)' }}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      {item}
                    </div>
                  ))}
                </div>
              )}

              {/* 퀴즈 */}
              {lesson.quiz && (
                <div style={{ background: '#111118', border: '1px solid #2a2a3a', borderRadius: 12, padding: '24px', marginBottom: 20 }}>
                  <div style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 11, color: '#888899', letterSpacing: 2, marginBottom: 14 }}>오늘의 퀴즈</div>
                  <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, lineHeight: 1.5 }}>{lesson.quiz.question}</p>
                  <div style={{ display: 'grid', gap: 8 }}>
                    {lesson.quiz.options.map((opt, i) => {
                      const isSelected = quizAnswer === i
                      const isCorrect = i === lesson.quiz.answer
                      const showResult = quizAnswer !== null
                      let bg = '#1a1a24'
                      let border = '#2a2a3a'
                      let color = '#888899'
                      if (showResult && isCorrect) { bg = 'rgba(93,187,122,0.1)'; border = '#5dbb7a'; color = '#5dbb7a' }
                      else if (showResult && isSelected && !isCorrect) { bg = 'rgba(224,92,92,0.1)'; border = '#e05c5c'; color = '#e05c5c' }
                      else if (isSelected) { bg = 'rgba(200,169,110,0.1)'; border = '#c8a96e'; color = '#c8a96e' }
                      return (
                        <button key={i} onClick={() => { if (quizAnswer === null) { setQuizAnswer(i); setShowExplanation(true) } }}
                          style={{ padding: '12px 16px', background: bg, border: `1px solid ${border}`, borderRadius: 8, color, textAlign: 'left', cursor: quizAnswer === null ? 'pointer' : 'default', fontSize: 13, lineHeight: 1.5, transition: 'all 0.2s', fontFamily: 'var(--font-noto-serif)' }}>
                          <span style={{ fontFamily: 'var(--font-jetbrains)', marginRight: 8 }}>{['A', 'B', 'C', 'D'][i]}.</span>
                          {opt}
                        </button>
                      )
                    })}
                  </div>
                  {showExplanation && (
                    <div style={{ marginTop: 16, padding: '14px 16px', background: 'rgba(93,187,122,0.08)', border: '1px solid rgba(93,187,122,0.3)', borderRadius: 8, fontSize: 13, color: '#5dbb7a', lineHeight: 1.7 }}>
                      <strong>해설:</strong> {lesson.quiz.explanation}
                    </div>
                  )}
                </div>
              )}

            </div>
          )}
        </>
      )}

      {/* 시장 브리핑 탭 */}
      {!loading && activeTab === 'brief' && (
        <div className="animate-fade-up">
          {!brief ? (
            <div style={{ textAlign: 'center', padding: '80px 0', color: '#888899' }}>
              <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
              <div>오늘 브리핑이 아직 준비 중입니다</div>
            </div>
          ) : (
            <>
              {/* 리스크 레벨 */}
              <div style={{ background: '#111118', border: '1px solid #2a2a3a', borderRadius: 12, padding: '24px', marginBottom: 16 }}>
                <div style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 11, color: '#888899', letterSpacing: 2, marginBottom: 14 }}>오늘 리스크 레벨</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <div key={n} style={{ flex: 1, height: 8, borderRadius: 4, background: n <= brief.risk_level ? (brief.risk_level >= 4 ? '#e05c5c' : brief.risk_level === 3 ? '#c8a96e' : '#5dbb7a') : '#2a2a3a' }} />
                  ))}
                </div>
                <div style={{ fontSize: 14, color: '#b8b4ac', lineHeight: 1.7 }}>{brief.kospi_comment}</div>
              </div>

              {/* 주요 지표 */}
              <div style={{ background: '#111118', border: '1px solid #2a2a3a', borderRadius: 12, padding: '24px', marginBottom: 16 }}>
                <div style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 11, color: '#888899', letterSpacing: 2, marginBottom: 14 }}>주요 수급 지표</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: 12 }}>
                  {Object.entries(brief.key_indicators).map(([key, val]) => (
                    <div key={key} style={{ background: '#1a1a24', borderRadius: 8, padding: '12px 14px' }}>
                      <div style={{ fontSize: 11, color: '#888899', marginBottom: 4 }}>{key}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#e8e4dc' }}>{val as string}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 주목할 이벤트 */}
              <div style={{ background: '#111118', border: '1px solid #2a2a3a', borderRadius: 12, padding: '24px', marginBottom: 16 }}>
                <div style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 11, color: '#888899', letterSpacing: 2, marginBottom: 14 }}>이번 주 주목할 이벤트</div>
                {brief.watch_list.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: i < brief.watch_list.length - 1 ? '1px solid #1a1a24' : 'none', fontSize: 13, color: '#b8b4ac' }}>
                    <span style={{ color: '#c8a96e', fontFamily: 'var(--font-jetbrains)', flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</span>
                    {item}
                  </div>
                ))}
              </div>

              {/* AI 코멘트 */}
              <div style={{ background: 'linear-gradient(135deg, rgba(200,169,110,0.06), rgba(78,205,196,0.04))', border: '1px solid rgba(200,169,110,0.2)', borderRadius: 12, padding: '24px' }}>
                <div style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 11, color: '#4ecdc4', letterSpacing: 2, marginBottom: 12 }}>▶ 오늘 시장 한마디</div>
                <p style={{ fontSize: 14, color: '#b8b4ac', lineHeight: 1.8 }}>{brief.ai_comment}</p>
              </div>
            </>
          )}
        </div>
      )}

      {/* 지난 레슨 탭 */}
      {activeTab === 'archive' && (
        <div className="animate-fade-up">
          <div style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 11, color: '#888899', letterSpacing: 2, marginBottom: 16 }}>지난 레슨 아카이브</div>
          {pastLessons.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#888899', fontSize: 14 }}>아직 아카이브가 없습니다</div>
          ) : (
            pastLessons.map((l, i) => {
              const cc = CATEGORY_COLORS[l.category] ?? '#c8a96e'
              return (
                <div key={l.id} style={{ background: '#111118', border: '1px solid #2a2a3a', borderRadius: 10, padding: '16px 20px', marginBottom: 10, display: 'flex', gap: 14, alignItems: 'flex-start', animationDelay: `${i * 0.05}s` }} className="animate-fade-up">
                  <div style={{ fontFamily: 'var(--font-jetbrains)', fontSize: 11, color: cc, background: `${cc}22`, border: `1px solid ${cc}44`, borderRadius: 4, padding: '3px 8px', whiteSpace: 'nowrap', marginTop: 2 }}>
                    Day {l.day_number}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: '#888899', fontFamily: 'var(--font-jetbrains)', marginBottom: 4 }}>
                      {l.date} · {l.topic}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{l.title}</div>
                    <div style={{ fontSize: 12, color: '#888899', lineHeight: 1.5 }}>{l.key_point}</div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* 면책 고지 */}
      <div style={{ textAlign: 'center', marginTop: 48, paddingTop: 32, borderTop: '1px solid #2a2a3a', color: '#888899', fontSize: 12, lineHeight: 1.8 }}>
        <p>본 자료는 투자 교육 목적으로 제공되며 투자 권유가 아닙니다.</p>
        <p>모든 투자 판단과 그에 따른 결과는 투자자 본인에게 있습니다.</p>
      </div>

    </div>
  )
}
