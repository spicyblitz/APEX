#!/usr/bin/env node
/**
 * /verify CLI - Run 7 auditors on a project
 * 
 * Usage:
 *   npx apex-verify [path] [--mode quick|standard|deep]
 */

import { verify, VerifyResult } from '../verify/index.js';
import { exec as execCallback } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(execCallback);

async function execCommand(command: string): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  try {
    const { stdout, stderr } = await execAsync(command, { maxBuffer: 10 * 1024 * 1024 });
    return { stdout, stderr, exitCode: 0 };
  } catch (error: any) {
    return {
      stdout: error.stdout || '',
      stderr: error.stderr || error.message,
      exitCode: error.code || 1
    };
  }
}

function formatReport(result: VerifyResult): string {
  const lines: string[] = [];
  
  lines.push('═══════════════════════════════════════════════════════════════════');
  lines.push('                    VERIFICATION REPORT');
  lines.push('═══════════════════════════════════════════════════════════════════');
  lines.push('');
  lines.push(`Mode:     ${result.mode}`);
  lines.push(`Duration: ${result.duration_ms}ms`);
  lines.push(`Overall:  ${result.overall}`);
  lines.push('');
  lines.push('───────────────────────────────────────────────────────────────────');
  lines.push('                         AUDITOR RESULTS');
  lines.push('───────────────────────────────────────────────────────────────────');
  lines.push('');
  
  const statusIcon = (status: string) => {
    switch (status) {
      case 'PASS': return '✅';
      case 'WARN': return '⚠️';
      case 'FAIL': return '❌';
      default: return '❓';
    }
  };

  lines.push('┌─────────────────────┬────────┬─────────────────────────────────────────┐');
  lines.push('│ Auditor             │ Status │ Summary                                 │');
  lines.push('├─────────────────────┼────────┼─────────────────────────────────────────┤');
  
  // Access auditors from the result object
  const auditorNames = ['test-suite', 'lint-type', 'build', 'security', 'entry-point', 'documentation', 'state'] as const;
  
  function getSummary(name: string, r: any): string {
    switch (name) {
      case 'test-suite': return `${r.passing}/${r.total} passing`;
      case 'lint-type': return r.lint_errors ? `${r.lint_errors} errors` : 'Clean';
      case 'build': return r.success ? 'Build succeeded' : 'Build failed';
      case 'security': return r.secrets_found ? `${r.secrets_found.length} secrets found` : 'No issues';
      case 'entry-point': return r.success ? '--help works' : 'Failed';
      case 'documentation': return r.exists ? `${r.lines} lines` : 'Missing';
      case 'state': return r.clean ? 'Clean' : 'Uncommitted changes';
      default: return '';
    }
  }
  
  for (const auditorName of auditorNames) {
    const auditorResult = result.auditors[auditorName];
    if (auditorResult) {
      const name = auditorName.padEnd(19);
      const status = `${statusIcon(auditorResult.status)} ${auditorResult.status}`.padEnd(6);
      const summary = getSummary(auditorName, auditorResult).slice(0, 39).padEnd(39);
      lines.push(`│ ${name} │ ${status} │ ${summary} │`);
    }
  }
  
  lines.push('└─────────────────────┴────────┴─────────────────────────────────────────┘');
  lines.push('');
  
  if (result.blockers && result.blockers.length > 0) {
    lines.push('BLOCKERS:');
    result.blockers.forEach((b, i) => lines.push(`  ${i + 1}. ${b}`));
    lines.push('');
  }
  
  if (result.warnings && result.warnings.length > 0) {
    lines.push('WARNINGS:');
    result.warnings.forEach((w, i) => lines.push(`  ${i + 1}. ${w}`));
    lines.push('');
  }
  
  lines.push('═══════════════════════════════════════════════════════════════════');
  
  return lines.join('\n');
}

async function main() {
  const args = process.argv.slice(2);
  
  // Parse arguments
  let projectPath = '.';
  let mode: 'quick' | 'standard' | 'deep' = 'standard';
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--mode' && args[i + 1]) {
      mode = args[i + 1] as 'quick' | 'standard' | 'deep';
      i++;
    } else if (!args[i].startsWith('--')) {
      projectPath = args[i];
    }
  }
  
  console.log(`Running /verify on ${projectPath} (mode: ${mode})...\n`);
  
  try {
    const result = await verify({
      exec: execCommand,
      projectPath,
      mode
    });
    
    console.log(formatReport(result));
    
    // Exit with appropriate code
    process.exit(result.overall === 'FAILED' ? 1 : 0);
  } catch (error: any) {
    console.error('Verification failed:', error.message);
    process.exit(1);
  }
}

main();
