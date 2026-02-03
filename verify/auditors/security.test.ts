import { describe, it, expect, vi } from 'vitest';
import { securityAuditor } from './security';

describe('Security Auditor', () => {
  it('should return PASS when no issues found', async () => {
    const mockExec = vi.fn().mockResolvedValue({ stdout: '', stderr: '', exitCode: 1 });
    const result = await securityAuditor({ exec: mockExec });
    expect(result.status).toBe('PASS');
    expect(result.secrets.found).toBe(0);
  });

  it('should return FAIL when secrets found', async () => {
    const mockExec = vi.fn()
      .mockResolvedValueOnce({ stdout: './src/config.ts:10:password="secret"', stderr: '', exitCode: 0 })
      .mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 });
    const result = await securityAuditor({ exec: mockExec });
    expect(result.status).toBe('FAIL');
    expect(result.secrets.found).toBeGreaterThan(0);
  });

  it('should check env files gitignored', async () => {
    const mockExec = vi.fn().mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 });
    const result = await securityAuditor({ exec: mockExec });
    expect(result.env_files.gitignored).toBe(true);
  });

  it('should return structured result', async () => {
    const mockExec = vi.fn().mockResolvedValue({ stdout: '', stderr: '', exitCode: 1 });
    const result = await securityAuditor({ exec: mockExec });
    expect(result).toHaveProperty('auditor', 'security');
    expect(result).toHaveProperty('secrets');
    expect(result).toHaveProperty('env_files');
    expect(result).toHaveProperty('dependencies');
  });
});
