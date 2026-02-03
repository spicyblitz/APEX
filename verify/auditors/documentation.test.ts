import { describe, it, expect, vi } from 'vitest';
import { documentationAuditor } from './documentation';

describe('Documentation Auditor', () => {
  it('should return PASS when README has enough lines', async () => {
    const mockExec = vi.fn().mockResolvedValue({ stdout: '      50 README.md', stderr: '', exitCode: 0 });
    const result = await documentationAuditor({ exec: mockExec });
    expect(result.status).toBe('PASS');
    expect(result.readme_exists).toBe(true);
    expect(result.readme_lines).toBe(50);
  });

  it('should return FAIL when README too short', async () => {
    const mockExec = vi.fn().mockResolvedValue({ stdout: '      10 README.md', stderr: '', exitCode: 0 });
    const result = await documentationAuditor({ exec: mockExec });
    expect(result.status).toBe('FAIL');
    expect(result.readme_lines).toBe(10);
  });

  it('should return FAIL when README missing', async () => {
    const mockExec = vi.fn().mockRejectedValue(new Error('No such file'));
    const result = await documentationAuditor({ exec: mockExec });
    expect(result.status).toBe('FAIL');
    expect(result.readme_exists).toBe(false);
  });

  it('should return structured result', async () => {
    const mockExec = vi.fn().mockResolvedValue({ stdout: '25 README.md', stderr: '', exitCode: 0 });
    const result = await documentationAuditor({ exec: mockExec });
    expect(result).toHaveProperty('auditor', 'documentation');
    expect(result).toHaveProperty('readme_exists');
    expect(result).toHaveProperty('readme_lines');
  });
});
