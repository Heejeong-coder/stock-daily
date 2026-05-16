import Anthropic from '@anthropic-ai/sdk'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// 커리큘럼 — 순환하며 매일 다른 주제
const CURRICULUM = [
  { topic: '투자자 예탁금', category: '수급', icon: '💰' },
  { topic: 'PER·PBR 밸류에이션', category: '밸류', icon: '📊' },
  { topic: '외국인 수급과 환율', category: '외인', icon: '🌐' },
  { topic: '신용융자와 반대매매', category: '신용', icon: '⚠️' },
  { topic: '금리와 주가의 관계', category: '매크로', icon: '🏦' },
  { topic: '공매도와 쇼트스퀴즈', category: '신용', icon: '🔻' },
  { topic: '어닝서프라이즈와 컨센서스', category: '밸류', icon: '📈' },
  { topic: '코스피·코스닥 지수 구조', category: '수급', icon: '📉' },
  { topic: 'MSCI와 패시브 자금', category: '외인', icon: '🌍' },
  { topic: '사이드카와 서킷브레이커', category: '수급', icon: '🚨' },
  { topic: '배당과 주주환원', category: '밸류', icon: '💵' },
  { topic: '업종 사이클 읽기', category: '매크로', icon: '🔄' },
  { topic: '프로그램 매매와 ETF', category: '수급', icon: '🤖' },
  { topic: '선물·옵션 기초', category: '파생', icon: '⚡' },
  { topic: '차트 기술적 분석 입문', category: '차트', icon: '📐' },
  { topic: 'HBM과 반도체 사이클', category: '섹터', icon: '🔬' },
  { topic: '방산주 수급 구조', category: '섹터', icon: '🛡️' },
  { topic: '바이오 임상과 주가', category: '섹터', icon: '💊' },
  { topic: '환율 헤지와 환노출', category: '외인', icon: '💱' },
  { topic: '수급 매일 루틴', category: '실전', icon: '🗓️' },
]

export async function generateDailyContent(dayNumber: number, dateStr: string) {
  const curriculum = CURRICULUM[(dayNumber - 1) % CURRICULUM.length]
  const dateLabel = format(new Date(dateStr), 'M월 d일 (EEE)', { locale: ko })

  const prompt = `
당신은 한국 주식시장 전문가이자 뛰어난 교육자입니다.
오늘(${dateLabel})의 주식 기초 레슨을 만들어주세요.

오늘의 주제: "${curriculum.topic}" (${curriculum.category} 카테고리)
누적 Day: ${dayNumber}일차

다음 JSON 형식으로만 응답하세요. 다른 텍스트는 절대 포함하지 마세요.

{
  "title": "레슨 제목 (흥미롭고 구체적으로, 20자 이내)",
  "intro": "오늘 배울 내용 소개 (2~3문장, 왜 중요한지 포함)",
  "content": {
    "sections": [
      {
        "heading": "섹션 제목",
        "body": "본문 내용 (3~5문장, 구체적 수치와 예시 포함)",
        "highlight": "이 섹션의 핵심 한 줄 (선택사항)"
      }
    ],
    "signal_table": [
      {
        "situation": "상황 설명",
        "meaning": "의미",
        "action": "투자자 대응",
        "direction": "up|down|neutral"
      }
    ],
    "daily_checklist": [
      "매일 확인할 항목 1",
      "매일 확인할 항목 2",
      "매일 확인할 항목 3"
    ]
  },
  "key_point": "오늘의 핵심 한 줄 (실전에서 바로 쓸 수 있는 인사이트)",
  "market_context": "현재 2026년 5월 한국 시장 상황과 오늘 주제의 연결고리 (2~3문장)",
  "quiz": {
    "question": "오늘 배운 내용 확인 퀴즈",
    "options": ["선택지 A", "선택지 B", "선택지 C", "선택지 D"],
    "answer": 0,
    "explanation": "정답 해설"
  }
}

요구사항:
- 실제 수치와 예시를 반드시 포함 (예: 신용융자 35조, PER 5.2배 등)
- 초보자도 이해할 수 있되 전문적인 깊이 유지
- 오늘 날짜(${dateLabel}) 기준 현재 시장 맥락 반영
- 한국어로 작성
- JSON만 출력, 마크다운 코드블록 없이
`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const clean = text.replace(/```json|```/g, '').trim()
  const parsed = JSON.parse(clean)

  return {
    topic: curriculum.topic,
    category: curriculum.category,
    ...parsed
  }
}

export async function generateMarketBrief(dateStr: string) {
  const dateLabel = format(new Date(dateStr), 'M월 d일 (EEE)', { locale: ko })

  const prompt = `
당신은 한국 주식시장 전문 애널리스트입니다.
${dateLabel} 기준 시장 브리핑을 JSON으로 작성해주세요.

다음 JSON 형식으로만 응답하세요:

{
  "kospi_comment": "코스피 현황 한 줄 평 (오늘 시장 상황 반영)",
  "key_indicators": {
    "예탁금": "수준 및 방향 (예: 역대 최고, 상승 중)",
    "신용잔고": "수준 (예: 35조, 역대 최고)",
    "환율": "원달러 환율 방향",
    "외국인": "오늘 수급 방향"
  },
  "foreign_net": "외국인 수급 한 줄 요약",
  "risk_level": 3,
  "watch_list": [
    "오늘/이번 주 주목할 이벤트 1",
    "오늘/이번 주 주목할 이벤트 2",
    "오늘/이번 주 주목할 이벤트 3"
  ],
  "ai_comment": "오늘 시장에 대한 전문가 코멘트 (3~4문장, 투자자에게 도움이 되는 인사이트)"
}

risk_level: 1(매우 안전) ~ 5(매우 위험)
2026년 5월 현재 시장 상황 (코스피 7000대, 반도체 호황, 외국인 유입, 삼성전자 파업 이슈 등) 반영
JSON만 출력, 코드블록 없이
`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}
