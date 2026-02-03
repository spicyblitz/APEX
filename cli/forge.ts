#!/usr/bin/env node
/**
 * /forge CLI - Create new project with compound engineering structure
 * 
 * Usage:
 *   npx apex-forge <project-name> [--path <dir>]
 * 
 * Creates:
 *   .forge/DISCOVERY.md
 *   .forge/SPEC.md
 *   .forge/PLAN.md
 *   .forge/MANIFEST.md
 *   CLAUDE.md
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

function generateDiscovery(name: string, description: string): string {
  const date = new Date().toISOString().split('T')[0];
  return `# Discovery: ${name}

**Date:** ${date}
**Status:** In Progress

---

## Problem Statement

${description}

---

## Research

### Questions to Answer

1. [ ] Who has this problem?
2. [ ] How are they solving it today?
3. [ ] What would 10x better look like?

### Sources Consulted

- [ ] Reddit threads
- [ ] HN discussions
- [ ] Competitor analysis
- [ ] User interviews

### Key Findings

*(Document findings as research progresses)*

---

## Opportunity Assessment

| Factor | Score (1-10) | Notes |
|--------|--------------|-------|
| Market Size | | |
| Pain Severity | | |
| Solution Clarity | | |
| Time to Revenue | | |
| Competitive Moat | | |

**Total Score:** /50

---

## Decision

- [ ] **GO** — Proceed to SPEC
- [ ] **NO-GO** — Document reasons, archive
- [ ] **PIVOT** — Reframe and re-evaluate
`;
}

function generateSpec(name: string, description: string): string {
  const date = new Date().toISOString().split('T')[0];
  return `# Specification: ${name}

**Source of Truth:** This document
**Date:** ${date}
**Status:** Draft

---

## Overview

### What We Are Building

${description}

### What We Are NOT Building

- *(List explicit exclusions)*

---

## Success Criteria

### Core Success (P0)

These must ALL be true for the project to be considered complete.

- [ ] **SC-1:** *(First success criterion)*
- [ ] **SC-2:** *(Second success criterion)*
- [ ] **SC-3:** *(Third success criterion)*

### Extended Success (P1)

Important but not blocking launch.

- [ ] **SC-4:** *(Optional criterion)*

---

## Functional Requirements

| ID | Requirement | Success Criterion | Priority |
|----|-------------|-------------------|----------|
| FR-1 | | | P0 |
| FR-2 | | | P0 |
| FR-3 | | | P1 |

---

## Non-Functional Requirements

| Category | Requirement | Target | How to Verify |
|----------|-------------|--------|---------------|
| Performance | | | |
| Security | | | |
| Reliability | | | |

---

## Acceptance Test Scenarios

### Scenario 1: Happy Path

\`\`\`gherkin
Feature: [Feature name]

Scenario: [Scenario name]
  Given [precondition]
  When [action]
  Then [expected result]
\`\`\`

---

## Sign-off

| Role | Status | Date |
|------|--------|------|
| Owner | [ ] Approved | |

**Once signed off, this spec is LOCKED.**
`;
}

function generatePlan(name: string): string {
  const date = new Date().toISOString().split('T')[0];
  return `# Implementation Plan: ${name}

**Source:** SPEC.md
**Date:** ${date}
**Status:** Draft

---

## Approach

TDD with phased implementation. Each phase has a success gate.

---

## Phases

### Phase 1: Foundation

**Goal:** *(Define phase goal)*

| Step | Task | Test to Write | Verification |
|------|------|---------------|--------------|
| 1.1 | | | |
| 1.2 | | | |

**Phase 1 Success Gate:**
- [ ] All tests pass
- [ ] Code reviewed
- [ ] Committed

---

### Phase 2: Core Features

**Goal:** *(Define phase goal)*

| Step | Task | Test to Write | Verification |
|------|------|---------------|--------------|
| 2.1 | | | |
| 2.2 | | | |

**Phase 2 Success Gate:**
- [ ] All tests pass
- [ ] /verify passes
- [ ] Committed

---

## TDD Protocol Per Step

1. Read SPEC.md success criterion
2. Write test that verifies criterion
3. Run test → MUST FAIL (red)
4. Implement minimal code to pass
5. Run test → MUST PASS (green)
6. Refactor if needed
7. Commit

---

## Progress Tracking

| Phase | Step | Status | Started | Completed |
|-------|------|--------|---------|-----------|
| 1 | 1.1 | Not Started | | |
| 1 | 1.2 | Not Started | | |
| 2 | 2.1 | Not Started | | |

---

## Recovery Instructions

If resuming work:
1. Read SPEC.md and this PLAN.md
2. Find current phase/step in Progress Tracking
3. Run /verify to confirm state
4. Continue from last checkpoint
`;
}

function generateManifest(name: string): string {
  const date = new Date().toISOString().split('T')[0];
  return `# Manifest: ${name}

**Purpose:** Completeness checklist
**Source:** SPEC.md
**Date:** ${date}

---

## How to Use

During and after implementation:
1. Check each component exists
2. Check each component is tested
3. Check each component is documented

**Project is complete when ALL boxes are checked.**

---

## Components

| ID | Component | Description | Tested | Documented | Complete |
|----|-----------|-------------|--------|------------|----------|
| C-1 | | | [ ] | [ ] | [ ] |
| C-2 | | | [ ] | [ ] | [ ] |
| C-3 | | | [ ] | [ ] | [ ] |

---

## Completeness Gate

Before declaring complete:

- [ ] All components: Created, Tested, Documented
- [ ] All Success Criteria from SPEC.md: Met
- [ ] /verify passes
- [ ] /audit passes

**COMPLETE = All boxes checked.**
`;
}

function generateClaude(name: string, description: string): string {
  return `# ${name}

${description}

## Project Structure

- \`.forge/DISCOVERY.md\` — Research and opportunity assessment
- \`.forge/SPEC.md\` — Requirements specification (lock before building)
- \`.forge/PLAN.md\` — Implementation plan with TDD steps
- \`.forge/MANIFEST.md\` — Completeness checklist

## Development Process

1. **Research** — Complete DISCOVERY.md
2. **Specify** — Write SPEC.md, then \`/crystallize\`
3. **Plan** — Fill out PLAN.md with phases and steps
4. **Build** — Follow TDD: test first, implement, refactor
5. **Verify** — Run \`/verify\` after each phase
6. **Audit** — Run \`/audit\` at completion
7. **Compound** — Document solutions with \`/compound\`

## Commands

- \`/verify\` — Run 7 auditors on this project
- \`/audit\` — Trace implementation against spec
- \`/compound\` — Document a solved problem
`;
}

async function main() {
  const args = process.argv.slice(2);
  
  let projectName = '';
  let targetPath = '.';
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--path' && args[i + 1]) {
      targetPath = args[i + 1];
      i++;
    } else if (!args[i].startsWith('--')) {
      projectName = args[i];
    }
  }
  
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('                    /forge - Create Project');
  console.log('═══════════════════════════════════════════════════════════════════\n');
  
  if (!projectName) {
    projectName = await prompt('Project name: ');
  }
  
  const description = await prompt('Brief description: ');
  
  const projectDir = path.join(targetPath, projectName);
  const forgeDir = path.join(projectDir, '.forge');
  
  // Create directories
  console.log(`\nCreating project at ${projectDir}...`);
  fs.mkdirSync(forgeDir, { recursive: true });
  
  // Write files
  fs.writeFileSync(path.join(forgeDir, 'DISCOVERY.md'), generateDiscovery(projectName, description));
  console.log('  ✅ .forge/DISCOVERY.md');
  
  fs.writeFileSync(path.join(forgeDir, 'SPEC.md'), generateSpec(projectName, description));
  console.log('  ✅ .forge/SPEC.md');
  
  fs.writeFileSync(path.join(forgeDir, 'PLAN.md'), generatePlan(projectName));
  console.log('  ✅ .forge/PLAN.md');
  
  fs.writeFileSync(path.join(forgeDir, 'MANIFEST.md'), generateManifest(projectName));
  console.log('  ✅ .forge/MANIFEST.md');
  
  fs.writeFileSync(path.join(projectDir, 'CLAUDE.md'), generateClaude(projectName, description));
  console.log('  ✅ CLAUDE.md');
  
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log(`Project "${projectName}" forged successfully!`);
  console.log('');
  console.log('Next steps:');
  console.log('  1. Complete .forge/DISCOVERY.md (research)');
  console.log('  2. Fill out .forge/SPEC.md (requirements)');
  console.log('  3. Run /crystallize to lock the spec');
  console.log('  4. Plan implementation in .forge/PLAN.md');
  console.log('  5. Build with TDD');
  console.log('═══════════════════════════════════════════════════════════════════');
}

main().catch(console.error);
