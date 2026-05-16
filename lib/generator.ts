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

export async function generateDailyContent(dayNumber: number, dateStr: string) {
  const curriculum = CURRICULUM[(dayNumber - 1) % CURRICULUM.length]
  const dateLabel = format(new Date(dateStr), 'M월 d일 (EEE)', { locale: ko })

  const prompt = `한국 주식시장 전문가로서 오늘(${dateLabel}) 주식 기초 레슨을 만들어주세요.
주제: "${curriculum.topic}" (${curriculum.category}) Day ${dayNumber}일차

아래 필드를 채워주세요. 각 필드는 짧고 명확하게:
TITLE: (20자 이내 제목)
INTRO: (2문장 소개)
SECTION1_HEAD: (섹션1 제목)
SECTION1_BODY: (3문장 본문)
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
CONTEXT: (현재 시장과 연결 2문장)
QUIZ_Q: (퀴즈 질문)
QUIZ_A: (정답 A)
QUIZ_B: (정답 B)
QUIZ_C: (정답 C)
QUIZ_D: (정답 D)
QUIZ_ANSWER: (0~3 숫자)
QUIZ_EXPLAIN: (해설 1문장)`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  
  function getField(key: string): string {
    const match = text.match(new RegExp(`${key}:\\s*(.+)`))
    return match ? match[1].trim() : ''
  }

  return {
    topic: curriculum.topic,
    category: curriculum.category,
    title: getField('TITLE'),
    intro: getField('INTRO'),
    content: {
      sections: [
        { heading: getField('SECTION1_HEAD'), body: getField('SECTION1_BODY'), highlight: getField('SECTION1_HIGHLIGHT') },
        { heading: getField('SECTION2_HEAD'), body: getField('SECTION2_BODY'), highlight: '' },
      ],
      signal_table: [
        { situation: getField('SIGNAL1_SITUATION'), meaning: getField('SIGNAL1_MEANING'), action: getField('SIGNAL1_ACTION'), direction: getField('SIGNAL1_DIRECTION') },
        { situation: getField('SIGNAL2_SITUATION'), meaning: getField('SIGNAL2_MEANING'), action: getField('SIGNAL2_ACTION'), direction: getField('SIGNAL2_DIRECTION') },
      ],
      daily_checklist: [getField('CHECK1'), getField('CHECK2'), getField('CHECK3')],
    },
    key_point: getField('KEYPOINT'),
    market_context: getField('CONTEXT'),
    quiz: {
      question: getField('QUIZ_Q'),
      options: [getField('QUIZ_A'), getField('QUIZ_B'), getField('QUIZ_C'), getField('QUIZ_D')],
      answer: parseInt(getField('QUIZ_ANSWER')) || 0,
      explanation: getField('QUIZ_EXPLAIN'),
    }
  }
}

export async function generateMarketBrief(dateStr: string) {
  const dateLabel = format(new Date(dateStr), 'M월 d일 (EEE)', { locale: ko })

  const prompt = `한국 주식시장 애널리스트로서 ${dateLabel} 시장 브리핑을 작성하세요.

KOSPI_COMMENT: (코스피 한줄평)
INDICATOR_예탁금: (수준)
INDICATOR_신용잔고: (수준)
INDICATOR_환율: (방향)
INDICATOR_외국인: (수급)
FOREIGN_NET: (외국인 수급 요약)
RISK_LEVEL: (1~5 숫자)
WATCH1: (이벤트1)
WATCH2: (이벤트2)
WATCH3: (이벤트3)
AI_COMMENT: (오늘 시장 코멘트 3문장)`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  
  function getField(key: string): string {
    const match = text.match(new RegExp(`${key}:\\s*(.+)`))
    return match ? match[1].trim() : ''
  }

  return {
    kospi_comment: getField('KOSPI_COMMENT'),
    key_indicators: {
      예탁금: getField('INDICATOR_예탁금'),
      신용잔고: getField('INDICATOR_신용잔고'),
      환율: getField('INDICATOR_환율'),
      외국인: getField('INDICATOR_외국인'),
    },
    foreign_net: getField('FOREIGN_NET'),
    risk_level: parseInt(getField('RISK_LEVEL')) || 3,
    watch_list: [getField('WATCH1'), getField('WATCH2'), getField('WATCH3')],
    ai_comment: getField('AI_COMMENT'),
  }
}