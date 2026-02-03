/**
 * Pattern Detector
 * 
 * Identifies repeating sequences in log entries.
 * Part of Learning Agent.
 */

import { LogEntry } from './monitor';

export interface Pattern {
  name: string;
  action: string;
  occurrences: number;
  examples: string[];
  firstSeen: string;
  lastSeen: string;
}

export interface DetectorResult {
  patterns: Pattern[];
  total_entries: number;
  unique_actions: number;
}

/**
 * Normalize action for pattern matching
 */
export function normalizeAction(action: string): string {
  return action
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Group entries by action
 */
export function groupByAction(entries: LogEntry[]): Map<string, LogEntry[]> {
  const groups = new Map<string, LogEntry[]>();
  
  for (const entry of entries) {
    const key = normalizeAction(entry.action);
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(entry);
  }
  
  return groups;
}

/**
 * Detect patterns with minimum occurrences
 */
export function detectPatterns(
  entries: LogEntry[],
  minOccurrences: number = 3
): DetectorResult {
  const groups = groupByAction(entries);
  const patterns: Pattern[] = [];
  
  for (const [action, actionEntries] of groups) {
    if (actionEntries.length >= minOccurrences) {
      const sorted = actionEntries.sort((a, b) => 
        a.timestamp.localeCompare(b.timestamp)
      );
      
      patterns.push({
        name: action.toLowerCase().replace(/_/g, '-'),
        action,
        occurrences: actionEntries.length,
        examples: sorted.slice(0, 3).map(e => e.outcome),
        firstSeen: sorted[0].timestamp,
        lastSeen: sorted[sorted.length - 1].timestamp
      });
    }
  }
  
  return {
    patterns: patterns.sort((a, b) => b.occurrences - a.occurrences),
    total_entries: entries.length,
    unique_actions: groups.size
  };
}

/**
 * Find outcome patterns within an action
 */
export function findOutcomePatterns(
  entries: LogEntry[],
  minSimilarity: number = 0.7
): Map<string, string[]> {
  const outcomeGroups = new Map<string, string[]>();
  
  for (const entry of entries) {
    const words = entry.outcome.toLowerCase().split(/\s+/);
    const key = words.slice(0, 3).join(' '); // First 3 words as key
    
    if (!outcomeGroups.has(key)) {
      outcomeGroups.set(key, []);
    }
    outcomeGroups.get(key)!.push(entry.outcome);
  }
  
  return outcomeGroups;
}

/**
 * Check if pattern is significant
 */
export function isSignificantPattern(
  pattern: Pattern,
  totalEntries: number
): boolean {
  // Pattern should represent at least 5% of entries or have 5+ occurrences
  const percentageThreshold = totalEntries * 0.05;
  return pattern.occurrences >= 5 || pattern.occurrences >= percentageThreshold;
}

