import Anthropic from '@anthropic-ai/sdk'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const CURRICULUM = [
  { topic: '투자자 예탁금', category: '수급' },
  { topic: 'PER·PBR 밸류에이션', category: '밸류' },
  { topic: '외국인 수급과 환율', category: '외인' },
  { topic: '신용융자와 반대매매', category: '신용' },
  { topic: '금리와 주가의 관계', category: '매크로' },
  { topic: '공매도와 쇼트스퀴즈', category: '신용' },
  { topic: '어닝서프라이즈와 컨센서스', category: '밸류' },
  { topic: 'MSCI와 패시브 자금', category: '외인' },
  { topic: '사이드카와 서킷브레이커', category: '수급' },
  { topic: '배당과 주주환원', category: '밸류' },
  { topic: 'HBM과 반도체 사이클', category: '섹터' },
  { topic: '방산주 수급 구조', category: '섹터' },
  { topic: '수급 매일 루틴', category: '실전' },
]

function getField(text: string, key: string): string {
  const match = text.match(new RegExp(`${key}:\\s*(.+)`))
  return match ? match[1].trim() : ''
}

// 실시간 시장 데이터 가져오기
async function fetchMarketData(dateStr: string): Promise<string> {
  const dateLabel = format(new Date(dateStr), 'M월 d일', { locale: ko })
  
  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1000,
    tools: [{ type: 'web_search_20250305' as any, name: 'web_search' }],
    messages: [{
      role: 'user',
      content: `${dateLabel} 기준 한국 주식시장 현황을 검색해서 아래 형식으로 알려주세요:
코스피지수, 원달러환율, 신용융자잔고, 외국인수급, 주요이슈
한 문단으로 요약해주세요.`
    }]
  })

  const textContent = response.content.find((c: any) => c.type === 'text')
  return textContent ? (textContent as any).text : '시장 데이터 없음'
}

export async function generateDailyContent(dayNumber: number, dateStr: string) {
  const curriculum = CURRICULUM[(dayNumber - 1) % CURRICULUM.length]
  const dateLabel = format(new Date(dateStr), 'M월 d일 (EEE)', { locale: ko })

  // 실시간 시장 데이터 가져오기
  let marketData = ''
  try {
    marketData = await fetchMarketData(dateStr)
  } catch {
    marketData = '시장 데이터 조회 실패'
  }

  const prompt = `한국 주식시장 전문가로서 오늘(${dateLabel}) 주식 기초 레슨을 만들어주세요.
주제: "${curriculum.topic}" (${curriculum.category}) Day ${dayNumber}일차

오늘의 실시간 시장 현황:
${marketData}

위 시장 데이터를 레슨에 반드시 반영하세요.

아래 필드를 채워주세요:
TITLE: (20자 이내 제목)
INTRO: (2문장 소개)
SECTION1_HEAD: (섹션1 제목)
SECTION1_BODY: (3문장 본문, 실제 수치 포함)
SECTION1_HIGHLIGHT: (핵심 한줄)
SECTION2_HEAD: (섹션2 제목)
SECTION2_BODY: (3문장 본문)
SIGNAL1_SITUATION: (상황1)
SIGNAL1_MEANING: (의미1)
SIGNAL1_ACTION: (대응1)
SIGNAL1_DIRECTION: (up 또는 down 또는 neutral)
SIGNAL2_SITUATION: (상황2)
SIGNAL2_MEANING: (의미2)
SIGNAL2_ACTION: (대응2)
SIGNAL2_DIRECTION: (up 또는 down 또는 neutral)
CHECK1: (체크항목1)
CHECK2: (체크항목2)
CHECK3: (체크항목3)
KEYPOINT: (핵심 한줄)
CONTEXT: (오늘 실시간 시장 데이터 기반 연결 2문장)
QUIZ_Q: (퀴즈 질문)
QUIZ_A: (보기A)
QUIZ_B: (보기B)
QUIZ_C: (보기C)
QUIZ_D: (보기D)
QUIZ_ANSWER: (0~3 숫자)
QUIZ_EXPLAIN: (해설 1문장)`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''

  return {
    topic: curriculum.topic,
    category: curriculum.category,
    title: getField(text, 'TITLE'),
    intro: getField(text, 'INTRO'),
    content: {
      sections: [
        { heading: getField(text, 'SECTION1_HEAD'), body: getField(text, 'SECTION1_BODY'), highlight: getField(text, 'SECTION1_HIGHLIGHT') },
        { heading: getField(text, 'SECTION2_HEAD'), body: getField(text, 'SECTION2_BODY'), highlight: '' },
      ],
      signal_table: [
        { situation: getField(text, 'SIGNAL1_SITUATION'), meaning: getField(text, 'SIGNAL1_MEANING'), action: getField(text, 'SIGNAL1_ACTION'), direction: getField(text, 'SIGNAL1_DIRECTION') },
        { situation: getField(text, 'SIGNAL2_SITUATION'), meaning: getField(text, 'SIGNAL2_MEANING'), action: getField(text, 'SIGNAL2_ACTION'), direction: getField(text, 'SIGNAL2_DIRECTION') },
      ],
      daily_checklist: [getField(text, 'CHECK1'), getField(text, 'CHECK2'), getField(text, 'CHECK3')],
    },
    key_point: getField(text, 'KEYPOINT'),
    market_context: getField(text, 'CONTEXT'),
    quiz: {
      question: getField(text, 'QUIZ_Q'),
      options: [getField(text, 'QUIZ_A'), getField(text, 'QUIZ_B'), getField(text, 'QUIZ_C'), getField(text, 'QUIZ_D')],
      answer: parseInt(getField(text, 'QUIZ_ANSWER')) || 0,
      explanation: getField(text, 'QUIZ_EXPLAIN'),
    }
  }
}

export async function generateMarketBrief(dateStr: string) {
  const dateLabel = format(new Date(dateStr), 'M월 d일 (EEE)', { locale: ko })

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 4000,
    tools: [{ type: 'web_search_20250305' as any, name: 'web_search' }],
    messages: [{
      role: 'user',
      content: `${dateLabel} 한국 주식시장 현황을 검색해서 브리핑을 작성하세요.
코스피 지수, 환율, 신용융자잔고, 외국인 수급, 주요 이슈를 검색 후 아래 형식으로 작성:

KOSPI_COMMENT: (코스피 한줄평, 실제 수치 포함)
INDICATOR_예탁금: (실제 수준)
INDICATOR_신용잔고: (실제 수준)
INDICATOR_환율: (실제 환율)
INDICATOR_외국인: (수급 방향)
FOREIGN_NET: (외국인 수급 요약)
RISK_LEVEL: (1~5 숫자)
WATCH1: (이번주 주목 이벤트1)
WATCH2: (이번주 주목 이벤트2)
WATCH3: (이번주 주목 이벤트3)
AI_COMMENT: (오늘 시장 코멘트 3문장, 실제 수치 기반)`
    }]
  })

  const textContent = response.content.find((c: any) => c.type === 'text')
  const text = textContent ? (textContent as any).text : ''

  return {
    kospi_comment: getField(text, 'KOSPI_COMMENT'),
    key_indicators: {
      예탁금: getField(text, 'INDICATOR_예탁금'),
      신용잔고: getField(text, 'INDICATOR_신용잔고'),
      환율: getField(text, 'INDICATOR_환율'),
      외국인: getField(text, 'INDICATOR_외국인'),
    },
    foreign_net: getField(text, 'FOREIGN_NET'),
    risk_level: parseInt(getField(text, 'RISK_LEVEL')) || 3,
    watch_list: [getField(text, 'WATCH1'), getField(text, 'WATCH2'), getField(text, 'WATCH3')],
    ai_comment: getField(text, 'AI_COMMENT'),
  }
}