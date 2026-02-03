# /compound — Document Solved Problems

**Command:** `/compound`
**Purpose:** Document solved problems for future reference. Knowledge compounds.

---

## Usage

```
/compound                    # Interactive mode
/compound "problem desc"     # Quick document
```

---

## Output Format

Creates `vault/solutions/[category]/[slug].md` with:

1. **Symptom** — How the problem presented
2. **Investigation** — What we tried
3. **Root Cause** — What was actually wrong
4. **Solution** — How we fixed it
5. **Prevention** — How to avoid in future

---

## Categories

- `build-errors`
- `test-failures`
- `runtime-errors`
- `config-issues`
- `performance-issues`
- `security-issues`
- `integration-issues`
- `database-issues`

---

## Why It Matters

```
Week 1:  Problem takes 30 min to solve
Week 4:  Same problem → search solutions/ → 2 min
Week 12: 50+ solutions, most problems pre-solved
Result:  Hours saved weekly, compounding
```
