"""
Pydantic 데이터 모델 — AI-DfMA R&D 온톨로지 7개 엔티티
"""
from __future__ import annotations
from typing import Literal, Optional
from pydantic import BaseModel, field_validator


# ---------------------------------------------------------------------------
# Project
# ---------------------------------------------------------------------------

class KPI(BaseModel):
    id: str
    label: str
    target: str
    unit: Optional[str] = None


class Project(BaseModel):
    id: str                          # PRJ-XXX
    name: str
    short_name: str
    type: str
    lead_org: str
    partner_org: Optional[str] = None
    start_date: str                  # YYYY-MM-DD
    end_date: str
    total_weeks: int
    kpis: list[KPI]
    sejongu_kpis: Optional[list[dict]] = None


# ---------------------------------------------------------------------------
# Phase
# ---------------------------------------------------------------------------

class Phase(BaseModel):
    id: str                          # PH-N
    name: str
    description: Optional[str] = None
    start_week: int
    end_week: int
    start_date: str
    end_date: str
    parent_project: str              # → Project.id
    status: Literal["planned", "in_progress", "done"]


# ---------------------------------------------------------------------------
# Gate
# ---------------------------------------------------------------------------

class Gate(BaseModel):
    id: str                          # G-N
    week: int
    date: str
    title: str
    phase: str                       # → Phase.id
    status: Literal["passed", "upcoming", "planned"]
    success_criteria: list[str]
    note: Optional[str] = None


# ---------------------------------------------------------------------------
# Task
# ---------------------------------------------------------------------------

class Task(BaseModel):
    id: str                          # TSK-YYYY-NNNN
    title: str
    wbs: int                         # 100~900
    gate: str                        # → Gate.id
    week: int
    start_date: str
    end_date: str
    owner: str                       # → Person.id
    status: Literal["done", "in_progress", "planned", "blocked"]
    deps: list[str]                  # → Task.id[]
    deliverable: Optional[str] = None

    @field_validator("wbs")
    @classmethod
    def wbs_must_be_valid(cls, v: int) -> int:
        valid = {100, 200, 300, 400, 500, 600, 700, 800, 900}
        if v not in valid:
            raise ValueError(f"wbs must be one of {valid}, got {v}")
        return v


# ---------------------------------------------------------------------------
# Knowledge
# ---------------------------------------------------------------------------

class Knowledge(BaseModel):
    id: str                          # {EXP|DOC|DEC|LRN}-YYYY-NNNN
    type: Literal["EXP", "DOC", "DEC", "LRN"]
    title: str
    date: str
    owner: str                       # → Person.id
    summary: str
    refs: list[str]                  # → Task.id[] or Knowledge.id[]
    tags: list[str]

    @field_validator("id")
    @classmethod
    def id_prefix_must_match_type(cls, v: str, info) -> str:
        # Validated after type is set — cross-field check done in validate.py
        return v


# ---------------------------------------------------------------------------
# Person
# ---------------------------------------------------------------------------

class Person(BaseModel):
    id: str                          # P-XXX
    name: str
    role: str
    org: str
    responsibilities: list[str]


# ---------------------------------------------------------------------------
# Resource
# ---------------------------------------------------------------------------

class Resource(BaseModel):
    id: str                          # R-XXX
    name: str
    type: Literal["sw", "equipment", "material"]
    spec: str
    used_by_wbs: list[int]


# ---------------------------------------------------------------------------
# Risk
# ---------------------------------------------------------------------------

class Risk(BaseModel):
    id: str                          # RSK-YYYY-NNN
    title: str
    severity: Literal["low", "medium", "high"]
    probability: Literal["low", "medium", "high"]
    mitigation: str
    trigger: str
    owner: str                       # → Person.id
    affects: list[str]               # → Task.id[] or Gate.id[]


# ---------------------------------------------------------------------------
# Top-level containers (for loading full JSON files)
# ---------------------------------------------------------------------------

class OntologyDB(BaseModel):
    project: Project
    phases: list[Phase]
    gates: list[Gate]
    wbs: list[Resource]              # re-uses Resource? No — kept as dict in validate.py
    tasks: list[Task]
    knowledge: list[Knowledge]
    persons: list[Person]
    resources: list[Resource]
    risks: list[Risk]
