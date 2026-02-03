import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import {
  detectDrift,
  suggestCorrection,
  applyCorrection,
  suggestWorkflowImprovement,
  autoCorrectDrift,
  Pattern,
  ConfidenceResult
} from './drift-corrector';

describe('Drift Corrector', () => {
  const testDir = '/tmp/test-drift-corrector';
  
  const mockPatterns: Pattern[] = [
    { name: 'build', action: 'BUILD', occurrences: 50, examples: [], firstSeen: '', lastSeen: '' },
    { name: 'test', action: 'TEST', occurrences: 40, examples: [], firstSeen: '', lastSeen: '' },
    { name: 'deploy', action: 'DEPLOY', occurrences: 20, examples: [], firstSeen: '', lastSeen: '' }
  ];

  beforeEach(async () => {
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('detectDrift()', () => {
    it('should find missing expected patterns', () => {
      const expected = ['BUILD', 'TEST', 'VERIFY', 'COMMIT'];
      const missing = detectDrift(mockPatterns, expected);
      
      expect(missing).toContain('VERIFY');
      expect(missing).toContain('COMMIT');
      expect(missing).not.toContain('BUILD');
    });
  });

  describe('suggestCorrection()', () => {
    it('should suggest similar pattern replacement', () => {
      const correction = suggestCorrection('BUILD_PROJECT', mockPatterns);
      
      expect(correction).not.toBeNull();
      expect(correction?.after).toBe('BUILD');
    });

    it('should return null if no similar pattern', () => {
      const correction = suggestCorrection('COMPLETELY_DIFFERENT', mockPatterns);
      expect(correction).toBeNull();
    });
  });

  describe('applyCorrection()', () => {
    it('should replace text in file', async () => {
      const filePath = `${testDir}/workflow.md`;
      await fs.writeFile(filePath, 'Run OLD_PROCESS here');
      
      const applied = await applyCorrection({
        type: 'workflow',
        target: 'test',
        before: 'OLD_PROCESS',
        after: 'NEW_PROCESS',
        reason: 'Better approach found',
        applied: false
      }, filePath);
      
      expect(applied).toBe(true);
      
      const content = await fs.readFile(filePath, 'utf-8');
      expect(content).toContain('NEW_PROCESS');
    });
  });

  describe('suggestWorkflowImprovement()', () => {
    it('should suggest automation for high confidence patterns', () => {
      const suggestion = suggestWorkflowImprovement(
        mockPatterns[0],
        { score: 90, level: 'high', factors: [] }
      );
      
      expect(suggestion).not.toBeNull();
      expect(suggestion?.reason).toContain('90%');
    });

    it('should not suggest for low confidence', () => {
      const suggestion = suggestWorkflowImprovement(
        mockPatterns[0],
        { score: 60, level: 'low', factors: [] }
      );
      
      expect(suggestion).toBeNull();
    });
  });

  describe('autoCorrectDrift()', () => {
    it('should generate corrections at high confidence', async () => {
      const result = await autoCorrectDrift(
        mockPatterns,
        ['BUILD', 'TEST', 'VERIFY'],
        90
      );
      
      expect(result.success).toBe(true);
      // VERIFY is missing
    });

    it('should not auto-correct at low confidence', async () => {
      const result = await autoCorrectDrift(
        mockPatterns,
        ['BUILD', 'TEST', 'VERIFY'],
        60
      );
      
      expect(result.corrections.length).toBe(0);
    });
  });
});
