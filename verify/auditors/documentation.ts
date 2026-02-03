/**
 * Documentation Auditor
 * 
 * Checks README exists and has content.
 * Part of /verify command - 7 auditors.
 */

export interface DocumentationResult {
  auditor: 'documentation';
  status: 'PASS' | 'FAIL';
  readme_exists: boolean;
  readme_lines: number;
}

interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

interface AuditorOptions {
  exec: (command: string) => Promise<ExecResult>;
  projectPath?: string;
  minLines?: number;
}

export async function documentationAuditor(options: AuditorOptions): Promise<DocumentationResult> {
  const { exec, projectPath = '.', minLines = 20 } = options;
  
  try {
    const result = await exec(`cd ${projectPath} && wc -l README.md 2>/dev/null`);
    const lines = parseInt(result.stdout.trim().split(' ')[0], 10) || 0;
    
    return {
      auditor: 'documentation',
      status: lines >= minLines ? 'PASS' : 'FAIL',
      readme_exists: true,
      readme_lines: lines
    };
  } catch {
    return {
      auditor: 'documentation',
      status: 'FAIL',
      readme_exists: false,
      readme_lines: 0
    };
  }
}
