/**
 * APEX - Autonomous Pattern Extraction & Cross-Learning System
 * 
 * Main entry point
 */

// Verify
export { verify, VerifyResult } from './verify/index.js';
export { synthesize, SynthesisResult } from './verify/synthesis.js';

// Compound
export { writeSolution, Solution, WriteResult } from './compound/writer.js';
export { searchSolutions, indexSolutions } from './compound/indexer.js';

// Scout
export { parallelSearch, ParallelSearchResult } from './scout/parallel-search.js';
export { evaluateOpportunity } from './scout/evaluator.js';
export { writeOpportunity, Opportunity } from './scout/opportunity-writer.js';

// Learning Agent
export { monitorAll, MonitorResult } from './learning-agent/monitor.js';
export { detectPatterns, DetectorResult, Pattern } from './learning-agent/detector.js';
export { calculateConfidence, ConfidenceResult } from './learning-agent/confidence.js';
export { generateSkill, writeSkill, GeneratedSkill } from './learning-agent/generator.js';

// Triggers
export { checkTriggers, Trigger, TriggerResult } from './triggers/monitor.js';
export { createEvent, shouldNotify, PatternValidatedEvent } from './triggers/pattern-validated.js';

// Security
export { securityGate, GateResult } from './security/pre-hook.js';
export { detectInjections, InjectionResult } from './security/injection-detector.js';
export { checkLimit, RateLimitResult } from './security/rate-limiter.js';

console.log('APEX v0.3.0 - Run apex-verify, apex-compound, apex-forge, apex-tdd, apex-scout, apex-learn, or apex-trigger');
