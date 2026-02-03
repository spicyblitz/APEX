/**
 * Lint/Type Auditor
 * 
 * Runs linter and type checker, reports issues.
 * Part of /verify command - 7 auditors.
 * 
 * Requirement: FR-4.1 from APEX-SPEC.md
 * Success Criterion: SC-1
 */

export interface LintIssue {
  file: string;
  line: number;
  column?: number;
  rule?: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface TypeIssue {
  file: string;
  line: number;
  code: string;
  message: string;
}

export interface LintTypeResult {
  auditor: 'lint-type';
  status: 'PASS' | 'WARN' | 'FAIL';
  lint: {
    errors: number;
    warnings: number;
    files_affected: number;
    issues: LintIssue[];
  };
  typecheck: {
    configured: boolean;
    errors: number;
    issues: TypeIssue[];
  };
}

interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

interface AuditorOptions {
  exec: (command: string) => Promise<ExecResult>;
  lintCommand?: string;
  typecheckCommand?: string;
  projectPath?: string;
}

/**
 * Parse ESLint output
 */
function parseLintOutput(output: string): { errors: number; warnings: number; issues: LintIssue[] } {
  const issues: LintIssue[] = [];
  let errors = 0;
  let warnings = 0;

  // Parse ESLint format: "line:col  severity  message  rule"
  const linePattern = /^\s*(\d+):(\d+)\s+(error|warning)\s+(.+?)\s+(\S+)\s*$/gm;
  let currentFile = '';
  
  const lines = output.split('\n');
  for (const line of lines) {
    // Check for file path (starts with / or letter:)
    if (line.match(/^[/\\]|^[a-zA-Z]:/)) {
      currentFile = line.trim();
      continue;
    }

    const match = line.match(/^\s*(\d+):(\d+)\s+(error|warning)\s+(.+?)\s{2,}(\S+)\s*$/);
    if (match) {
      const severity = match[3] as 'error' | 'warning';
      issues.push({
        file: currentFile,
        line: parseInt(match[1], 10),
        column: parseInt(match[2], 10),
        message: match[4].trim(),
        rule: match[5],
        severity
      });
      if (severity === 'error') errors++;
      else warnings++;
    }
  }

  // Also parse summary line: "✖ N problems (X errors, Y warnings)"
  const summaryMatch = output.match(/(\d+)\s*problems?\s*\((\d+)\s*errors?,\s*(\d+)\s*warnings?\)/i);
  if (summaryMatch) {
    errors = parseInt(summaryMatch[2], 10);
    warnings = parseInt(summaryMatch[3], 10);
  }

  return { errors, warnings, issues };
}

/**
 * Parse TypeScript type check output
 */
function parseTypecheckOutput(output: string): { errors: number; issues: TypeIssue[] } {
  const issues: TypeIssue[] = [];

  // Parse TS format: "file.ts(line,col): error TSxxxx: message"
  const pattern = /(.+?)\((\d+),(\d+)\):\s*error\s+(TS\d+):\s*(.+)/g;
  let match;
  
  while ((match = pattern.exec(output)) !== null) {
    issues.push({
      file: match[1],
      line: parseInt(match[2], 10),
      code: match[4],
      message: match[5]
    });
  }

  return { errors: issues.length, issues };
}

/**
 * Lint/Type Auditor
 * 
 * Runs lint and type check commands.
 */
export async function lintTypeAuditor(options: AuditorOptions): Promise<LintTypeResult> {
  const { 
    exec, 
    lintCommand = 'npm run lint',
    typecheckCommand = 'npx tsc --noEmit',
    projectPath = '.' 
  } = options;

  const result: LintTypeResult = {
    auditor: 'lint-type',
    status: 'PASS',
    lint: {
      errors: 0,
      warnings: 0,
      files_affected: 0,
      issues: []
    },
    typecheck: {
      configured: true,
      errors: 0,
      issues: []
    }
  };

  // Run lint
  try {
    const lintResult = await exec(`cd ${projectPath} && ${lintCommand} 2>&1`);
    const parsed = parseLintOutput(lintResult.stdout + lintResult.stderr);
    result.lint.errors = parsed.errors;
    result.lint.warnings = parsed.warnings;
    result.lint.issues = parsed.issues;
    result.lint.files_affected = new Set(parsed.issues.map(i => i.file)).size;
  } catch (error) {
    // Lint command failed
    result.lint.errors = 1;
    result.lint.issues = [{
      file: 'unknown',
      line: 0,
      message: error instanceof Error ? error.message : String(error),
      severity: 'error'
    }];
  }

  // Run type check
  try {
    const typeResult = await exec(`cd ${projectPath} && ${typecheckCommand} 2>&1`);
    const parsed = parseTypecheckOutput(typeResult.stdout + typeResult.stderr);
    result.typecheck.errors = parsed.errors;
    result.typecheck.issues = parsed.issues;
  } catch (error) {
    // Type check not configured or failed
    result.typecheck.configured = false;
  }

  // Determine status
  if (result.lint.errors > 0 || result.typecheck.errors > 0) {
    result.status = 'FAIL';
  } else if (result.lint.warnings > 0) {
    result.status = 'WARN';
  }

  return result;
}
