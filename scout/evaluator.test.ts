import { describe, it, expect } from 'vitest';
import {
  scoreOpportunity,
  getRecommendation,
  evaluateOpportunity,
  evaluateOpportunities,
  getApproved,
  Opportunity
} from './evaluator';

describe('Opportunity Evaluator', () => {
  const mockOpp: Opportunity = {
    source: 'reddit',
    signal: 'User needs X',
    painPoint: 'Current tools are complex and expensive for small teams',
    opportunity: 'Build a simple, affordable alternative targeting small teams',
    relevance: 8,
    effort: 'M'
  };

  describe('scoreOpportunity()', () => {
    it('should score based on relevance and effort', () => {
      expect(scoreOpportunity({ ...mockOpp, relevance: 10, effort: 'S' })).toBeGreaterThan(10);
      expect(scoreOpportunity({ ...mockOpp, relevance: 5, effort: 'L' })).toBeLessThanOrEqual(5);
    });

    it('should give bonus for detailed pain point', () => {
      const detailed = { ...mockOpp, painPoint: 'A'.repeat(60) };
      const brief = { ...mockOpp, painPoint: 'Short' };
      expect(scoreOpportunity(detailed)).toBeGreaterThan(scoreOpportunity(brief));
    });
  });

  describe('getRecommendation()', () => {
    it('should approve high scores', () => {
      expect(getRecommendation(8)).toBe('approve');
      expect(getRecommendation(7)).toBe('approve');
    });

    it('should review medium scores', () => {
      expect(getRecommendation(6)).toBe('review');
      expect(getRecommendation(5)).toBe('review');
    });

    it('should skip low scores', () => {
      expect(getRecommendation(4)).toBe('skip');
      expect(getRecommendation(2)).toBe('skip');
    });

    it('should respect custom criteria', () => {
      expect(getRecommendation(6, { approveThreshold: 6 })).toBe('approve');
    });
  });

  describe('evaluateOpportunity()', () => {
    it('should return evaluated opportunity with all fields', () => {
      const evaluated = evaluateOpportunity(mockOpp);
      
      expect(evaluated.score).toBeGreaterThan(0);
      expect(evaluated.recommendation).toBeDefined();
      expect(evaluated.reasoning).toBeDefined();
      expect(evaluated.source).toBe(mockOpp.source);
    });
  });

  describe('evaluateOpportunities()', () => {
    it('should sort by score descending', () => {
      const opps = [
        { ...mockOpp, relevance: 5 },
        { ...mockOpp, relevance: 9 },
        { ...mockOpp, relevance: 7 }
      ];
      
      const evaluated = evaluateOpportunities(opps);
      
      expect(evaluated[0].relevance).toBe(9);
      expect(evaluated[2].relevance).toBe(5);
    });

    it('should filter by minimum score', () => {
      const opps = [
        { ...mockOpp, relevance: 2 },
        { ...mockOpp, relevance: 8 }
      ];
      
      const evaluated = evaluateOpportunities(opps, { minScore: 5 });
      
      expect(evaluated.length).toBe(1);
      expect(evaluated[0].relevance).toBe(8);
    });
  });

  describe('getApproved()', () => {
    it('should return only approved opportunities', () => {
      const evaluated = [
        evaluateOpportunity({ ...mockOpp, relevance: 9 }),
        evaluateOpportunity({ ...mockOpp, relevance: 3 }),
        evaluateOpportunity({ ...mockOpp, relevance: 8 })
      ];
      
      const approved = getApproved(evaluated);
      
      expect(approved.every(o => o.recommendation === 'approve')).toBe(true);
    });
  });
});
