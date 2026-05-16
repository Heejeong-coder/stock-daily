# 📈 주식 기초 매일 레슨 — 배포 가이드

매일 오전 6시(KST)에 Claude AI가 자동으로 새 레슨을 생성하는 웹앱입니다.

---

## 🏗️ 기술 스택

| 역할 | 기술 | 비용 |
|---|---|---|
| 프론트+백엔드 | Next.js 14 | 무료 |
| 호스팅 | Vercel | 무료 |
| DB | Supabase | 무료 (500MB) |
| 스케줄러 | Vercel Cron | 무료 |
| AI 엔진 | Claude Sonnet API | ~월 $2~5 |

---

## 🚀 배포 순서 (3단계)

### STEP 1 — Supabase 설정 (10분)

1. https://supabase.com 가입 → 새 프로젝트 생성
2. SQL Editor 열기
3. `supabase_schema.sql` 파일 내용 전체 복사 → 실행
4. Settings > API에서 다음 값 복사:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

### STEP 2 — Vercel 배포 (10분)

1. 이 폴더를 GitHub에 올리기
   ```bash
   git init
   git add .
   git commit -m "init"
   git remote add origin https://github.com/YOUR_ID/stock-daily.git
   git push -u origin main
   ```

2. https://vercel.com 가입 → "Import Project" → GitHub 연결

3. Vercel Dashboard > Settings > Environment Variables에 다음 입력:
   ```
   ANTHROPIC_API_KEY        = sk-ant-...
   NEXT_PUBLIC_SUPABASE_URL = https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJ...
   SUPABASE_SERVICE_ROLE_KEY     = eyJ...
   CRON_SECRET              = 임의의_긴_문자열 (터미널에서 openssl rand -hex 32 실행)
   ```

4. Deploy 클릭

### STEP 3 — Cron 설정 확인 (2분)

- `vercel.json`의 cron schedule: `"0 21 * * *"` = UTC 21:00 = KST 06:00
- Vercel Dashboard > Cron Jobs에서 활성화 확인

---

## 🧪 첫 레슨 수동 생성 (배포 직후 테스트)

배포 후 브라우저에서:
```
https://YOUR_APP.vercel.app/api/generate
```
위 URL 접속 시 401 에러가 나야 정상 (보안 작동 중)

터미널에서:
```bash
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://YOUR_APP.vercel.app/api/generate
```

성공 응답:
```json
{"success":true,"day":1,"date":"2026-05-16","topic":"투자자 예탁금"}
```

---

## 📁 파일 구조

```
stock-daily/
├── app/
│   ├── api/
│   │   ├── generate/route.ts   ← 매일 6시 Cron 실행
│   │   ├── lessons/route.ts    ← 레슨 목록 API
│   │   └── market/route.ts     ← 오늘 레슨+브리핑 API
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                ← 메인 UI
├── lib/
│   ├── generator.ts            ← Claude API 호출 (핵심)
│   └── supabase.ts             ← DB 클라이언트
├── supabase_schema.sql         ← DB 테이블 생성 SQL
├── vercel.json                 ← Cron 스케줄 설정
└── .env.local.example          ← 환경변수 템플릿
```

---

## ✏️ 커스터마이징

### 레슨 주제 추가/변경
`lib/generator.ts`의 `CURRICULUM` 배열 수정

### 발행 시간 변경
`vercel.json`의 schedule 수정
- KST 오전 7시 = UTC 22시 → `"0 22 * * *"`
- KST 오전 8시 = UTC 23시 → `"0 23 * * *"`

### 콘텐츠 스타일 변경
`lib/generator.ts`의 `prompt` 수정

---

## ❓ 문제 해결

| 증상 | 원인 | 해결 |
|---|---|---|
| 레슨이 안 나옴 | Cron 미실행 | 수동으로 curl 실행 |
| 401 에러 | CRON_SECRET 불일치 | 환경변수 확인 |
| JSON 파싱 에러 | Claude 응답 형식 이상 | generator.ts 프롬프트 조정 |
| DB 에러 | RLS 정책 문제 | supabase_schema.sql 재실행 |

---

## 💡 추후 확장 아이디어

- [ ] 카카오톡 알림 (매일 6시 레슨 발송)
- [ ] 실시간 주가 데이터 연동 (Yahoo Finance API)
- [ ] 사용자 북마크 기능
- [ ] 레슨 검색 기능
- [ ] 퀴즈 점수 누적 통계
