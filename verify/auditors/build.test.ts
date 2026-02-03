import { describe, it, expect, vi } from 'vitest';
import { buildAuditor } from './build';

describe('Build Auditor', () => {
  it('should return PASS when build succeeds', async () => {
    const mockExec = vi.fn().mockResolvedValue({ stdout: 'Build complete', stderr: '', exitCode: 0 });
    const result = await buildAuditor({ exec: mockExec });
    expect(result.status).toBe('PASS');
    expect(result.success).toBe(true);
  });

  it('should return FAIL when build fails', async () => {
    const mockExec = vi.fn().mockResolvedValue({ stdout: '', stderr: 'Build error', exitCode: 1 });
    const result = await buildAuditor({ exec: mockExec });
    expect(result.status).toBe('FAIL');
    expect(result.success).toBe(false);
  });

  it('should capture duration', async () => {
    const mockExec = vi.fn().mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 });
    const result = await buildAuditor({ exec: mockExec });
    expect(result.duration_ms).toBeGreaterThanOrEqual(0);
  });

  it('should return structured result', async () => {
    const mockExec = vi.fn().mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 });
    const result = await buildAuditor({ exec: mockExec });
    expect(result).toHaveProperty('auditor', 'build');
    expect(result).toHaveProperty('status');
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('errors');
    expect(result).toHaveProperty('warnings');
  });
});
