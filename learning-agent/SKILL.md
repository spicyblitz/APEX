# Learning Agent — Self-Healing Core

**Purpose:** Make the system smarter over time WITHOUT human intervention.

---

## Process

```
DETECT: Pattern in operational data
    ↓
VALIDATE: Calculate confidence
    │
    ├── Confidence < 70% → DISCARD
    ├── Confidence 70-85% → HUMAN REVIEW
    └── Confidence ≥ 85% → AUTO-GENERATE SKILL
```

---

## What It Monitors

- memory/*.md — Daily logs
- ops/*.md — State and runlog
- vault/solutions/ — Solved problems
- Execution patterns

---

## Self-Healing Actions

1. Auto-generates skills from validated patterns
2. Updates workflows when better approaches found
3. Auto-corrects drift (fixes, doesn't just report)

---

## Escalation Triggers

- Stuck > 2 hours on same step
- Contradicts existing pattern
- High-impact skill change
- Blocked with no workaround
