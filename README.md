# APEX — Autonomous Pattern Extraction & Cross-Learning System

**Build Status:** 65% complete (Core infrastructure done, integration pending)

---

## What Is APEX?

APEX makes autonomous agents smarter over time by:
1. Extracting patterns from operational data
2. Validating patterns with confidence scoring
3. Auto-generating skills at ≥85% confidence
4. Sharing learnings across projects via triggers

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        APEX CORE                            │
├─────────────────────────────────────────────────────────────┤
│  /verify          │  7 parallel auditors for code quality  │
│  /compound        │  Solution extraction + vault indexing  │
│  Scout            │  Opportunity detection + web search    │
│  Learning Agent   │  Pattern detection + skill generation  │
│  Triggers         │  Cross-project event system            │
│  Security         │  Injection detection + rate limiting   │
└─────────────────────────────────────────────────────────────┘
```

---

## Current State (2026-02-03)

### ✅ COMPLETE (65%)

| Component | Files | Tests | Status |
|-----------|-------|-------|--------|
| **Verify** | 7 auditors + synthesis | 51 tests | ✅ Done |
| **Compound** | indexer + writer | 19 tests | ✅ Done |
| **Scout** | parallel-search + evaluator + writer | 24 tests | ✅ Done |
| **Learning Agent** | monitor + detector + confidence + generator + drift-corrector | 44 tests | ✅ Done |
| **Triggers** | monitor + pattern-validated | 18 tests | ✅ Done |
| **Security** | injection-detector + pre-hook + rate-limiter | 30 tests | ✅ Done |

**Total: 181 tests passing across 24 test files**

### 🔲 REMAINING (35%)

| Component | Description | Status |
|-----------|-------------|--------|
| **CLI Entry Point** | `apex verify`, `apex compound`, `apex scout` commands | Not started |
| **Project Integration** | Wire into Eigen, BLITZ, Gloria | Not started |
| **Cross-Project Sync** | Triggers firing across repos | Not started |
| **Vault Structure** | Standardized vault/solutions/ format | Not started |
| **Cron Integration** | Scheduled learning agent runs | Not started |

---

## Directory Structure

```
/Users/gloria/APEX/
├── README.md           # This file
├── STATE.md            # Current build state
├── package.json        # Dependencies
├── tsconfig.json       # TypeScript config
├── vitest.config.ts    # Test config
│
├── verify/             # 7 auditors for code verification
│   ├── auditors/       # Individual auditor modules
│   ├── index.ts        # Parallel runner
│   └── synthesis.ts    # Report generator
│
├── compound/           # Solution extraction
│   ├── indexer.ts      # Vault search
│   └── writer.ts       # Solution writer
│
├── scout/              # Opportunity detection
│   ├── parallel-search.ts
│   ├── evaluator.ts
│   └── opportunity-writer.ts
│
├── learning-agent/     # Self-healing core
│   ├── monitor.ts      # Log reader
│   ├── detector.ts     # Pattern finder
│   ├── confidence.ts   # Score calculator
│   ├── generator.ts    # Skill creator
│   └── drift-corrector.ts
│
├── triggers/           # Event system
│   ├── monitor.ts      # Status file watcher
│   └── pattern-validated.ts
│
└── security/           # Protection layer
    ├── injection-detector.ts
    ├── pre-hook.ts
    └── rate-limiter.ts
```

---

## Running Tests

```bash
cd /Users/gloria/APEX
npm install
npm test
```

---

## Lessons Learned

1. **Test-first works** — 181 tests prevented regressions during rapid iteration
2. **Parallel auditors** — Running 7 checks simultaneously saves significant time
3. **Confidence thresholds** — 85% auto-generate, 70-84% human review, <70% discard
4. **Injection patterns** — Regex-based detection catches common prompt injection attempts
5. **Rate limiting** — In-memory with sliding window is sufficient for single-instance

---

## Next Steps

1. Create CLI entry points (`/verify`, `/compound`, `/scout` commands)
2. Wire Learning Agent into Gloria's heartbeat
3. Set up cross-project triggers (Eigen → BLITZ, etc.)
4. Deploy to production projects

---

*Built by Gloria for the Incubator*
