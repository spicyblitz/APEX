/**
 * Build Auditor
 * 
 * Runs build command, reports success/failure.
 * Part of /verify command - 7 auditors.
 */

export interface BuildResult {
  auditor: 'build';
  status: 'PASS' | 'WARN' | 'FAIL';
  success: boolean;
  duration_ms: number;
  errors: string[];
  warnings: string[];
  artifacts: { path: string; exists: boolean; size_bytes?: number }[];
}

interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

interface AuditorOptions {
  exec: (command: string) => Promise<ExecResult>;
  buildCommand?: string;
  projectPath?: string;
}

export async function buildAuditor(options: AuditorOptions): Promise<BuildResult> {
  const { exec, buildCommand = 'npm run build', projectPath = '.' } = options;
  const startTime = Date.now();
  
  const result: BuildResult = {
    auditor: 'build',
    status: 'PASS',
    success: true,
    duration_ms: 0,
    errors: [],
    warnings: [],
    artifacts: []
  };

  try {
    const buildResult = await exec(`cd ${projectPath} && ${buildCommand} 2>&1`);
    result.duration_ms = Date.now() - startTime;
    result.success = buildResult.exitCode === 0;
    
    // Extract errors and warnings
    const output = buildResult.stdout + buildResult.stderr;
    const errorLines = output.split('\n').filter(l => /error/i.test(l) && !/0 errors/i.test(l));
    const warningLines = output.split('\n').filter(l => /warning/i.test(l) && !/0 warnings/i.test(l));
    
    result.errors = errorLines.slice(0, 10);
    result.warnings = warningLines.slice(0, 10);
    
    if (!result.success || result.errors.length > 0) {
      result.status = 'FAIL';
    } else if (result.warnings.length > 0) {
      result.status = 'WARN';
    }
  } catch (error) {
    result.duration_ms = Date.now() - startTime;
    result.success = false;
    result.status = 'FAIL';
    result.errors = [error instanceof Error ? error.message : String(error)];
  }

  return result;
}
