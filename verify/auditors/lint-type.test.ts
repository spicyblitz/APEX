/**
 * Lint/Type Auditor - Tests
 * 
 * TDD: Write test first, then implement.
 * Requirement: FR-4.1 from APEX-SPEC.md
 * Success Criterion: SC-1
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { lintTypeAuditor, LintTypeResult } from './lint-type';

describe('Lint/Type Auditor', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('lintTypeAuditor()', () => {
    it('should return PASS when lint and type check pass', async () => {
      // Arrange
      const mockExec = vi.fn()
        .mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0 }) // lint
        .mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0 }); // typecheck

      // Act
      const result = await lintTypeAuditor({ exec: mockExec });

      // Assert
      expect(result.auditor).toBe('lint-type');
      expect(result.status).toBe('PASS');
      expect(result.lint.errors).toBe(0);
      expect(result.lint.warnings).toBe(0);
      expect(result.typecheck.errors).toBe(0);
    });

    it('should return FAIL when lint has errors', async () => {
      // Arrange
      const mockExec = vi.fn()
        .mockResolvedValueOnce({ 
          stdout: `
/src/file.ts
  1:10  error  'foo' is not defined  no-undef
  5:3   error  Missing semicolon     semi

✖ 2 problems (2 errors, 0 warnings)
`,
          stderr: '', 
          exitCode: 1 
        })
        .mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0 });

      // Act
      const result = await lintTypeAuditor({ exec: mockExec });

      // Assert
      expect(result.status).toBe('FAIL');
      expect(result.lint.errors).toBe(2);
    });

    it('should return WARN when lint has only warnings', async () => {
      // Arrange
      const mockExec = vi.fn()
        .mockResolvedValueOnce({ 
          stdout: `
/src/file.ts
  1:10  warning  Unexpected console statement  no-console

✖ 1 problem (0 errors, 1 warning)
`,
          stderr: '', 
          exitCode: 0 
        })
        .mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0 });

      // Act
      const result = await lintTypeAuditor({ exec: mockExec });

      // Assert
      expect(result.status).toBe('WARN');
      expect(result.lint.warnings).toBe(1);
    });

    it('should return FAIL when type check has errors', async () => {
      // Arrange
      const mockExec = vi.fn()
        .mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0 })
        .mockResolvedValueOnce({ 
          stdout: `
src/file.ts(10,5): error TS2322: Type 'string' is not assignable to type 'number'.
src/file.ts(15,3): error TS2304: Cannot find name 'foo'.
`,
          stderr: '', 
          exitCode: 1 
        });

      // Act
      const result = await lintTypeAuditor({ exec: mockExec });

      // Assert
      expect(result.status).toBe('FAIL');
      expect(result.typecheck.errors).toBe(2);
    });

    it('should capture file and line information for issues', async () => {
      // Arrange
      const mockExec = vi.fn()
        .mockResolvedValueOnce({ 
          stdout: `/src/file.ts
  1:10  error  'foo' is not defined  no-undef

✖ 1 problem (1 error, 0 warnings)`,
          stderr: '', 
          exitCode: 1 
        })
        .mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0 });

      // Act
      const result = await lintTypeAuditor({ exec: mockExec });

      // Assert
      expect(result.lint.issues.length).toBeGreaterThan(0);
      expect(result.lint.issues[0]).toHaveProperty('file');
      expect(result.lint.issues[0]).toHaveProperty('line');
      expect(result.lint.issues[0]).toHaveProperty('message');
    });

    it('should return structured result object', async () => {
      // Arrange
      const mockExec = vi.fn().mockResolvedValue({ stdout: '', stderr: '', exitCode: 0 });

      // Act
      const result = await lintTypeAuditor({ exec: mockExec });

      // Assert
      expect(result).toHaveProperty('auditor');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('lint');
      expect(result.lint).toHaveProperty('errors');
      expect(result.lint).toHaveProperty('warnings');
      expect(result.lint).toHaveProperty('issues');
      expect(result).toHaveProperty('typecheck');
      expect(result.typecheck).toHaveProperty('configured');
      expect(result.typecheck).toHaveProperty('errors');
      expect(result.typecheck).toHaveProperty('issues');
    });

    it('should handle missing typecheck gracefully', async () => {
      // Arrange
      const mockExec = vi.fn()
        .mockResolvedValueOnce({ stdout: '', stderr: '', exitCode: 0 })
        .mockRejectedValueOnce(new Error('Command not found: tsc'));

      // Act
      const result = await lintTypeAuditor({ exec: mockExec });

      // Assert
      expect(result.typecheck.configured).toBe(false);
      expect(result.status).toBe('PASS'); // Lint passed, no typecheck = still pass
    });
  });
});
