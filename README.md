# 📈 Financial Avengers – Hybrid Investment Engine  
Google Apps Script + Python Scanner + Codex 통합 자동화 시스템

---

## 🚀 프로젝트 개요  
Financial Avengers는  
1) **Apps Script**  
2) **Python Scanner**  
3) **Codex 기반 자동화 파이프라인**  
이 연동되는 하이브리드 투자 분석 시스템입니다.

- 페르소나 11명 + CEO(Jamie)가 토론해 매수·매도·관망을 결정  
- Python Scanner가 전 세계 저평가/고품질 기업을 자동 스캔  
- Apps Script가 UI·판단·Dashboard를 제공  
- Codex가 GitHub의 코드 자동 업데이트를 지원

---

## 🧱 시스템 구조  
```
financial-avengers/
│
├── apps_script/       # Google Apps Script 코드
│   ├── Config.gs
│   ├── Logic.gs
│   ├── Main.gs
│   ├── Prompt.gs
│   ├── SheetHelper.gs
│   └── UI.gs
│
├── python/            # Python Scanner
│   └── scanner.py
│
└── README.md
```

---

## 🐍 Python Scanner 기능  
- 전 세계 주식 데이터 수집 (재무제표 기반)  
- Composite Score 계산  
- Valuation / Quality / Growth / Momentum 점수  
- RSI / SMA / Risk Score 계산  
- Scanner_Data 시트 업데이트  
- 추천 대안(Alternatives) 제공

---

## 🔧 Apps Script 기능  
- Google Sheets UI 생성  
- 페르소나 회의 시스템  
- Jamie Dimon 최종 결정  
- Dashboard 시각화  
- Python Scanner에서 생성한 데이터를 읽어 분석

---

## ⚠️ Codex 작업 규칙 (매우 중요)  
아래 항목은 절대 수정 금지:

- ❌ 페르소나 정의 수정 금지  
- ❌ 안정적으로 작동 중인 Apps Script 코드 리팩터링 금지  
- ❌ UI 섹션 제목 변경 금지  
- ❌ 시스템 아키텍처 변경 금지

Codex는 반드시 “지시한 부분만” 수정해야 합니다.

---

## 📚 설치 & 실행  
### Python Scanner 실행
```
python scanner.py
```

### Apps Script 배포
1. Google Sheets → 앱스 스크립트 열기  
2. 파일 업로드  
3. Trigger 연결  
4. Dashboard 확인

---

## 👤 제작자  
- **진호**  
- Bloomond AI Command Center 제작자  
- Product Designer / Mold Designer / AI Workflow Architect

---

## 📄 라이선스  
본 프로젝트는 MIT License를 사용합니다.
