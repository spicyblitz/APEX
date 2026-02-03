/**
 * State Auditor
 * 
 * Checks git status is clean.
 * Part of /verify command - 7 auditors.
 */

export interface StateResult {
  auditor: 'state';
  status: 'PASS' | 'WARN' | 'FAIL';
  clean: boolean;
  uncommitted_files: number;
  branch: string;
  files: string[];
}

interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

interface AuditorOptions {
  exec: (command: string) => Promise<ExecResult>;
  projectPath?: string;
}

export async function stateAuditor(options: AuditorOptions): Promise<StateResult> {
  const { exec, projectPath = '.' } = options;
  
  const result: StateResult = {
    auditor: 'state',
    status: 'PASS',
    clean: true,
    uncommitted_files: 0,
    branch: 'unknown',
    files: []
  };

  try {
    // Get current branch
    const branchResult = await exec(`cd ${projectPath} && git branch --show-current 2>/dev/null`);
    result.branch = branchResult.stdout.trim() || 'unknown';
    
    // Get status
    const statusResult = await exec(`cd ${projectPath} && git status --porcelain 2>/dev/null`);
    const lines = statusResult.stdout.split('\n').filter(l => l.trim());
    
    result.files = lines.slice(0, 20);
    result.uncommitted_files = lines.length;
    result.clean = lines.length === 0;
    
    if (!result.clean) {
      result.status = 'WARN';
    }
  } catch {
    result.status = 'FAIL';
    result.clean = false;
  }

  return result;
}
