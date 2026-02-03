import { describe, it, expect, vi } from 'vitest';
import { entryPointAuditor } from './entry-point';

describe('Entry Point Auditor', () => {
  it('should return PASS when entry point works', async () => {
    const mockExec = vi.fn().mockResolvedValue({ stdout: 'Usage: app [options]', stderr: '', exitCode: 0 });
    const result = await entryPointAuditor({ exec: mockExec });
    expect(result.status).toBe('PASS');
    expect(result.success).toBe(true);
  });

  it('should return FAIL when entry point fails', async () => {
    const mockExec = vi.fn().mockResolvedValue({ stdout: '', stderr: 'Error', exitCode: 1 });
    const result = await entryPointAuditor({ exec: mockExec });
    expect(result.status).toBe('FAIL');
    expect(result.success).toBe(false);
  });

  it('should capture output', async () => {
    const mockExec = vi.fn().mockResolvedValue({ stdout: 'Help text', stderr: '', exitCode: 0 });
    const result = await entryPointAuditor({ exec: mockExec });
    expect(result.output).toContain('Help text');
  });

  it('should return structured result', async () => {
    const mockExec = vi.fn().mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 });
    const result = await entryPointAuditor({ exec: mockExec });
    expect(result).toHaveProperty('auditor', 'entry-point');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('output');
  });
});
