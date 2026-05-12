# AI-DfMA R&D Dashboard

[![Repo](https://img.shields.io/badge/repo-ai--dfma--rnd-181717?logo=github)](https://github.com/leejaekyung/ai-dfma-rnd)
[![Open Issues](https://img.shields.io/github/issues/leejaekyung/ai-dfma-rnd)](https://github.com/leejaekyung/ai-dfma-rnd/issues)
[![Last Commit](https://img.shields.io/github/last-commit/leejaekyung/ai-dfma-rnd)](https://github.com/leejaekyung/ai-dfma-rnd/commits/main)
[![Project Board](https://img.shields.io/badge/Project-Board-blue)](https://github.com/users/leejaekyung/projects/1)

`Global Top-tier ±1mm 초정밀도의 AI 및 DfMA 기반 알루미늄 이중휨 패널 생산 시스템 개발`

이 저장소는 2026 디딤돌 과제의 **24주 통합 실행관리 대시보드**입니다.

---

## 1) 프로젝트 개요
- **과제 목표:** 설계 → 전개 → 성형 → 검측 → 보정 → 트리밍 전공정을 Digital Thread로 통합 자동화
- **핵심 성능지표:** 최종 정밀도 ±1mm, 제작비 절감, 재작업/폐기율 감소
- **핵심 축:**
  - AI 기반 자동 전개 (Rhino + ExactFlat + 보정)
  - 인덕션 히팅 다점 프레스 장비
  - 3D 스캔 피드백 + 로봇 레이저 트리밍

## 2) 바로가기
- 📌 실행계획(24주):
  - `projects/Global Top-tier ±1mm AI-DfMA Panel R&D/01_plan/2026_디딤돌_과제_24주_실행계획.md`
- 📌 통합 상세계획(세종대/KPI/연동/멀티에이전트):
  - `projects/Global Top-tier ±1mm AI-DfMA Panel R&D/01_plan/24주_통합_실행계획_세종대_연동_멀티에이전트.md`
- 📌 프로젝트 운영 루트:
  - `projects/Global Top-tier ±1mm AI-DfMA Panel R&D/README.md`
- 📌 GitHub 프로젝트 보드:
  - https://github.com/users/leejaekyung/projects/1

## 3) WBS
- WBS-100 PMO/사업관리
- WBS-200 요구사항/아키텍처/정밀도 예산
- WBS-300 설계자동화 SW
- WBS-400 장비 HW
- WBS-500 제어/전장
- WBS-600 검측/보정
- WBS-700 로봇 레이저 트리밍
- WBS-800 구조해석 자동화
- WBS-900 통합검증/성과확산

## 4) 24주 게이트
- 기준 시작일: **2026-04-06(월)**
- **Gate-1 (W04, ~2026-05-03):** 기획/요구사항/발주 기반 확정
- **Gate-2 (W10, ~2026-06-14):** 상세설계/안전회로/제작도 확정
- **Gate-3 (W16, ~2026-07-26):** 조립·시운전·스캔/트리밍 1차 연동 완료
- **Gate-4 (W21, ~2026-08-30):** ±1mm 성능 검증
- **Gate-5 (W24, ~2026-09-20):** 최종 통합 데모/최종보고서 제출

## 5) KPI 대시보드(운영값)
- **KPI-S1:** 해석-실측 MAE ≤ 1.5mm(중간), ≤ 1.0mm(최종)
- **KPI-S2:** 변형 예측 R² ≥ 0.85
- **KPI-S3:** 보정 후 오차 30% 이상 개선
- **KPI-S4:** 공정 파라미터 가이드라인 1세트 제출
- **KPI-S5:** 자문/기술문서 정시 제출율 100%

KPI 데이터 파일:
- `projects/Global Top-tier ±1mm AI-DfMA Panel R&D/07_data/kpi_tracker.csv`

## 6) 주간 운영 프로토콜
1. 주간 이슈(`[WEEKLY]`) 생성/업데이트
2. 실험 이슈(`[EXP]`)에 조건/결과 기록
3. 리스크 이슈(`[RISK]`) 등록 후 보정 액션 발행
4. 보드 상태 이동(Backlog → In Progress → Review → Done)

이슈 템플릿:
- `.github/ISSUE_TEMPLATE/weekly-report.md`
- `.github/ISSUE_TEMPLATE/experiment-log.md`
- `.github/ISSUE_TEMPLATE/risk-item.md`

## 7) 현재 활성 이슈 (W1~W4)
- W01: https://github.com/leejaekyung/ai-dfma-rnd/issues/4
- W02: https://github.com/leejaekyung/ai-dfma-rnd/issues/5
- W03: https://github.com/leejaekyung/ai-dfma-rnd/issues/6
- W04: https://github.com/leejaekyung/ai-dfma-rnd/issues/7

## 8) 문서 작성 규칙
- 파일명: `YYYY-MM-DD_제목.md`
- 보고: `02_reports/weekly`, `02_reports/monthly`
- 회의: `05_meetings/`
- 증빙: `04_evidence/`
- 모든 변경은 commit + push로 이력 관리

---

## 9) 다음 액션 (즉시)
- [ ] W01 문서 패키지(차터/R&R/리스크 v1) 커밋
- [ ] W02 SRS 및 오차예산 초안 작성
- [ ] W03 장기납기 BOM 동결 + 구매요청서 작성
- [ ] W04 ExactFlat 발주 및 인터페이스 정의
