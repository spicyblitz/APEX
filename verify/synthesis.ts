/**
 * Synthesis Engine
 * 
 * Aggregates results from all 7 auditors.
 * Identifies cross-cutting issues and correlations.
 * Generates unified verification report.
 */

import type { TestSuiteResult } from './auditors/test-suite';
import type { LintTypeResult } from './auditors/lint-type';
import type { BuildResult } from './auditors/build';
import type { SecurityResult } from './auditors/security';
import type { EntryPointResult } from './auditors/entry-point';
import type { DocumentationResult } from './auditors/documentation';
import type { StateResult } from './auditors/state';

export interface AuditorResult {
  auditor: string;
  status: 'PASS' | 'WARN' | 'FAIL';
}

export interface Correlation {
  issue: string;
  auditors: string[];
  impact: string;
  fix: string;
}

export interface SynthesisResult {
  overall: 'VERIFIED' | 'WARNINGS' | 'FAILED';
  timestamp: string;
  duration_ms: number;
  auditors: {
    'test-suite'?: TestSuiteResult;
    'lint-type'?: LintTypeResult;
    'build'?: BuildResult;
    'security'?: SecurityResult;
    'entry-point'?: EntryPointResult;
    'documentation'?: DocumentationResult;
    'state'?: StateResult;
  };
  summary: {
    passed: number;
    warned: number;
    failed: number;
  };
  correlations: Correlation[];
  blockers: string[];
  warnings: string[];
}

type AllResults = {
  'test-suite'?: TestSuiteResult;
  'lint-type'?: LintTypeResult;
  'build'?: BuildResult;
  'security'?: SecurityResult;
  'entry-point'?: EntryPointResult;
  'documentation'?: DocumentationResult;
  'state'?: StateResult;
};

/**
 * Find correlations between auditor results
 */
function findCorrelations(results: AllResults): Correlation[] {
  const correlations: Correlation[] = [];

  // Test failures + Build failures often correlate
  const testFailed = results['test-suite']?.status === 'FAIL';
  const buildFailed = results['build']?.status === 'FAIL';
  const lintFailed = results['lint-type']?.status === 'FAIL';

  if (lintFailed && buildFailed) {
    correlations.push({
      issue: 'Lint errors likely causing build failure',
      auditors: ['lint-type', 'build'],
      impact: 'Build blocked by lint errors',
      fix: 'Fix lint errors first, then rebuild'
    });
  }

  if (testFailed && buildFailed) {
    correlations.push({
      issue: 'Build failure may cause test failures',
      auditors: ['test-suite', 'build'],
      impact: 'Tests cannot run on broken build',
      fix: 'Fix build first, then re-run tests'
    });
  }

  // Security issues + State issues
  const securityFailed = results['security']?.status === 'FAIL';
  const stateUnclean = results['state']?.status !== 'PASS';

  if (securityFailed && stateUnclean) {
    correlations.push({
      issue: 'Uncommitted changes may include security issues',
      auditors: ['security', 'state'],
      impact: 'Security issue in working changes',
      fix: 'Review uncommitted files for secrets before committing'
    });
  }

  return correlations;
}

/**
 * Synthesize all auditor results into unified report
 */
export function synthesize(
  results: AllResults,
  startTime: number
): SynthesisResult {
  const auditorResults = Object.values(results).filter(Boolean) as AuditorResult[];
  
  const passed = auditorResults.filter(r => r.status === 'PASS').length;
  const warned = auditorResults.filter(r => r.status === 'WARN').length;
  const failed = auditorResults.filter(r => r.status === 'FAIL').length;

  // Determine overall status
  let overall: 'VERIFIED' | 'WARNINGS' | 'FAILED';
  if (failed > 0) {
    overall = 'FAILED';
  } else if (warned > 0) {
    overall = 'WARNINGS';
  } else {
    overall = 'VERIFIED';
  }

  // Collect blockers and warnings
  const blockers: string[] = [];
  const warnings: string[] = [];

  if (results['test-suite']?.status === 'FAIL') {
    const failing = results['test-suite'].failing;
    blockers.push(`[Test Suite] ${failing} test(s) failing`);
  }
  if (results['lint-type']?.status === 'FAIL') {
    const errors = results['lint-type'].lint.errors + results['lint-type'].typecheck.errors;
    blockers.push(`[Lint/Type] ${errors} error(s)`);
  }
  if (results['build']?.status === 'FAIL') {
    blockers.push('[Build] Build failed');
  }
  if (results['security']?.status === 'FAIL') {
    if (results['security'].secrets.found > 0) {
      blockers.push(`[Security] ${results['security'].secrets.found} secret(s) detected`);
    }
    if (!results['security'].env_files.gitignored) {
      blockers.push('[Security] .env files tracked in git');
    }
  }
  if (results['entry-point']?.status === 'FAIL') {
    blockers.push('[Entry Point] Main entry point failed');
  }
  if (results['documentation']?.status === 'FAIL') {
    blockers.push('[Documentation] README missing or too short');
  }

  if (results['state']?.status === 'WARN') {
    warnings.push(`[State] ${results['state'].uncommitted_files} uncommitted file(s)`);
  }
  if (results['security']?.status === 'WARN') {
    const moderate = results['security'].dependencies.moderate;
    warnings.push(`[Security] ${moderate} moderate vulnerability(ies)`);
  }

  return {
    overall,
    timestamp: new Date().toISOString(),
    duration_ms: Date.now() - startTime,
    auditors: results,
    summary: { passed, warned, failed },
    correlations: findCorrelations(results),
    blockers,
    warnings
  };
}
