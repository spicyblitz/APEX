/**
 * Test Suite Auditor - Tests
 * 
 * TDD: Write test first, then implement.
 * Requirement: FR-4.1 from APEX-SPEC.md
 * Success Criterion: SC-1
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { testSuiteAuditor, TestSuiteResult } from './test-suite';

describe('Test Suite Auditor', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('testSuiteAuditor()', () => {
    it('should return PASS when all tests pass', async () => {
      // Arrange: Mock exec to return passing test output
      const mockExec = vi.fn().mockResolvedValue({
        stdout: `
 PASS  tests/example.test.ts
 ✓ should work (5ms)
 ✓ should also work (3ms)

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
Time:        1.234s
`,
        stderr: '',
        exitCode: 0
      });

      // Act
      const result = await testSuiteAuditor({ exec: mockExec });

      // Assert
      expect(result.auditor).toBe('test-suite');
      expect(result.status).toBe('PASS');
      expect(result.total).toBe(2);
      expect(result.passing).toBe(2);
      expect(result.failing).toBe(0);
    });

    it('should return FAIL when tests fail', async () => {
      // Arrange
      const mockExec = vi.fn().mockResolvedValue({
        stdout: `
 FAIL  tests/example.test.ts
 ✓ should work (5ms)
 ✗ should also work (3ms)
   Expected: true
   Received: false

Test Suites: 1 failed, 1 total
Tests:       1 failed, 1 passed, 2 total
Time:        1.234s
`,
        stderr: '',
        exitCode: 1
      });

      // Act
      const result = await testSuiteAuditor({ exec: mockExec });

      // Assert
      expect(result.status).toBe('FAIL');
      expect(result.failing).toBe(1);
      expect(result.failures.length).toBeGreaterThan(0);
    });

    it('should return WARN when tests are skipped', async () => {
      // Arrange
      const mockExec = vi.fn().mockResolvedValue({
        stdout: `
Test Suites: 1 passed, 1 total
Tests:       1 skipped, 2 passed, 3 total
Time:        1.234s
`,
        stderr: '',
        exitCode: 0
      });

      // Act
      const result = await testSuiteAuditor({ exec: mockExec });

      // Assert
      expect(result.status).toBe('WARN');
      expect(result.skipped).toBe(1);
    });

    it('should detect slow tests (>5s)', async () => {
      // Arrange
      const mockExec = vi.fn().mockResolvedValue({
        stdout: `
 PASS  tests/slow.test.ts
 ✓ slow test (6234ms)
 ✓ fast test (50ms)

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
Time:        7.5s
`,
        stderr: '',
        exitCode: 0
      });

      // Act
      const result = await testSuiteAuditor({ exec: mockExec });

      // Assert
      expect(result.slow_tests.length).toBeGreaterThan(0);
    });

    it('should return structured result object', async () => {
      // Arrange
      const mockExec = vi.fn().mockResolvedValue({
        stdout: 'Tests: 5 passed, 5 total',
        stderr: '',
        exitCode: 0
      });

      // Act
      const result = await testSuiteAuditor({ exec: mockExec });

      // Assert: Verify result structure matches APEX-SPEC interface
      expect(result).toHaveProperty('auditor');
      expect(result).toHaveProperty('status');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('passing');
      expect(result).toHaveProperty('failing');
      expect(result).toHaveProperty('skipped');
      expect(result).toHaveProperty('duration_ms');
      expect(result).toHaveProperty('failures');
      expect(result).toHaveProperty('slow_tests');
    });

    it('should handle npm test command', async () => {
      // Arrange
      const mockExec = vi.fn().mockResolvedValue({
        stdout: 'Tests: 10 passed, 10 total',
        stderr: '',
        exitCode: 0
      });

      // Act
      await testSuiteAuditor({ exec: mockExec, testCommand: 'npm test' });

      // Assert
      expect(mockExec).toHaveBeenCalledWith(expect.stringContaining('npm test'));
    });

    it('should handle pytest output format', async () => {
      // Arrange
      const mockExec = vi.fn().mockResolvedValue({
        stdout: `
============================= test session starts ==============================
collected 5 items

tests/test_example.py .....                                              [100%]

============================== 5 passed in 0.12s ===============================
`,
        stderr: '',
        exitCode: 0
      });

      // Act
      const result = await testSuiteAuditor({ exec: mockExec, testCommand: 'pytest' });

      // Assert
      expect(result.status).toBe('PASS');
      expect(result.total).toBe(5);
      expect(result.passing).toBe(5);
    });
  });
});
