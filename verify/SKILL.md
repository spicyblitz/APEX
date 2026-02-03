# /verify — 7 Auditor Verification

**Command:** `/verify`
**Purpose:** Run 7 parallel auditors to verify project correctness.

---

## Usage

```
/verify           # Full verification (7 auditors)
/verify quick     # Quick verification (3 core auditors)
/verify deep      # Deep verification (7 auditors + extended checks)
```

---

## Auditors

| # | Auditor | Checks | Pass Criteria |
|---|---------|--------|---------------|
| 1 | Test Suite | Tests exist and pass | >80% pass |
| 2 | Lint/Type | Code quality | No errors |
| 3 | Build | Compiles/imports | Success |
| 4 | Security | Secrets, vulns | None found |
| 5 | Entry Point | Main runs | --help works |
| 6 | Documentation | README exists | >20 lines |
| 7 | State | Git status | Clean |

---

## Output

Unified report showing:
- Per-auditor status (PASS/WARN/FAIL)
- Execution time (parallel vs sequential)
- Cross-cutting analysis (correlations between failures)
- Actionable fix recommendations

---

## Implementation Status

- [ ] Test Suite Auditor
- [ ] Lint/Type Auditor
- [ ] Build Auditor
- [ ] Security Auditor
- [ ] Entry Point Auditor
- [ ] Documentation Auditor
- [ ] State Auditor
- [ ] Synthesis Engine
- [ ] Main Entry Point

---

## Files

```
skills/verify/
├── SKILL.md           ← This file
├── index.ts           ← Main entry, parallel execution
├── synthesis.ts       ← Aggregates results
└── auditors/
    ├── test-suite.ts
    ├── lint-type.ts
    ├── build.ts
    ├── security.ts
    ├── entry-point.ts
    ├── documentation.ts
    └── state.ts
```
