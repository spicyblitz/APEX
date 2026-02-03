/**
 * Security Auditor
 * 
 * Scans for secrets, checks env tracking, audits dependencies.
 * Part of /verify command - 7 auditors.
 */

export interface SecretFinding {
  file: string;
  line: number;
  pattern: string;
}

export interface SecurityResult {
  auditor: 'security';
  status: 'PASS' | 'WARN' | 'FAIL';
  secrets: {
    found: number;
    files: SecretFinding[];
  };
  env_files: {
    tracked: string[];
    gitignored: boolean;
  };
  dependencies: {
    critical: number;
    high: number;
    moderate: number;
    low: number;
  };
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

const SECRET_PATTERNS = [
  'password=',
  'api_key=',
  'secret=',
  'token=',
  'Bearer ',
  'AKIA',  // AWS Access Key
  'BEGIN PRIVATE KEY',
  'BEGIN RSA PRIVATE KEY'
];

export async function securityAuditor(options: AuditorOptions): Promise<SecurityResult> {
  const { exec, projectPath = '.' } = options;
  
  const result: SecurityResult = {
    auditor: 'security',
    status: 'PASS',
    secrets: { found: 0, files: [] },
    env_files: { tracked: [], gitignored: true },
    dependencies: { critical: 0, high: 0, moderate: 0, low: 0 }
  };

  // Scan for secrets
  try {
    const grepPattern = SECRET_PATTERNS.map(p => `-e "${p}"`).join(' ');
    const scanResult = await exec(
      `cd ${projectPath} && grep -rn ${grepPattern} --include="*.ts" --include="*.js" --include="*.json" . 2>/dev/null | grep -v node_modules | grep -v ".test." | grep -v ".env.example" | grep -v "security.ts" | grep -v "security.js" | grep -v "/dist/" | head -20`
    );
    
    const lines = scanResult.stdout.split('\n').filter(l => l.trim());
    for (const line of lines) {
      const match = line.match(/^\.\/(.+):(\d+):/);
      if (match) {
        result.secrets.files.push({
          file: match[1],
          line: parseInt(match[2], 10),
          pattern: 'secret pattern detected'
        });
      }
    }
    result.secrets.found = result.secrets.files.length;
  } catch {
    // No secrets found (grep returns non-zero when no matches)
  }

  // Check if .env is tracked
  try {
    const gitStatus = await exec(`cd ${projectPath} && git status --porcelain .env* 2>/dev/null`);
    const tracked = gitStatus.stdout.split('\n').filter(l => !l.startsWith('?') && l.trim());
    result.env_files.tracked = tracked;
    result.env_files.gitignored = tracked.length === 0;
  } catch {
    result.env_files.gitignored = true;
  }

  // Check dependencies (npm audit)
  try {
    const auditResult = await exec(`cd ${projectPath} && npm audit --json 2>/dev/null`);
    const audit = JSON.parse(auditResult.stdout);
    if (audit.metadata?.vulnerabilities) {
      result.dependencies.critical = audit.metadata.vulnerabilities.critical || 0;
      result.dependencies.high = audit.metadata.vulnerabilities.high || 0;
      result.dependencies.moderate = audit.metadata.vulnerabilities.moderate || 0;
      result.dependencies.low = audit.metadata.vulnerabilities.low || 0;
    }
  } catch {
    // No npm audit or parse error
  }

  // Determine status
  if (result.secrets.found > 0 || !result.env_files.gitignored || result.dependencies.critical > 0 || result.dependencies.high > 0) {
    result.status = 'FAIL';
  } else if (result.dependencies.moderate > 0) {
    result.status = 'WARN';
  }

  return result;
}
