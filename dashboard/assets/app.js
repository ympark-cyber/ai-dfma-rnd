/* ============================================================
   AI-DfMA R&D Dashboard — app.js
   ============================================================ */

const DATA_URL = '../data/ontology/';

const WBS_META = {
  100: { color: '#888780', bg: '#F1EFE8', textColor: '#444441' },
  200: { color: '#378ADD', bg: '#E6F1FB', textColor: '#0C447C' },
  300: { color: '#7F77DD', bg: '#EEEDFE', textColor: '#3C3489' },
  400: { color: '#1D9E75', bg: '#E1F5EE', textColor: '#085041' },
  500: { color: '#BA7517', bg: '#FAEEDA', textColor: '#633806' },
  600: { color: '#D85A30', bg: '#FAECE7', textColor: '#4A1B0C' },
  700: { color: '#D4537E', bg: '#FBEAF0', textColor: '#72243E' },
  800: { color: '#639922', bg: '#EAF3DE', textColor: '#27500A' },
  900: { color: '#E24B4A', bg: '#FCEBEB', textColor: '#791F1F' },
};

const STATUS_LABEL = {
  done:        '완료',
  in_progress: '진행 중',
  planned:     '예정',
  blocked:     '차단',
  passed:      '통과',
  upcoming:    '예정',
};

// ============================================================
// Data loading
// ============================================================

async function loadOntology() {
  const files = ['project', 'phases', 'gates', 'wbs', 'tasks', 'knowledge', 'persons', 'resources', 'risks'];
  const results = await Promise.all(
    files.map(f =>
      fetch(DATA_URL + f + '.json')
        .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}: ${f}.json`); return r.json(); })
    )
  );
  const [project, phases, gates, wbs, tasks, knowledge, persons, resources, risks] = results;
  return { project, phases, gates, wbs, tasks, knowledge, persons, resources, risks };
}

// ============================================================
// Utility
// ============================================================

function parseDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function today() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function getCurrentWeek(startDate) {
  const msDay = 1000 * 60 * 60 * 24;
  const diff = Math.floor((today() - parseDate(startDate)) / msDay);
  return Math.max(1, Math.floor(diff / 7) + 1);
}

function getWeekDates(startDate, week) {
  const msDay = 1000 * 60 * 60 * 24;
  const start = parseDate(startDate);
  const wStart = new Date(start.getTime() + (week - 1) * 7 * msDay);
  const wEnd   = new Date(wStart.getTime() + 6 * msDay);
  const fmt = d => `${d.getMonth() + 1}/${d.getDate()}`;
  return `${fmt(wStart)} ~ ${fmt(wEnd)}`;
}

function daysUntil(dateStr) {
  const msDay = 1000 * 60 * 60 * 24;
  return Math.ceil((parseDate(dateStr) - today()) / msDay);
}

function formatDate(dateStr) {
  return dateStr.replace(/-/g, '.');
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function wbsClass(code) { return `wbs-${code}`; }

// ============================================================
// renderHero
// ============================================================

function renderHero(data) {
  const { project, phases, gates } = data;
  const curWeek = getCurrentWeek(project.start_date);
  const overallPct = Math.min(100, Math.round((curWeek / project.total_weeks) * 100));

  // 현재 Phase
  const curPhase = phases.find(p => curWeek >= p.start_week && curWeek <= p.end_week) || phases[0];

  // 다음 게이트
  const futureGates = gates
    .filter(g => daysUntil(g.date) > 0)
    .sort((a, b) => parseDate(a.date) - parseDate(b.date));
  const nextGate = futureGates[0];
  const daysToGate = nextGate ? daysUntil(nextGate.date) : 0;

  // D-Day 종료
  const daysToEnd = daysUntil(project.end_date);

  document.getElementById('overall-pct').innerHTML = `${overallPct}<small>%</small>`;
  document.getElementById('cur-week').innerHTML = `W${curWeek}<small>/${project.total_weeks}</small>`;
  document.getElementById('next-gate').innerHTML = nextGate
    ? `${nextGate.id} <small>D-${daysToGate}</small>`
    : '<small>종료</small>';
  document.getElementById('dday-final').textContent = `D-${daysToEnd}`;
  document.getElementById('overall-bar').style.width = overallPct + '%';
  document.getElementById('week-range').textContent =
    `W${curWeek} · ${getWeekDates(project.start_date, curWeek)} (${new Date().getFullYear()})`;

  // Phase tag
  const phaseTag = document.querySelector('.hero-tag');
  if (phaseTag && curPhase) phaseTag.textContent = `${curPhase.id} · ${curPhase.name}`;
}

// ============================================================
// renderNow — 이번 주 태스크
// ============================================================

function renderNow(data) {
  const { project, tasks, wbs } = data;
  const curWeek = getCurrentWeek(project.start_date);

  const wbsMap = {};
  wbs.forEach(w => { wbsMap[w.code] = w; });

  const nowTasks = tasks.filter(t => t.week === curWeek);
  const grid = document.getElementById('now-grid');

  if (!nowTasks.length) {
    grid.innerHTML = `<div class="card" style="grid-column:1/-1;color:var(--text-tertiary);font-size:12px;">
      이번 주(W${curWeek}) 등록된 태스크가 없습니다.</div>`;
    return;
  }

  grid.innerHTML = nowTasks.map(t => {
    const wbsInfo = wbsMap[t.wbs] || {};
    const statusLabel = STATUS_LABEL[t.status] || t.status;
    return `
    <div class="card ${wbsClass(t.wbs)}" onclick="openTask('${escapeHtml(t.id)}')">
      <p class="now-card-title">${escapeHtml(t.title)}</p>
      <div class="now-card-meta">
        <span class="tag">${t.wbs} ${escapeHtml(wbsInfo.name || '')}</span>
        <span class="tag-status ${t.status}">${statusLabel}</span>
      </div>
      ${t.deliverable ? `<div class="now-card-deliverable">산출물: ${escapeHtml(t.deliverable)}</div>` : ''}
    </div>`;
  }).join('');
}

// ============================================================
// renderTimeline — 18개월 Gantt
// ============================================================

function renderTimeline(data) {
  const { project, wbs, gates } = data;
  const totalWeeks = project.total_weeks;
  const startDate = parseDate(project.start_date);
  const curWeek = getCurrentWeek(project.start_date);

  const tl = document.getElementById('timeline');

  // 월 헤더 생성
  const months = [];
  for (let i = 0; i < 18; i++) {
    const d = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
    months.push(`${d.getFullYear().toString().slice(2)}.${String(d.getMonth() + 1).padStart(2, '0')}`);
  }

  const monthHeader = `
    <div class="tl-months">
      <span></span>
      ${months.map(m => `<span>${m}</span>`).join('')}
    </div>`;

  // 각 WBS 행 생성
  const wbsRows = wbs.map(w => {
    const s = w.timeline.start_week;
    const e = Math.min(w.timeline.end_week, totalWeeks);
    const leftPct  = ((s - 1) / totalWeeks * 100).toFixed(2);
    const widthPct = ((e - s + 1) / totalWeeks * 100).toFixed(2);
    const style = `--c:${w.color};--c-bg:${w.bg};--c-text:${w.text_color};`;

    return `
    <div class="tl-row">
      <div class="tl-label">${w.code} ${w.name.split('/')[0]}</div>
      <div class="tl-track" style="${style}">
        <div class="tl-bar" style="left:${leftPct}%;width:${widthPct}%;background:${w.color};"
          title="${w.name} W${s}~W${e}"
          onclick="filterWBS(${w.code})">W${s}–W${e}</div>
      </div>
    </div>`;
  }).join('');

  // 게이트 마커 행
  const gateMarkers = gates.map(g => {
    const leftPct = ((g.week - 1) / totalWeeks * 100).toFixed(2);
    const isPassed = g.status === 'passed';
    const color = isPassed ? '#1D9E75' : '#E24B4A';
    return `
    <div class="tl-gate" style="left:calc(72px + (100% - 72px) * ${leftPct / 100});">
      <div class="tl-gate-label" style="color:${color};">${g.id}</div>
    </div>`;
  }).join('');

  const gatesRow = `
    <div class="tl-gates-row">
      <div class="tl-label" style="font-size:9px;color:var(--text-tertiary);">게이트</div>
      <div class="tl-gates-track" style="position:relative;">
        ${gates.map(g => {
          const leftPct = ((g.week - 1) / totalWeeks * 100).toFixed(2);
          const isPassed = g.status === 'passed';
          const color = isPassed ? '#1D9E75' : '#E24B4A';
          return `<div style="position:absolute;left:${leftPct}%;transform:translateX(-50%);
            font-size:8px;font-weight:600;color:${color};white-space:nowrap;
            font-family:var(--font-mono);cursor:pointer;"
            title="${g.title} (${g.date})"
            onclick="showGate('${g.id}')">${g.id}</div>`;
        }).join('')}
      </div>
    </div>`;

  // 오늘 선 (tracks 영역 전체에 걸치는 overlay)
  const todayPct = ((curWeek - 0.5) / totalWeeks * 100).toFixed(2);
  const todayOverlay = `
    <div style="position:absolute;left:calc(72px + (100% - 72px - 12px) * ${todayPct / 100});
      top:0;bottom:0;width:1.5px;background:#E24B4A;opacity:.7;z-index:4;pointer-events:none;"></div>`;

  tl.style.position = 'relative';
  tl.innerHTML = monthHeader + gatesRow + wbsRows + todayOverlay;
}

// ============================================================
// renderWBS — 9개 진행률 카드
// ============================================================

function renderWBS(data) {
  const { wbs, tasks } = data;
  const grid = document.getElementById('wbs-grid');

  grid.innerHTML = wbs.map(w => {
    const wbsTasks = tasks.filter(t => t.wbs === w.code);
    const total    = wbsTasks.length;
    const done     = wbsTasks.filter(t => t.status === 'done').length;
    const inProg   = wbsTasks.filter(t => t.status === 'in_progress').length;
    const pct      = total ? Math.round((done / total) * 100) : 0;
    const style    = `--c:${w.color};--c-bg:${w.bg};--c-text:${w.text_color};`;

    return `
    <div class="card wbs-${w.code}" style="${style}" onclick="filterWBS(${w.code})">
      <div class="wbs-card-header">
        <span class="wbs-code">${w.code}</span>
        <div style="display:flex;align-items:center;gap:4px;">
          <div class="wbs-dot"></div>
        </div>
      </div>
      <div class="wbs-name">${escapeHtml(w.name)}</div>
      <div class="wbs-bar-wrap">
        <div class="wbs-bar-fill" style="width:${pct}%;"></div>
      </div>
      <div class="wbs-stats">
        <span>${pct}%</span>
        <span>${done}/${total} 완료${inProg ? ` · ${inProg} 진행` : ''}</span>
      </div>
    </div>`;
  }).join('');
}

// ============================================================
// renderOntology — SVG 관계도 + 질의 버튼
// ============================================================

function renderOntology(data) {
  const { tasks, knowledge, risks } = data;
  const wrap = document.getElementById('onto');

  // 간단한 SVG 관계도
  const svgWidth = 740;
  const svgHeight = 200;

  // 엔티티 노드 정의
  const nodes = [
    { id: 'Project', x: 20,  y: 80,  w: 70, h: 28, color: '#7F77DD', label: 'Project' },
    { id: 'Phase',   x: 130, y: 40,  w: 60, h: 28, color: '#378ADD', label: 'Phase' },
    { id: 'Gate',    x: 230, y: 40,  w: 55, h: 28, color: '#E24B4A', label: 'Gate' },
    { id: 'Task',    x: 325, y: 40,  w: 55, h: 28, color: '#1D9E75', label: 'Task' },
    { id: 'Knowledge',x:435, y: 40,  w: 78, h: 28, color: '#BA7517', label: 'Knowledge' },
    { id: 'Person',  x: 325, y: 130, w: 60, h: 28, color: '#888780', label: 'Person' },
    { id: 'Resource',x: 430, y: 130, w: 70, h: 28, color: '#639922', label: 'Resource' },
    { id: 'Risk',    x: 540, y: 80,  w: 55, h: 28, color: '#D85A30', label: 'Risk' },
  ];

  // 관계 엣지 정의 (from→to, label)
  const edges = [
    { from: 'Project', to: 'Phase',    label: 'contains' },
    { from: 'Phase',   to: 'Gate',     label: 'has' },
    { from: 'Gate',    to: 'Task',     label: 'groups' },
    { from: 'Task',    to: 'Knowledge',label: 'produces' },
    { from: 'Task',    to: 'Person',   label: 'assigned' },
    { from: 'Task',    to: 'Resource', label: 'uses' },
    { from: 'Risk',    to: 'Task',     label: 'affects' },
    { from: 'Knowledge',to:'Task',     label: 'informs' },
  ];

  function nodeCenter(n) { return { x: n.x + n.w / 2, y: n.y + n.h / 2 }; }

  function edgePath(e) {
    const fn = nodes.find(n => n.id === e.from);
    const tn = nodes.find(n => n.id === e.to);
    if (!fn || !tn) return '';
    const fc = nodeCenter(fn);
    const tc = nodeCenter(tn);
    const mx = (fc.x + tc.x) / 2;
    const my = (fc.y + tc.y) / 2;
    return `<line x1="${fc.x}" y1="${fc.y}" x2="${tc.x}" y2="${tc.y}"
      stroke="var(--border-strong)" stroke-width="1" marker-end="url(#arrow)"/>
      <text x="${mx}" y="${my - 4}" font-size="8" fill="var(--text-tertiary)"
        text-anchor="middle">${e.label}</text>`;
  }

  const nodeRects = nodes.map(n => `
    <rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}"
      rx="5" fill="${n.color}22" stroke="${n.color}" stroke-width="1"/>
    <text x="${n.x + n.w/2}" y="${n.y + n.h/2 + 4}" font-size="11" font-weight="500"
      fill="${n.color}" text-anchor="middle">${n.label}</text>
  `).join('');

  const svg = `
    <svg class="onto-svg-area" viewBox="0 0 640 185" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 Z" fill="var(--text-tertiary)"/>
        </marker>
      </defs>
      ${edges.map(edgePath).join('')}
      ${nodeRects}
    </svg>`;

  // 통계 요약
  const totalTasks = tasks.length;
  const doneTasks  = tasks.filter(t => t.status === 'done').length;
  const highRisks  = risks.filter(r => r.severity === 'high').length;
  const knowCount  = knowledge.length;

  const queries = [
    { label: `완료 태스크 ${doneTasks}/${totalTasks}건`, fn: 'queryDoneTasks' },
    { label: `진행 중 태스크`, fn: 'queryActiveTasks' },
    { label: `High 리스크 ${highRisks}건`, fn: 'queryHighRisks' },
    { label: `최근 지식 ${knowCount}건`, fn: 'queryKnowledge' },
  ];

  wrap.innerHTML = `
    <div class="onto-wrap">
      ${svg}
      <div class="onto-queries">
        ${queries.map(q => `<button class="onto-btn" onclick="${q.fn}()">${q.label}</button>`).join('')}
      </div>
      <div id="onto-result" style="margin-top:10px;font-size:11px;color:var(--text-secondary);"></div>
    </div>`;
}

// 온톨로지 질의 함수
function queryDoneTasks() {
  if (!window._DATA) return;
  const done = window._DATA.tasks.filter(t => t.status === 'done');
  const lines = done.map(t => `<li>${t.id} · ${escapeHtml(t.title)}</li>`).join('');
  document.getElementById('onto-result').innerHTML =
    `<strong>완료 태스크 (${done.length}건)</strong><ul style="margin:4px 0 0 16px;padding:0;">${lines}</ul>`;
}

function queryActiveTasks() {
  if (!window._DATA) return;
  const active = window._DATA.tasks.filter(t => t.status === 'in_progress');
  const lines = active.map(t => `<li>${t.id} · ${escapeHtml(t.title)}</li>`).join('');
  document.getElementById('onto-result').innerHTML =
    `<strong>진행 중 태스크 (${active.length}건)</strong><ul style="margin:4px 0 0 16px;padding:0;">${lines}</ul>`;
}

function queryHighRisks() {
  if (!window._DATA) return;
  const high = window._DATA.risks.filter(r => r.severity === 'high');
  const lines = high.map(r =>
    `<li><span class="risk-high">High</span> ${r.id} · ${escapeHtml(r.title)}</li>`
  ).join('');
  document.getElementById('onto-result').innerHTML =
    `<strong>High 리스크 (${high.length}건)</strong><ul style="margin:4px 0 0 16px;padding:0;">${lines}</ul>`;
}

function queryKnowledge() {
  if (!window._DATA) return;
  const sorted = [...window._DATA.knowledge].sort((a, b) => b.date.localeCompare(a.date));
  const lines = sorted.map(k =>
    `<li><span class="tag-type ${k.type}">${k.type}</span> ${escapeHtml(k.title)} <span style="color:var(--text-tertiary)">${k.date}</span></li>`
  ).join('');
  document.getElementById('onto-result').innerHTML =
    `<strong>지식 목록 (${sorted.length}건)</strong><ul style="margin:4px 0 0 16px;padding:0;list-style:none;">${lines}</ul>`;
}

// ============================================================
// renderKnowledge — 최근 지식 카드
// ============================================================

function renderKnowledge(data) {
  const { knowledge } = data;
  const grid = document.getElementById('know-grid');

  const sorted = [...knowledge].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 4);

  grid.innerHTML = sorted.map(k => `
    <div class="card" onclick="openKnowledge('${escapeHtml(k.id)}')">
      <div class="k-card-header">
        <span class="tag-type ${k.type}">${k.type}</span>
        <span style="font-size:10px;color:var(--text-tertiary);font-family:var(--font-mono);">${k.date}</span>
      </div>
      <div class="k-card-title">${escapeHtml(k.title)}</div>
      <div class="k-card-summary">${escapeHtml(k.summary)}</div>
      <div class="k-card-footer">
        <span>${escapeHtml(k.owner)}</span>
        ${k.tags.slice(0, 2).map(tag => `<span>${escapeHtml(tag)}</span>`).join('')}
      </div>
    </div>`).join('');
}

// ============================================================
// 클릭 핸들러 (GitHub Pages용 — Issue/파일 링크)
// ============================================================

function openTask(id) {
  // GitHub Issues 기반으로 확장 시 링크 연결
  showToast(`태스크: ${id}`);
}

function openKnowledge(id) {
  showToast(`지식: ${id}`);
}

function filterWBS(code) {
  showToast(`WBS ${code} 필터 (개발 예정)`);
}

function showGate(id) {
  if (!window._DATA) return;
  const gate = window._DATA.gates.find(g => g.id === id);
  if (!gate) return;
  showToast(`${gate.id}: ${gate.title} (${gate.date})`);
}

function showToast(msg) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    Object.assign(toast.style, {
      position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
      background: 'var(--text-primary)', color: 'var(--bg-primary)',
      padding: '8px 16px', borderRadius: '8px', fontSize: '12px',
      zIndex: 9999, transition: 'opacity .3s',
    });
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 2000);
}

// ============================================================
// 에러 화면
// ============================================================

function showError(msg) {
  document.body.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;
      font-family:sans-serif;color:#5f5e5a;flex-direction:column;gap:12px;padding:2rem;text-align:center;">
      <div style="font-size:32px;">⚠️</div>
      <div style="font-weight:600;">데이터 로드 실패</div>
      <div style="font-size:13px;">${escapeHtml(msg)}</div>
      <div style="font-size:12px;color:#888780;">
        로컬에서 열 때는 <code>python -m http.server 8000</code> 으로 서버를 실행한 뒤<br>
        <code>http://localhost:8000/dashboard/</code> 에서 접속하세요.
      </div>
    </div>`;
}

// ============================================================
// Main
// ============================================================

loadOntology()
  .then(data => {
    window._DATA = data;  // 질의 함수용 전역 참조
    renderHero(data);
    renderNow(data);
    renderTimeline(data);
    renderWBS(data);
    renderOntology(data);
    renderKnowledge(data);
  })
  .catch(err => {
    console.error(err);
    showError(err.message);
  });
