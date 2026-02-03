/**
 * Test Suite Auditor
 * 
 * Runs project tests and reports pass/fail status.
 * Part of /verify command - 7 auditors.
 * 
 * Requirement: FR-4.1 from APEX-SPEC.md
 * Success Criterion: SC-1
 */

export interface TestFailure {
  file: string;
  test: string;
  error: string;
}

export interface TestSuiteResult {
  auditor: 'test-suite';
  status: 'PASS' | 'WARN' | 'FAIL';
  total: number;
  passing: number;
  failing: number;
  skipped: number;
  duration_ms: number;
  failures: TestFailure[];
  slow_tests: string[];
  flaky_suspects: string[];
}

interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

interface AuditorOptions {
  exec: (command: string) => Promise<ExecResult>;
  testCommand?: string;
  projectPath?: string;
}

/**
 * Parse test output to extract counts and failures
 */
function parseTestOutput(output: string): Partial<TestSuiteResult> {
  const result: Partial<TestSuiteResult> = {
    total: 0,
    passing: 0,
    failing: 0,
    skipped: 0,
    failures: [],
    slow_tests: [],
    flaky_suspects: []
  };

  // Parse Jest/Vitest format: "Tests: X passed, Y total"
  const jestMatch = output.match(/Tests:\s*(?:(\d+)\s*failed,\s*)?(?:(\d+)\s*skipped,\s*)?(\d+)\s*passed,\s*(\d+)\s*total/i);
  if (jestMatch) {
    result.failing = parseInt(jestMatch[1] || '0', 10);
    result.skipped = parseInt(jestMatch[2] || '0', 10);
    result.passing = parseInt(jestMatch[3], 10);
    result.total = parseInt(jestMatch[4], 10);
  }

  // Parse pytest format: "X passed in Y.YYs"
  const pytestMatch = output.match(/(\d+)\s*passed(?:,\s*(\d+)\s*failed)?(?:,\s*(\d+)\s*skipped)?\s*in\s*([\d.]+)s/i);
  if (pytestMatch && !jestMatch) {
    result.passing = parseInt(pytestMatch[1], 10);
    result.failing = parseInt(pytestMatch[2] || '0', 10);
    result.skipped = parseInt(pytestMatch[3] || '0', 10);
    result.total = result.passing + result.failing + result.skipped;
  }

  // Parse duration
  const timeMatch = output.match(/Time:\s*([\d.]+)s/i) || output.match(/in\s*([\d.]+)s/i);
  if (timeMatch) {
    result.duration_ms = Math.round(parseFloat(timeMatch[1]) * 1000);
  }

  // Detect slow tests (>5000ms)
  const slowTestMatches = output.matchAll(/[✓✗]\s*(.+?)\s*\((\d+)ms\)/g);
  for (const match of slowTestMatches) {
    const testName = match[1];
    const duration = parseInt(match[2], 10);
    if (duration > 5000) {
      result.slow_tests!.push(`${testName} (${duration}ms)`);
    }
  }

  // Extract failure details
  const failureMatches = output.matchAll(/[✗×]\s*(.+?)(?:\s*\((\d+)ms\))?[\n\r]+\s*(Expected:|Error:)(.+?)(?=\n\n|\n[✓✗×]|$)/gs);
  for (const match of failureMatches) {
    result.failures!.push({
      file: 'unknown',
      test: match[1].trim(),
      error: (match[3] + match[4]).trim()
    });
  }

  return result;
}

/**
 * Determine overall status based on results
 */
function determineStatus(result: Partial<TestSuiteResult>): 'PASS' | 'WARN' | 'FAIL' {
  if (result.failing && result.failing > 0) {
    return 'FAIL';
  }
  if (result.skipped && result.skipped > 0) {
    return 'WARN';
  }
  return 'PASS';
}

/**
 * Test Suite Auditor
 * 
 * Runs tests and analyzes results.
 */
export async function testSuiteAuditor(options: AuditorOptions): Promise<TestSuiteResult> {
  const { exec, testCommand = 'npm test', projectPath = '.' } = options;

  const startTime = Date.now();
  
  try {
    const command = `cd ${projectPath} && ${testCommand} 2>&1`;
    const execResult = await exec(command);
    
    const parsed = parseTestOutput(execResult.stdout + execResult.stderr);
    const duration_ms = parsed.duration_ms || (Date.now() - startTime);
    
    return {
      auditor: 'test-suite',
      status: determineStatus(parsed),
      total: parsed.total || 0,
      passing: parsed.passing || 0,
      failing: parsed.failing || 0,
      skipped: parsed.skipped || 0,
      duration_ms,
      failures: parsed.failures || [],
      slow_tests: parsed.slow_tests || [],
      flaky_suspects: parsed.flaky_suspects || []
    };
  } catch (error) {
    return {
      auditor: 'test-suite',
      status: 'FAIL',
      total: 0,
      passing: 0,
      failing: 1,
      skipped: 0,
      duration_ms: Date.now() - startTime,
      failures: [{
        file: 'unknown',
        test: 'test execution',
        error: error instanceof Error ? error.message : String(error)
      }],
      slow_tests: [],
      flaky_suspects: []
    };
  }
}
