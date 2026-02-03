/**
 * Drift Corrector
 * 
 * Updates workflows when better approaches are found.
 * Part of Learning Agent.
 */

import * as fs from 'fs/promises';
import { Pattern } from './detector';
import { ConfidenceResult } from './confidence';

export interface DriftCorrection {
  type: 'workflow' | 'config' | 'skill';
  target: string;
  before: string;
  after: string;
  reason: string;
  applied: boolean;
}

export interface CorrectionResult {
  success: boolean;
  corrections: DriftCorrection[];
  error?: string;
}

/**
 * Detect drift from expected patterns
 */
export function detectDrift(
  currentPatterns: Pattern[],
  expectedPatterns: string[]
): string[] {
  const currentActions = new Set(currentPatterns.map(p => p.action));
  return expectedPatterns.filter(e => !currentActions.has(e));
}

/**
 * Suggest correction for missing pattern
 */
export function suggestCorrection(
  missingPattern: string,
  availablePatterns: Pattern[]
): DriftCorrection | null {
  // Find similar pattern that might replace it
  const similar = availablePatterns.find(p => 
    p.action.includes(missingPattern.split('_')[0]) ||
    missingPattern.includes(p.action.split('_')[0])
  );
  
  if (similar) {
    return {
      type: 'workflow',
      target: missingPattern,
      before: missingPattern,
      after: similar.action,
      reason: `Pattern ${missingPattern} not observed. ${similar.action} found ${similar.occurrences} times.`,
      applied: false
    };
  }
  
  return null;
}

/**
 * Apply correction to file
 */
export async function applyCorrection(
  correction: DriftCorrection,
  filePath: string
): Promise<boolean> {
  try {
    let content = await fs.readFile(filePath, 'utf-8');
    
    if (content.includes(correction.before)) {
      content = content.replace(
        new RegExp(correction.before, 'g'),
        correction.after
      );
      await fs.writeFile(filePath, content, 'utf-8');
      return true;
    }
    
    return false;
  } catch {
    return false;
  }
}

/**
 * Generate workflow improvement suggestion
 */
export function suggestWorkflowImprovement(
  pattern: Pattern,
  confidence: ConfidenceResult
): DriftCorrection | null {
  if (confidence.score < 85) return null;
  
  return {
    type: 'workflow',
    target: `workflow-${pattern.name}`,
    before: 'manual process',
    after: `automated ${pattern.name} pattern`,
    reason: `Pattern ${pattern.name} observed ${pattern.occurrences} times with ${confidence.score}% confidence. Consider automating.`,
    applied: false
  };
}

/**
 * Auto-correct drift when confidence is high
 */
export async function autoCorrectDrift(
  patterns: Pattern[],
  expectedWorkflow: string[],
  confidence: number
): Promise<CorrectionResult> {
  const corrections: DriftCorrection[] = [];
  
  // Only auto-correct at high confidence
  if (confidence < 85) {
    return {
      success: true,
      corrections: []
    };
  }
  
  // Detect missing patterns
  const missing = detectDrift(patterns, expectedWorkflow);
  
  for (const m of missing) {
    const correction = suggestCorrection(m, patterns);
    if (correction) {
      corrections.push(correction);
    }
  }
  
  return {
    success: true,
    corrections
  };
}

