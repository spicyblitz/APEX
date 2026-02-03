import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { 
  writeSolution, 
  formatSolution, 
  generateSlug, 
  isValidCategory,
  listSolutions,
  Solution 
} from './writer';

describe('Solution Writer', () => {
  const testVaultPath = '/tmp/test-vault-solutions';
  
  const mockSolution: Solution = {
    slug: 'test-solution',
    category: 'build-errors',
    symptom: 'Build fails with error X',
    investigation: 'Tried A, B, C',
    rootCause: 'Missing dependency',
    solution: 'npm install X',
    prevention: 'Add to package.json'
  };

  beforeEach(async () => {
    await fs.mkdir(testVaultPath, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testVaultPath, { recursive: true, force: true });
  });

  describe('isValidCategory()', () => {
    it('should return true for valid categories', () => {
      expect(isValidCategory('build-errors')).toBe(true);
      expect(isValidCategory('test-failures')).toBe(true);
      expect(isValidCategory('config-issues')).toBe(true);
    });

    it('should return false for invalid categories', () => {
      expect(isValidCategory('invalid')).toBe(false);
      expect(isValidCategory('')).toBe(false);
    });
  });

  describe('generateSlug()', () => {
    it('should convert text to slug', () => {
      expect(generateSlug('Build Error Fix')).toBe('build-error-fix');
      expect(generateSlug('Fix: Missing Module!')).toBe('fix-missing-module');
    });

    it('should limit slug length', () => {
      const longText = 'This is a very long description that should be truncated';
      expect(generateSlug(longText).length).toBeLessThanOrEqual(50);
    });
  });

  describe('formatSolution()', () => {
    it('should format solution with all 5 sections', () => {
      const formatted = formatSolution(mockSolution);
      
      expect(formatted).toContain('## Symptom');
      expect(formatted).toContain('## Investigation');
      expect(formatted).toContain('## Root Cause');
      expect(formatted).toContain('## Solution');
      expect(formatted).toContain('## Prevention');
    });

    it('should include metadata', () => {
      const formatted = formatSolution(mockSolution);
      
      expect(formatted).toContain('**Category:** build-errors');
      expect(formatted).toContain('**Date:**');
    });
  });

  describe('writeSolution()', () => {
    it('should write solution file to correct path', async () => {
      const result = await writeSolution(mockSolution, testVaultPath);
      
      expect(result.success).toBe(true);
      expect(result.path).toContain('build-errors');
      expect(result.path).toContain('test-solution.md');
      
      // Verify file exists
      const content = await fs.readFile(result.path, 'utf-8');
      expect(content).toContain('Build fails with error X');
    });

    it('should create category directory if not exists', async () => {
      const result = await writeSolution(mockSolution, testVaultPath);
      
      expect(result.success).toBe(true);
      const stats = await fs.stat(path.join(testVaultPath, 'build-errors'));
      expect(stats.isDirectory()).toBe(true);
    });

    it('should reject invalid category', async () => {
      const invalidSolution = { ...mockSolution, category: 'invalid-category' };
      const result = await writeSolution(invalidSolution, testVaultPath);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid category');
    });
  });

  describe('listSolutions()', () => {
    it('should list solutions in category', async () => {
      await writeSolution(mockSolution, testVaultPath);
      await writeSolution({ ...mockSolution, slug: 'another-solution' }, testVaultPath);
      
      const solutions = await listSolutions('build-errors', testVaultPath);
      
      expect(solutions).toContain('test-solution');
      expect(solutions).toContain('another-solution');
    });

    it('should return empty array for non-existent category', async () => {
      const solutions = await listSolutions('non-existent', testVaultPath);
      expect(solutions).toEqual([]);
    });
  });
});
