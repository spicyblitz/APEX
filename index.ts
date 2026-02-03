#!/usr/bin/env npx tsx
/**
 * APEX - Autonomous Pattern Extraction & Cross-Learning System
 * 
 * Main entry point
 */

// Core exports
export { verify } from './verify/index.js';
export { synthesize } from './verify/synthesis.js';
export { writeSolution } from './compound/writer.js';
export { searchSolutions, indexSolutions } from './compound/indexer.js';
export { parallelSearch } from './scout/parallel-search.js';
export { evaluateOpportunity } from './scout/evaluator.js';
export { writeOpportunity } from './scout/opportunity-writer.js';
export { monitorAll } from './learning-agent/monitor.js';
export { detectPatterns } from './learning-agent/detector.js';
export { calculateConfidence } from './learning-agent/confidence.js';
export { generateSkill, writeSkill } from './learning-agent/generator.js';
export { checkTriggers } from './triggers/monitor.js';
export { createEvent, shouldNotify } from './triggers/pattern-validated.js';
export { securityGate } from './security/pre-hook.js';
export { detectInjections } from './security/injection-detector.js';
export { checkLimit } from './security/rate-limiter.js';

// CLI
if (process.argv[1]?.endsWith('index.ts') || process.argv[1]?.endsWith('index.js')) {
  const arg = process.argv[2];
  if (arg === '--help' || arg === '-h' || !arg) {
    console.log(`
APEX v0.3.0 - Autonomous Pattern Extraction & Cross-Learning System

Commands:
  apex-verify     Run 7 auditors on a project
  apex-compound   Document a solved problem
  apex-forge      Create new project structure
  apex-tdd        Enforce test-first development
  apex-scout      Parallel web search for opportunities
  apex-learn      Detect patterns from memory files
  apex-trigger    Manage cross-project triggers

Usage:
  npx apex-verify [path]
  npx apex-compound
  npx apex-forge <project-name>
  npx apex-tdd <source-file>
  npx apex-scout <query>
  npx apex-learn [--path <memory-dir>]
  npx apex-trigger list|check
`);
    process.exit(0);
  }
}
