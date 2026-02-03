import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import { 
  extractKeywords, 
  parseSolutionFile, 
  indexSolutions,
  searchSolutions,
  SolutionIndex
} from './indexer';

describe('Solution Indexer', () => {
  const testVaultPath = '/tmp/test-vault-indexer';

  beforeEach(async () => {
    await fs.mkdir(path.join(testVaultPath, 'build-errors'), { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testVaultPath, { recursive: true, force: true });
  });

  describe('extractKeywords()', () => {
    it('should extract words longer than 3 chars', () => {
      const keywords = extractKeywords('The quick brown fox jumps');
      expect(keywords).toContain('quick');
      expect(keywords).toContain('brown');
      expect(keywords).not.toContain('the');
      expect(keywords).not.toContain('fox');
    });

    it('should return unique keywords', () => {
      const keywords = extractKeywords('error error error fix');
      expect(keywords.filter(k => k === 'error').length).toBe(1);
    });
  });

  describe('parseSolutionFile()', () => {
    it('should parse solution file metadata', async () => {
      const filePath = path.join(testVaultPath, 'build-errors', 'test-fix.md');
      await fs.writeFile(filePath, `# Solution: test-fix

**Category:** build-errors

---

## Symptom

Build fails with module not found error

---

## Solution

Install the missing module
`);

      const parsed = await parseSolutionFile(filePath);
      
      expect(parsed).not.toBeNull();
      expect(parsed?.slug).toBe('test-fix');
      expect(parsed?.category).toBe('build-errors');
      expect(parsed?.symptom).toContain('module not found');
    });

    it('should return null for non-existent file', async () => {
      const parsed = await parseSolutionFile('/non/existent/file.md');
      expect(parsed).toBeNull();
    });
  });

  describe('indexSolutions()', () => {
    it('should index all solutions in vault', async () => {
      // Create test files
      await fs.writeFile(
        path.join(testVaultPath, 'build-errors', 'fix1.md'),
        '## Symptom\n\nError 1'
      );
      await fs.writeFile(
        path.join(testVaultPath, 'build-errors', 'fix2.md'),
        '## Symptom\n\nError 2'
      );

      const { index, result } = await indexSolutions(testVaultPath);
      
      expect(result.success).toBe(true);
      expect(result.indexed).toBe(2);
      expect(index.length).toBe(2);
    });
  });

  describe('searchSolutions()', () => {
    const mockIndex: SolutionIndex[] = [
      { slug: 'npm-install-fix', category: 'build-errors', path: '/a', symptom: 'npm install fails', keywords: ['install', 'fails', 'module'] },
      { slug: 'typescript-error', category: 'build-errors', path: '/b', symptom: 'typescript compilation error', keywords: ['typescript', 'compilation', 'error'] },
      { slug: 'test-timeout', category: 'test-failures', path: '/c', symptom: 'tests timeout', keywords: ['tests', 'timeout', 'slow'] }
    ];

    it('should find solutions matching query', () => {
      const results = searchSolutions(mockIndex, 'npm install error');
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].slug).toBe('npm-install-fix');
    });

    it('should rank by match count', () => {
      const results = searchSolutions(mockIndex, 'typescript error compilation');
      expect(results[0].slug).toBe('typescript-error');
    });

    it('should return empty for no matches', () => {
      const results = searchSolutions(mockIndex, 'xyz123');
      expect(results.length).toBe(0);
    });
  });
});
