import { describe, it, expect } from 'vitest';
import {
  determineAction,
  createEvent,
  shouldNotify,
  formatNotification,
  getNotificationTargets,
  Pattern,
  ConfidenceResult
} from './pattern-validated';

describe('Pattern Validated Trigger', () => {
  const mockPattern: Pattern = {
    name: 'build-project',
    action: 'BUILD',
    occurrences: 50,
    examples: ['Build A', 'Build B'],
    firstSeen: '2026-01-01',
    lastSeen: '2026-02-03'
  };

  const highConfidence: ConfidenceResult = { score: 90, level: 'high', factors: [] };
  const mediumConfidence: ConfidenceResult = { score: 75, level: 'medium', factors: [] };
  const lowConfidence: ConfidenceResult = { score: 50, level: 'low', factors: [] };

  describe('determineAction()', () => {
    it('should auto-generate at ≥85%', () => {
      expect(determineAction(highConfidence)).toBe('auto_generate');
      expect(determineAction({ score: 85, level: 'high', factors: [] })).toBe('auto_generate');
    });

    it('should require human review at 70-84%', () => {
      expect(determineAction(mediumConfidence)).toBe('human_review');
    });

    it('should discard at <70%', () => {
      expect(determineAction(lowConfidence)).toBe('discard');
    });
  });

  describe('createEvent()', () => {
    it('should create event with all fields', () => {
      const event = createEvent(mockPattern, highConfidence);
      
      expect(event.pattern).toBe(mockPattern);
      expect(event.confidence).toBe(highConfidence);
      expect(event.timestamp).toBeDefined();
      expect(event.action).toBe('auto_generate');
    });
  });

  describe('shouldNotify()', () => {
    it('should notify for auto_generate', () => {
      const event = createEvent(mockPattern, highConfidence);
      expect(shouldNotify(event)).toBe(true);
    });

    it('should notify for human_review', () => {
      const event = createEvent(mockPattern, mediumConfidence);
      expect(shouldNotify(event)).toBe(true);
    });

    it('should not notify for discard', () => {
      const event = createEvent(mockPattern, lowConfidence);
      expect(shouldNotify(event)).toBe(false);
    });
  });

  describe('formatNotification()', () => {
    it('should format notification message', () => {
      const event = createEvent(mockPattern, highConfidence);
      const message = formatNotification(event);
      
      expect(message).toContain('Pattern Validated');
      expect(message).toContain('build-project');
      expect(message).toContain('90%');
    });
  });

  describe('getNotificationTargets()', () => {
    it('should include file target always', () => {
      const event = createEvent(mockPattern, highConfidence);
      const targets = getNotificationTargets(event);
      
      expect(targets.some(t => t.type === 'file')).toBe(true);
    });

    it('should include channel for auto_generate', () => {
      const event = createEvent(mockPattern, highConfidence);
      const targets = getNotificationTargets(event);
      
      expect(targets.some(t => t.type === 'channel' && t.target === '#patterns')).toBe(true);
    });
  });
});
