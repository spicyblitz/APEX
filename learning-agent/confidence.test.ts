import { describe, it, expect } from 'vitest';
import {
  sampleSizeFactor,
  recencyFactor,
  consistencyFactor,
  calculateConfidence,
  shouldAutoGenerate,
  needsHumanReview,
  shouldDiscard,
  Pattern
} from './confidence';

describe('Confidence Calculator', () => {
  const mockPattern: Pattern = {
    name: 'build',
    action: 'BUILD',
    occurrences: 100,
    examples: ['Build project A', 'Build project B', 'Build project C'],
    firstSeen: '2026-01-01 10:00',
    lastSeen: new Date().toISOString()
  };

  describe('sampleSizeFactor()', () => {
    it('should increase with more occurrences', () => {
      expect(sampleSizeFactor(3)).toBeLessThan(sampleSizeFactor(10));
      expect(sampleSizeFactor(10)).toBeLessThan(sampleSizeFactor(100));
    });

    it('should max out at 1.0', () => {
      expect(sampleSizeFactor(1000)).toBeLessThanOrEqual(1);
    });
  });

  describe('recencyFactor()', () => {
    it('should be high for recent patterns', () => {
      const today = new Date().toISOString();
      expect(recencyFactor(today)).toBeGreaterThan(0.9);
    });

    it('should decay over time', () => {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      expect(recencyFactor(weekAgo)).toBeLessThan(1);
    });
  });

  describe('consistencyFactor()', () => {
    it('should be high for similar examples', () => {
      const similar = ['Build project A', 'Build project B', 'Build project C'];
      expect(consistencyFactor(similar)).toBeGreaterThan(0.3);
    });

    it('should be lower for different examples', () => {
      const different = ['Build project', 'Deploy service', 'Run tests'];
      expect(consistencyFactor(different)).toBeLessThan(consistencyFactor(['Build A', 'Build B', 'Build C']));
    });
  });

  describe('calculateConfidence()', () => {
    it('should return score between 0-100', () => {
      const result = calculateConfidence(mockPattern);
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(100);
    });

    it('should include confidence level', () => {
      const result = calculateConfidence(mockPattern);
      expect(['low', 'medium', 'high']).toContain(result.level);
    });

    it('should include factor breakdown', () => {
      const result = calculateConfidence(mockPattern);
      expect(result.factors.length).toBe(3);
      expect(result.factors.map(f => f.name)).toContain('sample_size');
    });
  });

  describe('shouldAutoGenerate()', () => {
    it('should return true for high confidence', () => {
      expect(shouldAutoGenerate({ score: 90, level: 'high', factors: [] })).toBe(true);
      expect(shouldAutoGenerate({ score: 85, level: 'high', factors: [] })).toBe(true);
    });

    it('should return false for lower confidence', () => {
      expect(shouldAutoGenerate({ score: 84, level: 'medium', factors: [] })).toBe(false);
    });
  });

  describe('needsHumanReview()', () => {
    it('should return true for medium confidence', () => {
      expect(needsHumanReview({ score: 75, level: 'medium', factors: [] })).toBe(true);
      expect(needsHumanReview({ score: 80, level: 'medium', factors: [] })).toBe(true);
    });
  });

  describe('shouldDiscard()', () => {
    it('should return true for low confidence', () => {
      expect(shouldDiscard({ score: 50, level: 'low', factors: [] })).toBe(true);
      expect(shouldDiscard({ score: 69, level: 'low', factors: [] })).toBe(true);
    });
  });
});
