# AI-DfMA R&D 통합 대시보드 — 작업 인계서

> **목적:** Claude.ai 채팅 세션에서 설계한 대시보드를 Claude Code 환경으로 이관하여 실제 레포에 구축한다.
> **레포:** `leejaekyung/ai-dfma-rnd`
> **연구기간:** 2026-04-06 ~ 2027-09-30 (18개월, 78주)
> **현재 시점:** 2026-05-12, W6 (Phase 1 진행 중)

---

## 1. 비전과 4대 요구사항

이 시스템은 단순한 진행률 차트가 아니다. 다음 4가지를 한 시스템으로 통합한다:

1. **연구 관리** — 18개월 R&D를 월/주/일 단위로 추적
2. **지식 그래프** — 실험·문서·결정·학습을 온톨로지로 연결
3. **AI 에이전트 작업대** — Claude/에이전트가 대시보드를 통해 컨텍스트를 즉시 로드하고 작업
4. **회사 PMS 시드** — 향후 멀티 프로젝트 PMS로 확장 가능한 구조

---

## 2. 온톨로지 스키마 (7개 엔티티)

### 2.1 핵심 엔티티

| 엔티티 | ID 규칙 | 핵심 속성 |
|---|---|---|
| `Project` | `PRJ-XXX` | name, start_date, end_date, kpis |
| `Phase` | `PH-N` | name, start_week, end_week, parent_project |
| `Gate` | `G-N` | week, date, title, success_criteria, status |
| `Task` | `TSK-YYYY-NNNN` | title, wbs, gate, week, day, owner, status, deps |
| `Knowledge` | `{EXP\|DOC\|DEC\|LRN}-YYYY-NNNN` | type, title, date, owner, content, refs |
| `Person` | `P-XXX` | name, role, org, contact |
| `Resource` | `R-XXX` | name, type (equipment/sw/material), spec |
| `Risk` | `RSK-YYYY-NNN` | title, severity, probability, mitigation, affects[] |

### 2.2 관계 (Relations)

```
Project   ── contains ──→ Phase
Phase     ── has ──────→ Gate
Gate      ── groups ───→ Task
Task      ── produces ─→ Knowledge / Deliverable
Task      ── assigned ─→ Person
Task      ── uses ─────→ Resource
Task      ── tagged ───→ WBS_Code (100~900)
Risk      ── affects ──→ Task / Gate / WBS
Knowledge ── informs ──→ Task (양방향 가능)
```

### 2.3 WBS 코드 (9개, 색상 매핑 포함)

| 코드 | 이름 | 색상 (hex) |
|---|---|---|
| 100 | PMO/사업관리 | `#888780` gray |
| 200 | 요구사항/아키텍처/정밀도 예산 | `#378ADD` blue |
| 300 | 설계자동화 SW | `#7F77DD` purple |
| 400 | 장비 HW | `#1D9E75` teal |
| 500 | 제어/전장 | `#BA7517` amber |
| 600 | 검측/보정 | `#D85A30` coral |
| 700 | 로봇 레이저 트리밍 | `#D4537E` pink |
| 800 | 구조해석 자동화 | `#639922` green |
| 900 | 통합검증/성과확산 | `#E24B4A` red |

### 2.4 게이트 정의 (9개)

| ID | 주차 | 날짜 | 제목 | Phase |
|---|---|---|---|---|
| G1 | W4 | 2026-05-03 | 기획·요구사항·발주 확정 | 1 |
| G2 | W10 | 2026-06-14 | 상세설계·안전회로 확정 | 1 |
| G3 | W16 | 2026-07-26 | 조립·시운전·트리밍 1차 연동 | 1 |
| G4 | W21 | 2026-08-30 | ±1mm 성능 검증 | 1 |
| G5 | W24 | 2026-09-20 | 최종 통합 데모 | 1 |
| G6 | W36 | 2026-12-13 | 알고리즘 v2 + 통합 안정화 | 2 |
| G7 | W50 | 2027-03-21 | 실규모 시제품 + 통계 검증 | 2 |
| G8 | W65 | 2027-07-04 | KOLAS 인증 + 특허 출원 완료 | 2 |
| G9 | W78 | 2027-09-30 | 최종 보고 + 사업화 준비 | 2 |

---

## 3. 레포 통합 구조 제안

```
ai-dfma-rnd/
├── data/
│   └── ontology/                  # 신규 — 온톨로지 데이터
│       ├── project.json           # Project 1건
│       ├── phases.json            # Phase 2건
│       ├── gates.json             # Gate 9건
│       ├── wbs.json               # WBS 9건
│       ├── tasks.json             # Task N건 (월/주/일)
│       ├── knowledge.json         # Knowledge N건
│       ├── persons.json           # Person
│       ├── resources.json         # Resource
│       └── risks.json             # Risk
├── dashboard/                     # 신규
│   ├── index.html                 # 대시보드 (정적, GitHub Pages 배포)
│   ├── assets/
│   │   ├── style.css
│   │   └── app.js
│   └── README.md
├── scripts/
│   ├── ontology/                  # 신규
│   │   ├── models.py              # Pydantic 데이터 모델
│   │   ├── validate.py            # 스키마 검증
│   │   └── aggregate.py           # GitHub Issues → ontology JSON 집계
│   └── dashboard/                 # 신규
│       └── render.py              # ontology → dashboard/index.html 렌더
└── .github/
    └── workflows/
        └── dashboard.yml          # 신규 — 매 커밋마다 대시보드 갱신
```

---

## 4. 단계별 실행 계획 (Claude Code에서)

### Step 1 — 온톨로지 데이터 구조 확정 (반나절)
- [ ] `scripts/ontology/models.py` — Pydantic 모델 7개 작성
- [ ] `data/ontology/*.json` — 현 시점(W6) 기준 시드 데이터 작성
  - Project 1건, Phase 2건, Gate 9건, WBS 9건 먼저
  - Task는 W1~W6(완료/진행 중)만 우선 입력
  - Knowledge는 기존 레포의 `02_reports`, `04_evidence`에서 추출
- [ ] `scripts/ontology/validate.py` — 모든 JSON 파일의 참조 무결성 검증

### Step 2 — 대시보드 MVP 렌더 (반나절)
- [ ] `dashboard/index.html` — 아래 6장의 시작 코드를 베이스로 사용
- [ ] `scripts/dashboard/render.py` — Jinja2로 데이터 주입
- [ ] 로컬에서 열어 확인

### Step 3 — GitHub 연동 (반나절)
- [ ] `scripts/ontology/aggregate.py` — GitHub Issues API로 `[WEEKLY]`, `[EXP]`, `[RISK]` 이슈를 Knowledge/Task/Risk로 변환
- [ ] `.github/workflows/dashboard.yml` — push 시 aggregate → render → Pages 배포

### Step 4 — 인터랙션 강화 (1일)
- [ ] 검색·필터 (WBS·Gate·Owner·기간)
- [ ] 클릭 시 sendPrompt 대신 GitHub Issue 링크 또는 마크다운 파일 열기
- [ ] 일별 뷰 (Day view) 추가

### Step 5 — 멀티 프로젝트 일반화 (나중)
- [ ] `Project` 엔티티를 N개로 확장
- [ ] 프로젝트 선택 드롭다운
- [ ] 회사 전체 PMS로 진화

---

## 5. 대시보드 화면 구조 (확정)

대시보드는 **세로 스크롤** 단일 페이지로, 5개 섹션 + 헤더:

```
┌─────────────────────────────────────┐
│ HERO — 프로젝트명·진행률·D-Day·현재 주차    │
├─────────────────────────────────────┤
│ 1. NOW — 이번 주 4개 카드               │
├─────────────────────────────────────┤
│ 2. TIMELINE — 18개월 × 9 WBS 갠트     │
│              · 9개 게이트 마커          │
│              · '오늘' 빨간선            │
├─────────────────────────────────────┤
│ 3. WBS — 9개 카테고리 그리드 + 진행률    │
├─────────────────────────────────────┤
│ 4. ONTOLOGY — 엔티티 관계도 + 4개 질의  │
├─────────────────────────────────────┤
│ 5. KNOWLEDGE — 최근 지식 카드 4개       │
└─────────────────────────────────────┘
```

모든 카드는 클릭 가능. 클릭 시 동작은 환경에 따라:
- **Claude.ai 위젯:** `sendPrompt('...')`
- **GitHub Pages 정적:** 해당 GitHub Issue 또는 마크다운 파일로 이동

---

## 6. 대시보드 시작 코드 (HTML/CSS — 검증 완료된 부분)

아래 코드는 채팅 세션에서 디자인 검증을 마친 부분이다. Claude Code는 이걸 베이스로 시작하면 된다.

```html
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AI-DfMA R&D Dashboard</title>
<link rel="stylesheet" href="assets/style.css">
</head>
<body>
<div class="container">

<!-- HERO -->
<section class="hero">
  <div class="hero-row">
    <div>
      <h1 class="hero-title">AI-DfMA 비정형 파사드 R&D</h1>
      <p class="hero-sub">±1mm 알루미늄 이중휨 패널 시스템 · 2026.04 ~ 2027.09 · 18개월</p>
    </div>
    <span class="hero-tag" data-phase="1">Phase 1 · 장비 개발</span>
  </div>

  <div class="stats">
    <div class="stat"><div class="stat-l">전체 진행</div><div class="stat-v" id="overall-pct">8<small>%</small></div></div>
    <div class="stat"><div class="stat-l">현재 주차</div><div class="stat-v" id="cur-week">W6<small>/78</small></div></div>
    <div class="stat"><div class="stat-l">다음 게이트</div><div class="stat-v" id="next-gate">G2 <small>D-33</small></div></div>
    <div class="stat"><div class="stat-l">최종 종료</div><div class="stat-v" id="dday-final">D-506</div></div>
  </div>

  <div class="pbar"><div class="pfill" id="overall-bar" style="width:8%"></div></div>
  <div class="pmeta"><span>2026-04-06 착수</span><span>2027-09-30 종료</span></div>
</section>

<!-- 1. NOW -->
<section class="sec" id="sec-now">
  <h2 class="sh"><span class="sn">1</span> 이번 주 · <span id="week-range">W6 · 2026-05-11 ~ 05-17</span></h2>
  <div class="now-grid" id="now-grid"><!-- Task 카드들이 여기 주입 --></div>
</section>

<!-- 2. TIMELINE -->
<section class="sec" id="sec-timeline">
  <h2 class="sh"><span class="sn">2</span> 18개월 타임라인 · WBS × 시간</h2>
  <div class="tl" id="timeline"><!-- 9개 WBS 행 + 게이트 마커 --></div>
</section>

<!-- 3. WBS -->
<section class="sec" id="sec-wbs">
  <h2 class="sh"><span class="sn">3</span> WBS 9개 카테고리 · 진행 현황</h2>
  <div class="wbs-grid" id="wbs-grid"><!-- 9개 카드 --></div>
</section>

<!-- 4. ONTOLOGY -->
<section class="sec" id="sec-onto">
  <h2 class="sh"><span class="sn">4</span> 온톨로지 · 지식 그래프 질의</h2>
  <div class="onto" id="onto"><!-- SVG 관계도 + 질의 버튼 --></div>
</section>

<!-- 5. KNOWLEDGE -->
<section class="sec" id="sec-know">
  <h2 class="sh"><span class="sn">5</span> 최근 지식 카드</h2>
  <div class="k-grid" id="know-grid"><!-- Knowledge 카드들 --></div>
</section>

</div>
<script src="assets/app.js"></script>
</body>
</html>
```

### 6.1 핵심 CSS 디자인 토큰

```css
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f5f4ef;
  --bg-tertiary: #fafaf7;
  --text-primary: #1a1a18;
  --text-secondary: #5f5e5a;
  --text-tertiary: #888780;
  --border: rgba(0,0,0,0.08);
  --border-strong: rgba(0,0,0,0.15);
  --radius-md: 8px;
  --radius-lg: 12px;
  --font-sans: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #1e1e1c;
    --bg-secondary: #2a2a27;
    --bg-tertiary: #1a1a18;
    --text-primary: #f0eee8;
    --text-secondary: #b4b2a9;
    --text-tertiary: #888780;
    --border: rgba(255,255,255,0.08);
    --border-strong: rgba(255,255,255,0.15);
  }
}

/* WBS 색상 */
.wbs-100, .fill-100 { --c: #888780; --c-bg: #F1EFE8; --c-text: #444441; }
.wbs-200, .fill-200 { --c: #378ADD; --c-bg: #E6F1FB; --c-text: #0C447C; }
.wbs-300, .fill-300 { --c: #7F77DD; --c-bg: #EEEDFE; --c-text: #3C3489; }
.wbs-400, .fill-400 { --c: #1D9E75; --c-bg: #E1F5EE; --c-text: #085041; }
.wbs-500, .fill-500 { --c: #BA7517; --c-bg: #FAEEDA; --c-text: #633806; }
.wbs-600, .fill-600 { --c: #D85A30; --c-bg: #FAECE7; --c-text: #4A1B0C; }
.wbs-700, .fill-700 { --c: #D4537E; --c-bg: #FBEAF0; --c-text: #72243E; }
.wbs-800, .fill-800 { --c: #639922; --c-bg: #EAF3DE; --c-text: #27500A; }
.wbs-900, .fill-900 { --c: #E24B4A; --c-bg: #FCEBEB; --c-text: #791F1F; }

body { font-family: var(--font-sans); background: var(--bg-tertiary); color: var(--text-primary); margin: 0; }
.container { max-width: 760px; margin: 0 auto; padding: 1rem; }

.hero { background: var(--bg-primary); border: 0.5px solid var(--border); border-radius: var(--radius-lg); padding: 1rem 1.25rem; margin-bottom: 1.25rem; }
.hero-row { display: flex; justify-content: space-between; gap: 12px; margin-bottom: .75rem; }
.hero-title { font-size: 16px; font-weight: 500; margin: 0; }
.hero-sub { font-size: 12px; color: var(--text-secondary); margin: 2px 0 0; }
.hero-tag { font-size: 11px; padding: 3px 8px; border-radius: 6px; background: #E6F1FB; color: #0C447C; font-weight: 500; align-self: flex-start; }

.stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; margin-bottom: .75rem; }
.stat { background: var(--bg-secondary); border-radius: var(--radius-md); padding: 8px 10px; }
.stat-l { font-size: 10px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: .05em; margin-bottom: 2px; }
.stat-v { font-size: 17px; font-weight: 500; }
.stat-v small { font-size: 11px; font-weight: 400; color: var(--text-secondary); }

.pbar { height: 6px; background: var(--bg-secondary); border-radius: 3px; overflow: hidden; margin-bottom: 4px; }
.pfill { height: 100%; background: #7F77DD; border-radius: 3px; }
.pmeta { font-size: 10px; color: var(--text-tertiary); display: flex; justify-content: space-between; }

.sec { margin-bottom: 1.5rem; }
.sh { font-size: 13px; font-weight: 500; color: var(--text-secondary); margin-bottom: .6rem; display: flex; align-items: center; gap: 6px; }
.sn { background: var(--bg-secondary); width: 20px; height: 20px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; }

/* Now 카드, WBS 카드, Knowledge 카드 공통 */
.card { background: var(--bg-primary); border: 0.5px solid var(--border); border-radius: var(--radius-md); padding: 10px 12px; cursor: pointer; transition: border-color .15s; }
.card:hover { border-color: var(--border-strong); }

.now-grid, .k-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.wbs-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; }

/* 태그 */
.tag { font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 500; background: var(--c-bg); color: var(--c-text); }

/* 타임라인 */
.tl { background: var(--bg-primary); border: 0.5px solid var(--border); border-radius: var(--radius-md); padding: 12px; }
.tl-months { display: grid; grid-template-columns: 80px repeat(18, 1fr); font-size: 9px; color: var(--text-tertiary); margin-bottom: 6px; padding-bottom: 6px; border-bottom: 0.5px solid var(--border); }
.tl-row { display: grid; grid-template-columns: 80px 1fr; gap: 6px; margin-bottom: 3px; align-items: center; }
.tl-label { font-size: 10px; color: var(--text-secondary); text-align: right; padding-right: 4px; }
.tl-track { position: relative; height: 16px; background: var(--bg-secondary); border-radius: 3px; }
.tl-bar { position: absolute; top: 1px; height: 14px; border-radius: 2px; font-size: 9px; display: flex; align-items: center; padding: 0 4px; color: #fff; font-weight: 500; cursor: pointer; background: var(--c); }
```

### 6.2 데이터 주입 JavaScript 골격

```javascript
// app.js — Claude Code가 완성
const DATA_URL = 'data/ontology/';

async function loadOntology() {
  const [project, phases, gates, wbs, tasks, knowledge, persons, risks] = await Promise.all([
    fetch(DATA_URL + 'project.json').then(r => r.json()),
    fetch(DATA_URL + 'phases.json').then(r => r.json()),
    fetch(DATA_URL + 'gates.json').then(r => r.json()),
    fetch(DATA_URL + 'wbs.json').then(r => r.json()),
    fetch(DATA_URL + 'tasks.json').then(r => r.json()),
    fetch(DATA_URL + 'knowledge.json').then(r => r.json()),
    fetch(DATA_URL + 'persons.json').then(r => r.json()),
    fetch(DATA_URL + 'risks.json').then(r => r.json()),
  ]);
  return { project, phases, gates, wbs, tasks, knowledge, persons, risks };
}

function renderHero(data) { /* HERO 섹션 렌더 */ }
function renderNow(data) { /* W6 태스크 4개 카드 */ }
function renderTimeline(data) { /* 9개 WBS 갠트바 + 9개 게이트 마커 + 오늘 선 */ }
function renderWBS(data) { /* 9개 WBS 진행률 카드 */ }
function renderOntology(data) { /* SVG 관계도 */ }
function renderKnowledge(data) { /* 최근 4개 지식 카드 */ }

loadOntology().then(data => {
  renderHero(data); renderNow(data); renderTimeline(data);
  renderWBS(data); renderOntology(data); renderKnowledge(data);
});
```

---

## 7. Claude Code에 던질 첫 프롬프트 (복사용)

```
HANDOFF_dashboard.md를 읽고, 아래 순서로 작업해줘:

1. data/ontology/ 폴더와 9개 JSON 파일을 만들어. 
   먼저 Project, Phase, Gate, WBS는 인계서 내용으로 그대로 입력.
   Task는 현재 W1~W6의 실제 GitHub Issue (W01~W04 + 진행 중)를 읽어서 변환.
   Knowledge는 02_reports와 04_evidence에서 추출.

2. scripts/ontology/models.py로 Pydantic 모델 7개를 정의하고,
   scripts/ontology/validate.py로 모든 JSON의 참조 무결성을 검증.

3. dashboard/index.html, assets/style.css, assets/app.js를 인계서 6장 코드를 베이스로 완성.

4. 브라우저에서 dashboard/index.html을 열어 확인.

각 단계 완료마다 git commit하고, 막히는 부분은 나에게 물어봐.
```

---

## 8. 결정이 필요한 항목 (Claude Code에서 확인 후 진행)

- [ ] **데이터 저장 형식**: JSON (제안) vs YAML vs SQLite
- [ ] **렌더링 방식**: 정적 HTML 생성 (제안) vs SPA (React/Vue)
- [ ] **GitHub Pages 도메인**: 기본 (`leejaekyung.github.io/ai-dfma-rnd`) vs 커스텀
- [ ] **인증/공개**: Public Pages vs Private (조직 멤버만)
- [ ] **Phase 2 게이트 (G6~G9)**: 위 표는 추정값 — 실제로 어떻게 설계할지 확정 필요

---

**문서 버전:** v1.0  
**작성:** 2026-05-12, Claude (claude.ai 채팅 세션)  
**다음 액션:** 이 문서를 레포 루트에 커밋하고 Claude Code 세션 시작
