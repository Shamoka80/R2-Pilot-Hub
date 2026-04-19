# Phase 17 — QA Freeze and Regression Hardening

## Objective
Prove the current platform is stable enough for live pilot use by enforcing a feature freeze, running full regression coverage, and applying a stop/go production gate.

## 1) Feature Freeze (Effective Immediately)
- **Freeze start:** 2026-04-19 (UTC)
- **Scope:** No new features, schema changes, or UX enhancements until Phase 17 exit criteria are met.
- **Allowed changes during freeze:**
  - Bug fixes for regression failures
  - Test harness/checklist improvements
  - Documentation updates required for QA execution
- **Blocked changes during freeze:**
  - Net-new UI flows
  - New endpoints/functions
  - New business rules not tied to defect resolution

## 2) Full Regression Matrix
Run the full suite by role, then by assignment dimensions.

### A. By Role
| Area | Pass 1 | Pass 2 | Notes |
|---|---|---|---|
| Admin workflow regression | ☐ | ☐ | Login, dashboard, participants, progress, feedback, reports |
| Participant workflow regression | ☐ | ☐ | Login, status, progress update, feedback submit/history |

### B. By Assignment Dimension
| Dimension | Coverage | Pass 1 | Pass 2 | Notes |
|---|---|---|---|---|
| Group | Facility, Consultant, Certification Review, Program Observer | ☐ | ☐ | Validate assignment + filtering effects |
| Scenario | First-Time Seeker, Active Certified, Lapsed/Not Renewed, Failed/Revoked/Suspended/Remediation-Focused | ☐ | ☐ | Validate scenario-dependent records |
| Wave | Wave 1, Wave 2, Wave 3 | ☐ | ☐ | Validate wave assignment and update persistence |

## 3) Critical Control Retest Checklist
All controls below must pass **twice consecutively** with no unresolved blockers.

| Critical Control | Pass 1 | Pass 2 | Evidence |
|---|---|---|---|
| Access control (admin/participant route guard behavior) | ☐ | ☐ | |
| Participant creation (approved application → participant record) | ☐ | ☐ | |
| Onboarding acknowledgement visibility/state | ☐ | ☐ | |
| Progress save + update | ☐ | ☐ | |
| Feedback submit + admin review/update | ☐ | ☐ | |
| CSV exports (applications/participants/progress/feedback/admin actions) | ☐ | ☐ | |

## 4) Defect Register Process
Use `docs/qa/defect-register.csv` for every defect raised during regression.

### Severity Definitions
- **Critical:** Core workflow blocked, data corruption/loss, security/access breach.
- **High:** Major workflow degradation with no acceptable workaround.
- **Medium:** Partial feature break with workaround available.
- **Low:** Minor issue/cosmetic/non-blocking quality gap.

### Triage SLA
- Critical: immediate triage and hotfix candidate
- High: same-day triage
- Medium/Low: scheduled in freeze backlog based on pilot risk

## 5) Stop/Go Gate
Release is **GO** only when all are true:
1. No **Critical** defects open.
2. No **High** defects open in core workflows.
3. All critical paths pass **twice consecutively**.

If any condition fails, status is **NO-GO** and freeze remains active.

## 6) Execution Log
| Date (UTC) | Run Type | Result | Owner | Notes |
|---|---|---|---|---|
| 2026-04-19 | Phase 17 initialized | In Progress | Engineering | Freeze declared; regression templates created |

