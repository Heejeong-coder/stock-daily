-- =============================================
-- 주식 기초 학습 앱 — Supabase DB 스키마
-- Supabase SQL Editor에서 실행하세요
-- =============================================

-- 1. 매일 레슨 테이블
CREATE TABLE daily_lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,           -- 날짜 (하루 1개)
  day_number INTEGER NOT NULL,         -- 누적 Day 번호 (Day 1, Day 2 ...)
  topic TEXT NOT NULL,                 -- 오늘의 주제 (예: 투자자 예탁금)
  category TEXT NOT NULL,              -- 카테고리 (수급/밸류/외인/신용/매크로)
  title TEXT NOT NULL,                 -- 레슨 제목
  intro TEXT NOT NULL,                 -- 도입부 (2~3줄 요약)
  content JSONB NOT NULL,              -- 본문 (구조화 JSON)
  key_point TEXT NOT NULL,             -- 핵심 한 줄 포인트
  market_context TEXT,                 -- 오늘 시장 상황과 연결
  quiz JSONB,                          -- 오늘의 퀴즈
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 매일 시장 브리핑 테이블
CREATE TABLE market_briefs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  kospi_comment TEXT,                  -- 코스피 한줄 평
  key_indicators JSONB,                -- 주요 지표 (예탁금, 신용잔고, 환율 등)
  foreign_net TEXT,                    -- 외국인 수급 방향
  risk_level INTEGER CHECK (risk_level BETWEEN 1 AND 5), -- 오늘 리스크 레벨
  watch_list TEXT[],                   -- 오늘 주목할 이벤트
  ai_comment TEXT,                     -- Claude의 오늘 시장 한마디
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 인덱스
CREATE INDEX idx_daily_lessons_date ON daily_lessons(date DESC);
CREATE INDEX idx_market_briefs_date ON market_briefs(date DESC);

-- 4. RLS 정책 (공개 읽기)
ALTER TABLE daily_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read" ON daily_lessons FOR SELECT USING (true);
CREATE POLICY "Public read" ON market_briefs FOR SELECT USING (true);

-- 서비스 롤만 쓰기 가능 (API Route에서만 insert)
CREATE POLICY "Service insert" ON daily_lessons FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service insert" ON market_briefs FOR INSERT
  WITH CHECK (auth.role() = 'service_role');
