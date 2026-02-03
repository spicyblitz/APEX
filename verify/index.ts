/**
 * /verify Command - Main Entry Point
 * 
 * Runs 7 auditors in parallel and synthesizes results.
 * 
 * Usage:
 *   /verify       - Full verification
 *   /verify quick - Quick verification (3 core auditors)
 *   /verify deep  - Deep verification with extended checks
 */

import { testSuiteAuditor, TestSuiteResult } from './auditors/test-suite';
import { lintTypeAuditor, LintTypeResult } from './auditors/lint-type';
import { buildAuditor, BuildResult } from './auditors/build';
import { securityAuditor, SecurityResult } from './auditors/security';
import { entryPointAuditor, EntryPointResult } from './auditors/entry-point';
import { documentationAuditor, DocumentationResult } from './auditors/documentation';
import { stateAuditor, StateResult } from './auditors/state';
import { synthesize, SynthesisResult } from './synthesis';

interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

interface VerifyOptions {
  exec: (command: string) => Promise<ExecResult>;
  projectPath?: string;
  mode?: 'quick' | 'standard' | 'deep';
  testCommand?: string;
  lintCommand?: string;
  buildCommand?: string;
  typecheckCommand?: string;
  entryCommand?: string;
}

export interface VerifyResult extends SynthesisResult {
  mode: 'quick' | 'standard' | 'deep';
}

/**
 * Run all 7 auditors in parallel
 */
export async function verify(options: VerifyOptions): Promise<VerifyResult> {
  const { exec, projectPath = '.', mode = 'standard' } = options;
  const startTime = Date.now();

  // Define auditor options
  const auditorOpts = { exec, projectPath };

  // Determine which auditors to run based on mode
  const runQuick = mode === 'quick';
  
  // Run auditors in parallel
  const results = await Promise.allSettled([
    // Core auditors (always run)
    testSuiteAuditor({ ...auditorOpts, testCommand: options.testCommand }),
    lintTypeAuditor({ ...auditorOpts, lintCommand: options.lintCommand, typecheckCommand: options.typecheckCommand }),
    buildAuditor({ ...auditorOpts, buildCommand: options.buildCommand }),
    // Extended auditors (skip in quick mode)
    ...(!runQuick ? [
      securityAuditor(auditorOpts),
      entryPointAuditor({ ...auditorOpts, entryCommand: options.entryCommand }),
      documentationAuditor(auditorOpts),
      stateAuditor(auditorOpts),
    ] : [])
  ]);

  // Extract results, handling failures
  const extractResult = <T>(result: PromiseSettledResult<T>, defaultStatus: string): T | undefined => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    console.error(`Auditor failed: ${result.reason}`);
    return undefined;
  };

  const auditorResults: {
    'test-suite'?: TestSuiteResult;
    'lint-type'?: LintTypeResult;
    'build'?: BuildResult;
    'security'?: SecurityResult;
    'entry-point'?: EntryPointResult;
    'documentation'?: DocumentationResult;
    'state'?: StateResult;
  } = {
    'test-suite': extractResult(results[0], 'test-suite') as TestSuiteResult | undefined,
    'lint-type': extractResult(results[1], 'lint-type') as LintTypeResult | undefined,
    'build': extractResult(results[2], 'build') as BuildResult | undefined,
  };

  // Add extended auditors if not quick mode
  if (!runQuick && results.length > 3) {
    auditorResults['security'] = extractResult(results[3], 'security') as SecurityResult | undefined;
    auditorResults['entry-point'] = extractResult(results[4], 'entry-point') as EntryPointResult | undefined;
    auditorResults['documentation'] = extractResult(results[5], 'documentation') as DocumentationResult | undefined;
    auditorResults['state'] = extractResult(results[6], 'state') as StateResult | undefined;
  }

  // Synthesize results
  const synthesis = synthesize(auditorResults, startTime);

  return {
    ...synthesis,
    mode
  };
}

/**
 * Format verification result for display
 */
export function formatReport(result: VerifyResult): string {
  const lines: string[] = [];
  
  lines.push('═'.repeat(75));
  lines.push(`  VERIFICATION REPORT`);
  lines.push('═'.repeat(75));
  lines.push('');
  lines.push(`Mode:     ${result.mode.toUpperCase()}`);
  lines.push(`Status:   ${result.overall}`);
  lines.push(`Duration: ${result.duration_ms}ms`);
  lines.push(`Time:     ${result.timestamp}`);
  lines.push('');
  lines.push('─'.repeat(75));
  lines.push('  AUDITOR RESULTS');
  lines.push('─'.repeat(75));
  lines.push('');
  
  // Auditor table
  const auditorNames = ['test-suite', 'lint-type', 'build', 'security', 'entry-point', 'documentation', 'state'];
  for (const name of auditorNames) {
    const auditor = result.auditors[name as keyof typeof result.auditors];
    if (auditor) {
      const status = auditor.status === 'PASS' ? '✅' : auditor.status === 'WARN' ? '⚠️' : '❌';
      lines.push(`  ${status} ${name.padEnd(15)} ${auditor.status}`);
    }
  }
  
  lines.push('');
  lines.push(`Summary: ${result.summary.passed} passed, ${result.summary.warned} warned, ${result.summary.failed} failed`);
  
  // Blockers
  if (result.blockers.length > 0) {
    lines.push('');
    lines.push('─'.repeat(75));
    lines.push('  BLOCKERS');
    lines.push('─'.repeat(75));
    for (const blocker of result.blockers) {
      lines.push(`  ❌ ${blocker}`);
    }
  }
  
  // Warnings
  if (result.warnings.length > 0) {
    lines.push('');
    lines.push('─'.repeat(75));
    lines.push('  WARNINGS');
    lines.push('─'.repeat(75));
    for (const warning of result.warnings) {
      lines.push(`  ⚠️  ${warning}`);
    }
  }
  
  // Correlations
  if (result.correlations.length > 0) {
    lines.push('');
    lines.push('─'.repeat(75));
    lines.push('  CROSS-CUTTING ANALYSIS');
    lines.push('─'.repeat(75));
    for (const corr of result.correlations) {
      lines.push(`  Issue: ${corr.issue}`);
      lines.push(`  Fix:   ${corr.fix}`);
      lines.push('');
    }
  }
  
  lines.push('═'.repeat(75));
  
  return lines.join('\n');
}

// Export all types
export type {
  TestSuiteResult,
  LintTypeResult,
  BuildResult,
  SecurityResult,
  EntryPointResult,
  DocumentationResult,
  StateResult,
  SynthesisResult
};
