/**
 * Entry Point Auditor
 * 
 * Verifies main entry point runs (--help).
 * Part of /verify command - 7 auditors.
 */

export interface EntryPointResult {
  auditor: 'entry-point';
  status: 'PASS' | 'FAIL';
  success: boolean;
  output: string;
  error?: string;
}

interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

interface AuditorOptions {
  exec: (command: string) => Promise<ExecResult>;
  entryCommand?: string;
  projectPath?: string;
}

export async function entryPointAuditor(options: AuditorOptions): Promise<EntryPointResult> {
  const { exec, entryCommand = 'npx tsx index.ts --help', projectPath = '.' } = options;
  
  try {
    const result = await exec(`cd ${projectPath} && ${entryCommand} 2>&1`);
    const success = result.exitCode === 0;
    
    return {
      auditor: 'entry-point',
      status: success ? 'PASS' : 'FAIL',
      success,
      output: result.stdout.slice(0, 500)
    };
  } catch (error) {
    return {
      auditor: 'entry-point',
      status: 'FAIL',
      success: false,
      output: '',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
