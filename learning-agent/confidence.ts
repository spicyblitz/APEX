/**
 * Confidence Calculator
 * 
 * Calculates confidence score for patterns.
 * Part of Learning Agent.
 */

import { Pattern } from './detector';

export interface ConfidenceResult {
  score: number;  // 0-100
  level: 'low' | 'medium' | 'high';
  factors: ConfidenceFactor[];
}

export interface ConfidenceFactor {
  name: string;
  value: number;
  weight: number;
  contribution: number;
}

/**
 * Calculate sample size factor (more occurrences = higher confidence)
 */
export function sampleSizeFactor(occurrences: number): number {
  // Logarithmic scaling: 3 occ = ~48%, 10 occ = ~67%, 100 occ = ~100%
  return Math.min(1, Math.log10(occurrences + 1) / 2);
}

/**
 * Calculate recency factor (recent patterns = higher confidence)
 */
export function recencyFactor(lastSeen: string): number {
  const lastDate = new Date(lastSeen);
  const now = new Date();
  const daysAgo = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
  
  // Decay: 0 days = 1.0, 7 days = 0.5, 30 days = ~0.1
  return Math.max(0, 1 - (daysAgo / 30));
}

/**
 * Calculate consistency factor (similar outcomes = higher confidence)
 */
export function consistencyFactor(examples: string[]): number {
  if (examples.length < 2) return 0.5;
  
  // Check if examples share common words
  const wordSets = examples.map(e => 
    new Set(e.toLowerCase().split(/\s+/).filter(w => w.length > 3))
  );
  
  let commonCount = 0;
  const firstSet = wordSets[0];
  
  for (const word of firstSet) {
    if (wordSets.every(set => set.has(word))) {
      commonCount++;
    }
  }
  
  return Math.min(1, commonCount / Math.max(1, firstSet.size));
}

/**
 * Calculate overall confidence score
 */
export function calculateConfidence(pattern: Pattern): ConfidenceResult {
  const factors: ConfidenceFactor[] = [
    {
      name: 'sample_size',
      value: pattern.occurrences,
      weight: 0.5,
      contribution: sampleSizeFactor(pattern.occurrences) * 0.5
    },
    {
      name: 'recency',
      value: 0,  // Will be replaced with days
      weight: 0.3,
      contribution: recencyFactor(pattern.lastSeen) * 0.3
    },
    {
      name: 'consistency',
      value: pattern.examples.length,
      weight: 0.2,
      contribution: consistencyFactor(pattern.examples) * 0.2
    }
  ];
  
  const score = Math.round(
    factors.reduce((sum, f) => sum + f.contribution, 0) * 100
  );
  
  let level: 'low' | 'medium' | 'high';
  if (score >= 85) level = 'high';
  else if (score >= 70) level = 'medium';
  else level = 'low';
  
  return { score, level, factors };
}

/**
 * Check if pattern should auto-generate skill
 */
export function shouldAutoGenerate(confidence: ConfidenceResult): boolean {
  return confidence.score >= 85;
}

/**
 * Check if pattern needs human review
 */
export function needsHumanReview(confidence: ConfidenceResult): boolean {
  return confidence.score >= 70 && confidence.score < 85;
}

/**
 * Check if pattern should be discarded
 */
export function shouldDiscard(confidence: ConfidenceResult): boolean {
  return confidence.score < 70;
}
