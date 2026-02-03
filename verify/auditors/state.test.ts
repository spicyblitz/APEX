import { describe, it, expect, vi } from 'vitest';
import { stateAuditor } from './state';

describe('State Auditor', () => {
  it('should return PASS when git clean', async () => {
    const mockExec = vi.fn()
      .mockResolvedValueOnce({ stdout: 'main', stderr: '', exitCode: 0 })
      .mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0 });
    const result = await stateAuditor({ exec: mockExec });
    expect(result.status).toBe('PASS');
    expect(result.clean).toBe(true);
  });

  it('should return WARN when uncommitted changes', async () => {
    const mockExec = vi.fn()
      .mockResolvedValueOnce({ stdout: 'main', stderr: '', exitCode: 0 })
      .mockResolvedValueOnce({ stdout: 'M file.ts', stderr: '', exitCode: 0 });
    const result = await stateAuditor({ exec: mockExec });
    expect(result.status).toBe('WARN');
    expect(result.clean).toBe(false);
    expect(result.uncommitted_files).toBe(1);
  });

  it('should capture branch name', async () => {
    const mockExec = vi.fn()
      .mockResolvedValueOnce({ stdout: 'feature-branch', stderr: '', exitCode: 0 })
      .mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0 });
    const result = await stateAuditor({ exec: mockExec });
    expect(result.branch).toBe('feature-branch');
  });

  it('should return structured result', async () => {
    const mockExec = vi.fn().mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 });
    const result = await stateAuditor({ exec: mockExec });
    expect(result).toHaveProperty('auditor', 'state');
    expect(result).toHaveProperty('clean');
    expect(result).toHaveProperty('uncommitted_files');
    expect(result).toHaveProperty('branch');
    expect(result).toHaveProperty('files');
  });
});
