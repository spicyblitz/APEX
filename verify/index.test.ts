import { describe, it, expect, vi } from 'vitest';
import { verify, formatReport } from './index';

describe('/verify Command', () => {
  const mockExec = vi.fn().mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 });

  it('should run all 7 auditors in standard mode', async () => {
    const result = await verify({ exec: mockExec, mode: 'standard' });
    expect(result.mode).toBe('standard');
    expect(result.auditors['test-suite']).toBeDefined();
    expect(result.auditors['lint-type']).toBeDefined();
    expect(result.auditors['build']).toBeDefined();
    expect(result.auditors['security']).toBeDefined();
    expect(result.auditors['entry-point']).toBeDefined();
    expect(result.auditors['documentation']).toBeDefined();
    expect(result.auditors['state']).toBeDefined();
  });

  it('should run only 3 auditors in quick mode', async () => {
    const result = await verify({ exec: mockExec, mode: 'quick' });
    expect(result.mode).toBe('quick');
    expect(result.auditors['test-suite']).toBeDefined();
    expect(result.auditors['lint-type']).toBeDefined();
    expect(result.auditors['build']).toBeDefined();
    expect(result.auditors['security']).toBeUndefined();
  });

  it('should synthesize results and determine overall status', async () => {
    const result = await verify({ exec: mockExec });
    expect(result).toHaveProperty('overall');
    expect(result).toHaveProperty('summary');
    expect(result).toHaveProperty('timestamp');
    expect(result).toHaveProperty('duration_ms');
  });

  it('should run auditors in parallel', async () => {
    const slowExec = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({ stdout: '', stderr: '', exitCode: 0 }), 50))
    );
    
    const startTime = Date.now();
    await verify({ exec: slowExec, mode: 'quick' });
    const duration = Date.now() - startTime;
    
    // If running sequentially, would take 150ms (3 auditors * 50ms each)
    // Parallel should be closer to 50-100ms
    expect(duration).toBeLessThan(150);
  });

  describe('formatReport()', () => {
    it('should format report with all sections', async () => {
      const result = await verify({ exec: mockExec });
      const report = formatReport(result);
      
      expect(report).toContain('VERIFICATION REPORT');
      expect(report).toContain('AUDITOR RESULTS');
      expect(report).toContain('test-suite');
    });

    it('should include blockers when present', async () => {
      const failExec = vi.fn()
        .mockResolvedValueOnce({ stdout: 'Tests: 1 failed, 1 passed, 2 total', stderr: '', exitCode: 1 })
        .mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 });
      
      const result = await verify({ exec: failExec, mode: 'quick' });
      const report = formatReport(result);
      
      expect(report).toContain('BLOCKERS');
    });
  });
});
