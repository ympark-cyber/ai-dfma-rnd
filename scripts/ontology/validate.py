"""
온톨로지 JSON 파일 참조 무결성 검증 스크립트

사용법:
    python scripts/ontology/validate.py

모든 검사 통과 시 "ALL CHECKS PASSED" 출력.
오류 발생 시 상세 메시지와 함께 exit(1).
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / "data" / "ontology"

VALID_WBS = {100, 200, 300, 400, 500, 600, 700, 800, 900}
KNOWLEDGE_PREFIXES = {"EXP", "DOC", "DEC", "LRN"}


def load(filename: str) -> dict | list:
    path = DATA / filename
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError:
        print(f"[ERROR] 파일 없음: {path}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"[ERROR] JSON 파싱 실패 ({filename}): {e}")
        sys.exit(1)


errors: list[str] = []


def err(msg: str) -> None:
    errors.append(msg)
    print(f"  [FAIL] {msg}")


def ok(msg: str) -> None:
    print(f"  [OK]   {msg}")


# ---------------------------------------------------------------------------
# 데이터 로드
# ---------------------------------------------------------------------------
print("=== 데이터 로드 ===")
project   = load("project.json")
phases    = load("phases.json")
gates     = load("gates.json")
wbs_list  = load("wbs.json")
tasks     = load("tasks.json")
knowledge = load("knowledge.json")
persons   = load("persons.json")
resources = load("resources.json")
risks     = load("risks.json")

# ID 집합 구성
phase_ids    = {p["id"] for p in phases}
gate_ids     = {g["id"] for g in gates}
wbs_codes    = {w["code"] for w in wbs_list}
task_ids     = {t["id"] for t in tasks}
know_ids     = {k["id"] for k in knowledge}
person_ids   = {p["id"] for p in persons}
resource_ids = {r["id"] for r in resources}

print(f"  로드 완료: phases={len(phases)}, gates={len(gates)}, wbs={len(wbs_list)}, "
      f"tasks={len(tasks)}, knowledge={len(knowledge)}, persons={len(persons)}, "
      f"resources={len(resources)}, risks={len(risks)}")

# ---------------------------------------------------------------------------
# 검사 1: WBS 코드 유효성
# ---------------------------------------------------------------------------
print("\n=== 검사 1: WBS 코드 유효성 ===")

for w in wbs_list:
    if w["code"] not in VALID_WBS:
        err(f"WBS 코드 {w['code']} 는 허용 범위({VALID_WBS}) 밖")
    else:
        ok(f"WBS {w['code']} — {w['name']}")

# ---------------------------------------------------------------------------
# 검사 2: Phase → Project 참조
# ---------------------------------------------------------------------------
print("\n=== 검사 2: Phase.parent_project 참조 ===")

proj_id = project["id"]
for p in phases:
    if p["parent_project"] != proj_id:
        err(f"Phase {p['id']}.parent_project={p['parent_project']} → Project {proj_id} 없음")
    else:
        ok(f"Phase {p['id']} → {proj_id}")

# ---------------------------------------------------------------------------
# 검사 3: Gate → Phase 참조
# ---------------------------------------------------------------------------
print("\n=== 검사 3: Gate.phase 참조 ===")

for g in gates:
    if g["phase"] not in phase_ids:
        err(f"Gate {g['id']}.phase={g['phase']} → Phase 없음")
    else:
        ok(f"Gate {g['id']} ({g['title']}) → {g['phase']}")

# ---------------------------------------------------------------------------
# 검사 4: Task 유효성 (wbs, gate, owner, deps)
# ---------------------------------------------------------------------------
print("\n=== 검사 4: Task 유효성 ===")

for t in tasks:
    tid = t["id"]
    # wbs
    if t["wbs"] not in VALID_WBS:
        err(f"Task {tid}.wbs={t['wbs']} — 유효하지 않은 WBS 코드")
    # gate
    if t["gate"] not in gate_ids:
        err(f"Task {tid}.gate={t['gate']} → Gate 없음")
    # owner
    if t["owner"] not in person_ids:
        err(f"Task {tid}.owner={t['owner']} → Person 없음")
    # deps
    for dep in t.get("deps", []):
        if dep not in task_ids:
            err(f"Task {tid}.deps 참조 {dep} → Task 없음")

if not errors:
    ok(f"Tasks {len(tasks)}건 전체 참조 무결")

# ---------------------------------------------------------------------------
# 검사 5: Knowledge 유효성 (id prefix, type, owner, refs)
# ---------------------------------------------------------------------------
print("\n=== 검사 5: Knowledge 유효성 ===")

for k in knowledge:
    kid = k["id"]
    # id prefix vs type
    prefix = kid.split("-")[0]
    if prefix not in KNOWLEDGE_PREFIXES:
        err(f"Knowledge {kid} — ID 접두어 '{prefix}' 가 {KNOWLEDGE_PREFIXES} 밖")
    if prefix != k["type"]:
        err(f"Knowledge {kid} — ID 접두어 '{prefix}' 와 type '{k['type']}' 불일치")
    # owner
    if k["owner"] not in person_ids:
        err(f"Knowledge {kid}.owner={k['owner']} → Person 없음")
    # refs (Task 또는 Knowledge 가리킬 수 있음)
    for ref in k.get("refs", []):
        if ref not in task_ids and ref not in know_ids:
            err(f"Knowledge {kid}.refs 참조 {ref} → Task/Knowledge 없음")

if not errors:
    ok(f"Knowledge {len(knowledge)}건 전체 유효")

# ---------------------------------------------------------------------------
# 검사 6: Risk 유효성 (owner, affects)
# ---------------------------------------------------------------------------
print("\n=== 검사 6: Risk 유효성 ===")

valid_affects = task_ids | gate_ids | {str(w) for w in VALID_WBS}

for r in risks:
    rid = r["id"]
    if r["owner"] not in person_ids:
        err(f"Risk {rid}.owner={r['owner']} → Person 없음")
    for aff in r.get("affects", []):
        if aff not in valid_affects:
            err(f"Risk {rid}.affects 참조 {aff} → Task/Gate/WBS 없음 (주의: Phase 2 태스크는 미입력 상태)")

if not errors:
    ok(f"Risks {len(risks)}건 전체 유효")

# ---------------------------------------------------------------------------
# 검사 7: WBS owner → Person 참조
# ---------------------------------------------------------------------------
print("\n=== 검사 7: WBS.owner 참조 ===")

for w in wbs_list:
    if w.get("owner") and w["owner"] not in person_ids:
        err(f"WBS {w['code']}.owner={w['owner']} → Person 없음")
    else:
        ok(f"WBS {w['code']}.owner={w.get('owner')} — 유효")

# ---------------------------------------------------------------------------
# 결과
# ---------------------------------------------------------------------------
print("\n" + "=" * 50)
if errors:
    print(f"FAILED — {len(errors)}개 오류 발견")
    sys.exit(1)
else:
    print("ALL CHECKS PASSED")
    print(f"  entities: project=1, phases={len(phases)}, gates={len(gates)}, "
          f"wbs={len(wbs_list)}, tasks={len(tasks)}, knowledge={len(knowledge)}, "
          f"persons={len(persons)}, resources={len(resources)}, risks={len(risks)}")
