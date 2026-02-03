/**
 * Pattern Validated Trigger
 * 
 * Fires when Learning Agent validates a pattern at ≥85% confidence.
 * Part of cross-learning system.
 */

import { ConfidenceResult } from '../learning-agent/confidence';
import { Pattern } from '../learning-agent/detector';

export interface PatternValidatedEvent {
  pattern: Pattern;
  confidence: ConfidenceResult;
  timestamp: string;
  action: 'auto_generate' | 'human_review' | 'discard';
}

export interface NotificationTarget {
  type: 'project' | 'channel' | 'file';
  target: string;
}

/**
 * Determine action based on confidence
 */
export function determineAction(confidence: ConfidenceResult): 'auto_generate' | 'human_review' | 'discard' {
  if (confidence.score >= 85) return 'auto_generate';
  if (confidence.score >= 70) return 'human_review';
  return 'discard';
}

/**
 * Create pattern validated event
 */
export function createEvent(
  pattern: Pattern,
  confidence: ConfidenceResult
): PatternValidatedEvent {
  return {
    pattern,
    confidence,
    timestamp: new Date().toISOString(),
    action: determineAction(confidence)
  };
}

/**
 * Check if event should trigger notification
 */
export function shouldNotify(event: PatternValidatedEvent): boolean {
  return event.action !== 'discard';
}

/**
 * Format notification message
 */
export function formatNotification(event: PatternValidatedEvent): string {
  const emoji = event.action === 'auto_generate' ? '🎯' : '👀';
  
  return `${emoji} **Pattern Validated**

**Pattern:** ${event.pattern.name}
**Action:** ${event.pattern.action}
**Occurrences:** ${event.pattern.occurrences}
**Confidence:** ${event.confidence.score}%

**Decision:** ${event.action.replace('_', ' ')}
`;
}

/**
 * Get notification targets based on action
 */
export function getNotificationTargets(event: PatternValidatedEvent): NotificationTarget[] {
  const targets: NotificationTarget[] = [];
  
  // Always log to file
  targets.push({ type: 'file', target: 'vault/patterns/validated.md' });
  
  if (event.action === 'auto_generate') {
    // Notify all projects
    targets.push({ type: 'channel', target: '#patterns' });
  } else if (event.action === 'human_review') {
    // Notify Griffin
    targets.push({ type: 'channel', target: '#gloria-main' });
  }
  
  return targets;
}
