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
  { topic: '코스피·코스닥 지수 구조', category: '수급' },
  { topic: 'MSCI와 패시브 자금', category: '외인' },
  { topic: '사이드카와 서킷브레이커', category: '수급' },
  { topic: '배당과 주주환원', category: '밸류' },
  { topic: '업종 사이클 읽기', category: '매크로' },
  { topic: '프로그램 매매와 ETF', category: '수급' },
  { topic: 'HBM과 반도체 사이클', category: '섹터' },
  { topic: '방산주 수급 구조', category: '섹터' },
  { topic: '바이오 임상과 주가', category: '섹터' },
  { topic: '수급 매일 루틴', category: '실전' },
]

function safeParseJSON(text: string): any {
  let clean = text.replace(/```json|```/g, '').trim()
  try {
    return JSON.parse(clean)
  } catch {
    let fixed = clean
    const openBraces = (fixed.match(/{/g) || []).length
    const closeBraces = (fixed.match(/}/g) || []).length
    const openBrackets = (fixed.match(/\[/g) || []).length
    const closeBrackets = (fixed.match(/\]/g) || []).length
    if (!fixed.endsWith('"') && !fixed.endsWith('}') && !fixed.endsWith(']')) {
      fixed += '"'
    }
    for (let i = 0; i < openBrackets - closeBrackets; i++) fixed += ']'
    for (let i = 0; i < openBraces - closeBraces; i++) fixed += '}'
    try {
      return JSON.parse(fixed)
    } catch {
      throw new Error('JSON 파싱 실패')
    }
  }
}

export async function generateDailyContent(dayNumber: number, dateStr: string) {
  const curriculum = CURRICULUM[(dayNumber - 1) % CURRICULUM.length]
  const dateLabel = format(new Date(dateStr), 'M월 d일 (EEE)', { locale: ko })

  const prompt = `한국 주식시장 전문가로서 오늘(${dateLabel}) 주식 기초 레슨을 만들어주세요.
주제: "${curriculum.topic}" (${curriculum.category}) Day ${dayNumber}일차
JSON만 출력, 마크다운 없이:
{"title":"레슨제목","intro":"소개2문장","content":{"sections":[{"heading":"제목","body":"본문3문장","highlight":"핵심"}],"signal_table":[{"situation":"상황","meaning":"의미","action":"대응","direction":"up"}],"daily_checklist":["항목1","항목2","항목3"]},"key_point":"핵심한줄","market_context":"시장연결2문장","quiz":{"question":"질문","options":["A","B","C","D"],"answer":0,"explanation":"해설"}}`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  const parsed = safeParseJSON(text)
  return { topic: curriculum.topic, category: curriculum.category, ...parsed }
}

export async function generateMarketBrief(dateStr: string) {
  const dateLabel = format(new Date(dateStr), 'M월 d일 (EEE)', { locale: ko })

  const prompt = `한국 주식시장 애널리스트로서 ${dateLabel} 시장 브리핑을 JSON으로 작성하세요.
JSON만 출력:
{"kospi_comment":"한줄평","key_indicators":{"예탁금":"수준","신용잔고":"수준","환율":"방향","외국인":"수급"},"foreign_net":"수급요약","risk_level":3,"watch_list":["이벤트1","이벤트2","이벤트3"],"ai_comment":"코멘트3문장"}`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }]
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  return safeParseJSON(text)
}
