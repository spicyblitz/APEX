/**
 * Opportunity Evaluator
 * 
 * Scores and filters opportunities.
 * Part of Scout agent.
 */

import { Opportunity } from './opportunity-writer';

export interface EvaluatedOpportunity extends Opportunity {
  score: number;
  recommendation: 'approve' | 'review' | 'skip';
  reasoning: string;
}

export interface EvaluationCriteria {
  minScore?: number;
  approveThreshold?: number;
  reviewThreshold?: number;
}

const DEFAULT_CRITERIA: EvaluationCriteria = {
  minScore: 0,
  approveThreshold: 7,
  reviewThreshold: 5
};

/**
 * Calculate comprehensive score
 */
export function scoreOpportunity(opp: Opportunity): number {
  // Base score from relevance
  let score = opp.relevance;
  
  // Effort multiplier
  const effortMultiplier = { S: 1.2, M: 1.0, L: 0.8 };
  score *= effortMultiplier[opp.effort];
  
  // Bonus for clear pain point
  if (opp.painPoint.length > 50) score += 0.5;
  
  // Bonus for actionable opportunity
  if (opp.opportunity.length > 50) score += 0.5;
  
  return Math.round(score * 10) / 10;
}

/**
 * Generate recommendation based on score
 */
export function getRecommendation(
  score: number, 
  criteria: EvaluationCriteria = DEFAULT_CRITERIA
): 'approve' | 'review' | 'skip' {
  const { approveThreshold = 7, reviewThreshold = 5 } = criteria;
  
  if (score >= approveThreshold) return 'approve';
  if (score >= reviewThreshold) return 'review';
  return 'skip';
}

/**
 * Generate reasoning for recommendation
 */
export function generateReasoning(opp: Opportunity, score: number): string {
  const reasons: string[] = [];
  
  if (opp.relevance >= 8) {
    reasons.push('High relevance to portfolio');
  } else if (opp.relevance <= 4) {
    reasons.push('Low relevance');
  }
  
  if (opp.effort === 'S') {
    reasons.push('Quick win opportunity');
  } else if (opp.effort === 'L') {
    reasons.push('Significant effort required');
  }
  
  if (score >= 7) {
    reasons.push('Strong overall score');
  }
  
  return reasons.join('. ') || 'Standard opportunity';
}

/**
 * Evaluate a single opportunity
 */
export function evaluateOpportunity(
  opp: Opportunity,
  criteria: EvaluationCriteria = DEFAULT_CRITERIA
): EvaluatedOpportunity {
  const score = scoreOpportunity(opp);
  const recommendation = getRecommendation(score, criteria);
  const reasoning = generateReasoning(opp, score);
  
  return {
    ...opp,
    score,
    recommendation,
    reasoning
  };
}

/**
 * Evaluate and filter opportunities
 */
export function evaluateOpportunities(
  opportunities: Opportunity[],
  criteria: EvaluationCriteria = DEFAULT_CRITERIA
): EvaluatedOpportunity[] {
  const { minScore = 0 } = criteria;
  
  return opportunities
    .map(opp => evaluateOpportunity(opp, criteria))
    .filter(opp => opp.score >= minScore)
    .sort((a, b) => b.score - a.score);
}

/**
 * Get approved opportunities
 */
export function getApproved(
  opportunities: EvaluatedOpportunity[]
): EvaluatedOpportunity[] {
  return opportunities.filter(o => o.recommendation === 'approve');
}
