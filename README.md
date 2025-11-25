# 📈 Financial Avengers – Hybrid Investment Engine  
Google Apps Script + Python Scanner + Codex 통합 자동화 시스템

---

# 🚀 프로젝트 개요  
Financial Avengers는 다음 3개 엔진이 합쳐진 하이브리드 투자 시스템입니다:

1) **Apps Script (판단/Persona/대시보드 관리)**  
2) **Python Scanner (저평가·고품질 종목 스캐너)**  
3) **Codex (GitHub 자동수정 보조 AI)**  

이 시스템은 다음을 수행합니다:

- 11명의 Virtual Persona + Jamie Dimon(CEO)이 토론  
- Python Scanner가 저평가/고품질 기업을 자동 분석  
- Apps Script가 UI·판단·실행전략·Dashboard 생성  
- Codex가 지시한 부분만 정확히 업데이트

---

# 🧱 디렉토리 구조
```
financial-avengers/
│
├── apps_script/          
│   ├── Config.gs
│   ├── Logic.gs
│   ├── Main.gs
│   ├── Prompt.gs
│   ├── SheetHelper.gs
│   └── UI.gs
│
├── python/               
│   └── scanner.py
│
└── README.md
```

---

# 🐍 Python Scanner 기능  
- Yahoo Finance 기반 재무데이터 분석  
- PE / PB / ROE / Growth / Momentum 등 계산  
- Sharpe / MDD / Volatility 등 리스크 계산  
- Fair Value Score & Upside 계산  
- Scanner_Data 시트 자동 업데이트  
- Apps Script의 추천 대안(Alternatives) 데이터 소스 제공

---

# 🔧 Apps Script 기능  
- 시트 UI 생성  
- 메뉴: “이사회 소집”, “회의록 열람”, “Full Portfolio Fit”  
- 11인 페르소나 + CEO 회의/결론 생성  
- Python Scanner 데이터 읽기  
- Dashboard 렌더링 (HTML 기반)  
- 티커별 Action Plan 자동 생성  

---

# ⚠️ Codex 작업 규칙 (가장 중요)
Codex는 아래 항목을 **절대 수정하면 안 됨**:

## ❌ 1. 페르소나 정의 수정 금지  
- Warren Buffett  
- Charlie Munger  
- Jamie Dimon  
- Ken Griffin  
- Peter Brown  
- Howard Marks  
- Ruth Porat  
- Larry Summers  
- Paul Nakasone  
- Legal Team (Cutler, Bharara)  
➡️ **한 문장이라도 수정하면 시스템 붕괴**

## ❌ 2. 안정적으로 작동 중인 Apps Script 코드는 리팩터링 금지  
- 작동 중인 함수 이름 변경 금지  
- 기존 로직 재구성 금지  
- 불필요한 최적화/줄이기 금지  
➡️ 안정성을 위해 **지정된 부분만** Edit해야 함

## ❌ 3. Dashboard / UI 섹션 제목 변경 금지  
아래 제목은 UI 정규식 매칭에 사용되므로 **공백 1자도 변경 불가**:

- `## 🚀 실행 전략 (Action Plan)`  
- `## ⚔️ 경쟁사 및 대체 투자 (Alternatives)`  
- `## 📊 상세 데이터 검증 (Data Check)`  
- `## 🤝 핵심 논쟁 요약 (The Debate - ALL VOICES MATTER - One sentence each)`  

이것이 지켜지지 않으면 Dashboard가 깨짐.

## ❌ 4. API 구조 변경 금지  
- Gemini 응답 형식 첫 3줄:  
  - `DECISION=...`  
  - `BIAS_GRADE=...`  
  - `BIAS_SCORE=BUY_XX_SELL_YY`  
➡️ **Apps Script는 이 줄을 파싱하여 CEO 판단을 생성하므로 필수 유지**

---

# ❗ Codex가 이해해야 할 “작업 금지 예시 목록”
아래는 Codex가 절대 해선 안 되는 실제 사례들입니다:

### 🔥 절대 금지 A — 페르소나 내용 조금이라도 변경  
- "워렌버핏 문장 다듬기"  
- "제이미디몬 말투 부드럽게 변경"  
- "피터브라운 숫자요약 개선"  
➡️ 전부 금지. 시스템 전체가 오류 발생.

---

### 🔥 절대 금지 B — 기존 Apps Script 리팩터링  
- if/else를 switch로 바꾸기  
- 함수들을 합치기/분할하기  
- HTML/CSS를 정리해준다는 명목의 자동 수정  
➡️ 모두 금지.  
(이 시스템은 **정규식 기반 파서**로 작동하기 때문에 리팩터링 시 즉시 오작동)

---

### 🔥 절대 금지 C — UI 제목/섹션 포맷 변경  
- ⚠️ 아래는 대시보드 박스를 생성하는 핵심 트리거:
  - `## 🚀 실행 전략 (Action Plan)`
  - `## ⚔️ 경쟁사 및 대체 투자 (Alternatives)`

이걸  
- "## 실행전략"  
- "## Action Plan"  
- "## 🚀 실행전략"  
같이 바꾸면 즉시 UI 박스가 사라짐 → 치명적 오류

---

### 🔥 절대 금지 D — 파이썬 Scanner의 출력 컬럼명 수정  
Apps Script는 Scanner_Data에서 아래 컬럼을 **정확히 읽음**:

- Sector  
- Industry  
- Fair Value Score  
- Upside Potential  
- Quality Score  
- Growth Score  
➡️ 컬럼명 한 글자라도 바꾸면 추천 대안이 전부 “N/A”로 나옴.

---

# 🟢 Codex가 수정해도 되는 항목 (허용 영역)

### ✔ Apps Script 안에서 “내가 지정한 부분만” 수정  
- 메뉴 추가  
- 버튼 분리  
- 새 기능용 함수 추가  
- 동일 구조 내에서 단일 블록만 변경

### ✔ Python Scanner에 새 지표 추가  
- 새로운 재무지표 계산  
- 새로운 Score 추가  
- 새로운 Ticker 리스트/필터

### ✔ README / 문서 업데이트  
- 새 기능 추가  
- 사용법 추가  

---

# 📚 설치 & 실행

## Python 실행
```bash
python scanner.py
```

## Apps Script 배포
- Google Sheets → Extensions → Apps Script  
- 파일 연결  
- 트리거 등록  
- 대시보드 확인  

---

# 👤 제작
- **진호**  
Bloomond AI Command Center Architect  
Product Designer / Mold Designer / AI Automation Builder

---

# 📄 License
MIT License
