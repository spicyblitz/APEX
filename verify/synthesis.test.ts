import { describe, it, expect } from 'vitest';
import { synthesize } from './synthesis';

describe('Synthesis Engine', () => {
  const mockResults = {
    'test-suite': { auditor: 'test-suite' as const, status: 'PASS' as const, total: 10, passing: 10, failing: 0, skipped: 0, duration_ms: 100, failures: [], slow_tests: [], flaky_suspects: [] },
    'lint-type': { auditor: 'lint-type' as const, status: 'PASS' as const, lint: { errors: 0, warnings: 0, files_affected: 0, issues: [] }, typecheck: { configured: true, errors: 0, issues: [] } },
    'build': { auditor: 'build' as const, status: 'PASS' as const, success: true, duration_ms: 100, errors: [], warnings: [], artifacts: [] },
    'security': { auditor: 'security' as const, status: 'PASS' as const, secrets: { found: 0, files: [] }, env_files: { tracked: [], gitignored: true }, dependencies: { critical: 0, high: 0, moderate: 0, low: 0 } },
    'entry-point': { auditor: 'entry-point' as const, status: 'PASS' as const, success: true, output: 'Usage' },
    'documentation': { auditor: 'documentation' as const, status: 'PASS' as const, readme_exists: true, readme_lines: 50 },
    'state': { auditor: 'state' as const, status: 'PASS' as const, clean: true, uncommitted_files: 0, branch: 'main', files: [] }
  };

  it('should return VERIFIED when all pass', () => {
    const result = synthesize(mockResults, Date.now() - 100);
    expect(result.overall).toBe('VERIFIED');
    expect(result.summary.passed).toBe(7);
    expect(result.summary.failed).toBe(0);
  });

  it('should return FAILED when any fail', () => {
    const failedResults = { ...mockResults, 'test-suite': { ...mockResults['test-suite'], status: 'FAIL' as const, failing: 2 } };
    const result = synthesize(failedResults, Date.now());
    expect(result.overall).toBe('FAILED');
    expect(result.blockers.length).toBeGreaterThan(0);
  });

  it('should return WARNINGS when warn but no fail', () => {
    const warnResults = { ...mockResults, 'state': { ...mockResults['state'], status: 'WARN' as const, clean: false, uncommitted_files: 3 } };
    const result = synthesize(warnResults, Date.now());
    expect(result.overall).toBe('WARNINGS');
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('should find correlations between lint and build failures', () => {
    const correlatedResults = {
      ...mockResults,
      'lint-type': { ...mockResults['lint-type'], status: 'FAIL' as const, lint: { errors: 2, warnings: 0, files_affected: 1, issues: [] }, typecheck: { configured: true, errors: 0, issues: [] } },
      'build': { ...mockResults['build'], status: 'FAIL' as const, success: false }
    };
    const result = synthesize(correlatedResults, Date.now());
    expect(result.correlations.length).toBeGreaterThan(0);
    expect(result.correlations[0].auditors).toContain('lint-type');
    expect(result.correlations[0].auditors).toContain('build');
  });

  it('should include timestamp and duration', () => {
    const result = synthesize(mockResults, Date.now() - 500);
    expect(result.timestamp).toBeTruthy();
    expect(result.duration_ms).toBeGreaterThanOrEqual(0);
  });

  it('should collect blockers from failed auditors', () => {
    const failedResults = {
      ...mockResults,
      'security': { ...mockResults['security'], status: 'FAIL' as const, secrets: { found: 2, files: [] } }
    };
    const result = synthesize(failedResults, Date.now());
    expect(result.blockers).toContain('[Security] 2 secret(s) detected');
  });
});
