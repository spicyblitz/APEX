import { describe, it, expect } from 'vitest';
import {
  normalizeAction,
  groupByAction,
  detectPatterns,
  isSignificantPattern,
  LogEntry
} from './detector';

describe('Pattern Detector', () => {
  const mockEntries: LogEntry[] = [
    { timestamp: '2026-02-01 10:00', action: 'BUILD', outcome: 'Project A', file: 'a.md' },
    { timestamp: '2026-02-01 11:00', action: 'BUILD', outcome: 'Project B', file: 'a.md' },
    { timestamp: '2026-02-01 12:00', action: 'BUILD', outcome: 'Project C', file: 'a.md' },
    { timestamp: '2026-02-02 10:00', action: 'TEST', outcome: 'Tests pass', file: 'b.md' },
    { timestamp: '2026-02-02 11:00', action: 'TEST', outcome: 'Tests fail', file: 'b.md' },
    { timestamp: '2026-02-03 10:00', action: 'DEPLOY', outcome: 'Deployed', file: 'c.md' }
  ];

  describe('normalizeAction()', () => {
    it('should uppercase and clean action', () => {
      expect(normalizeAction('build')).toBe('BUILD');
      expect(normalizeAction('do-something')).toBe('DO_SOMETHING');
      expect(normalizeAction('Phase 1: Setup')).toBe('PHASE_1_SETUP');
    });
  });

  describe('groupByAction()', () => {
    it('should group entries by normalized action', () => {
      const groups = groupByAction(mockEntries);
      
      expect(groups.get('BUILD')?.length).toBe(3);
      expect(groups.get('TEST')?.length).toBe(2);
      expect(groups.get('DEPLOY')?.length).toBe(1);
    });
  });

  describe('detectPatterns()', () => {
    it('should detect patterns with minimum occurrences', () => {
      const result = detectPatterns(mockEntries, 3);
      
      expect(result.patterns.length).toBe(1); // Only BUILD has 3+
      expect(result.patterns[0].action).toBe('BUILD');
      expect(result.patterns[0].occurrences).toBe(3);
    });

    it('should sort by occurrence count', () => {
      const entries = [
        ...mockEntries,
        { timestamp: '2026-02-03 11:00', action: 'TEST', outcome: 'More tests', file: 'd.md' }
      ];
      
      const result = detectPatterns(entries, 2);
      
      expect(result.patterns[0].occurrences).toBeGreaterThanOrEqual(
        result.patterns[1].occurrences
      );
    });

    it('should capture examples', () => {
      const result = detectPatterns(mockEntries, 3);
      
      expect(result.patterns[0].examples).toContain('Project A');
    });

    it('should track first and last seen', () => {
      const result = detectPatterns(mockEntries, 3);
      
      expect(result.patterns[0].firstSeen).toBe('2026-02-01 10:00');
      expect(result.patterns[0].lastSeen).toBe('2026-02-01 12:00');
    });
  });

  describe('isSignificantPattern()', () => {
    it('should identify significant patterns', () => {
      const pattern = { 
        name: 'build', 
        action: 'BUILD', 
        occurrences: 10,
        examples: [],
        firstSeen: '',
        lastSeen: ''
      };
      
      expect(isSignificantPattern(pattern, 100)).toBe(true);
      expect(isSignificantPattern({ ...pattern, occurrences: 2 }, 100)).toBe(false);
    });
  });
});
