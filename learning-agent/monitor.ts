/**
 * Log Monitor
 * 
 * Reads memory and ops files to extract patterns.
 * Part of Learning Agent.
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export interface LogEntry {
  timestamp: string;
  action: string;
  outcome: string;
  duration?: number;
  file: string;
}

export interface MonitorResult {
  success: boolean;
  entries: LogEntry[];
  error?: string;
}

/**
 * Parse RUNLOG.md format: [YYYY-MM-DD HH:MM EST] ACTION: Details
 */
export function parseRunlogLine(line: string, file: string): LogEntry | null {
  const match = line.match(/^\[(\d{4}-\d{2}-\d{2}\s+[\d:]+\s*\w*)\]\s*(.+)$/);
  if (!match) return null;
  
  const [, timestamp, rest] = match;
  
  // Try to extract action and outcome
  const colonIndex = rest.indexOf(':');
  if (colonIndex > 0) {
    return {
      timestamp,
      action: rest.slice(0, colonIndex).trim(),
      outcome: rest.slice(colonIndex + 1).trim(),
      file
    };
  }
  
  return {
    timestamp,
    action: rest.trim(),
    outcome: '',
    file
  };
}

/**
 * Parse daily log entries
 */
export function parseDailyLog(content: string, file: string): LogEntry[] {
  const entries: LogEntry[] = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    // Look for timestamped entries
    const entry = parseRunlogLine(line, file);
    if (entry) {
      entries.push(entry);
    }
  }
  
  return entries;
}

/**
 * Read and parse RUNLOG.md
 */
export async function readRunlog(
  runlogPath: string = 'ops/RUNLOG.md'
): Promise<MonitorResult> {
  try {
    const content = await fs.readFile(runlogPath, 'utf-8');
    const entries = parseDailyLog(content, runlogPath);
    
    return {
      success: true,
      entries
    };
  } catch (error) {
    return {
      success: false,
      entries: [],
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Read all memory files from a date range
 */
export async function readMemoryFiles(
  memoryPath: string = 'memory',
  daysBack: number = 7
): Promise<MonitorResult> {
  const entries: LogEntry[] = [];
  
  try {
    const files = await fs.readdir(memoryPath);
    const today = new Date();
    const cutoff = new Date(today.getTime() - daysBack * 24 * 60 * 60 * 1000);
    
    for (const file of files) {
      if (!file.match(/^\d{4}-\d{2}-\d{2}\.md$/)) continue;
      
      const dateStr = file.replace('.md', '');
      const fileDate = new Date(dateStr);
      
      if (fileDate >= cutoff) {
        const content = await fs.readFile(path.join(memoryPath, file), 'utf-8');
        entries.push(...parseDailyLog(content, file));
      }
    }
    
    return {
      success: true,
      entries: entries.sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    };
  } catch (error) {
    return {
      success: false,
      entries,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Extract all log entries from ops and memory
 */
export async function monitorAll(
  opsPath: string = 'ops',
  memoryPath: string = 'memory',
  daysBack: number = 7
): Promise<MonitorResult> {
  const [runlog, memory] = await Promise.all([
    readRunlog(path.join(opsPath, 'RUNLOG.md')),
    readMemoryFiles(memoryPath, daysBack)
  ]);
  
  const entries = [...runlog.entries, ...memory.entries]
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  
  return {
    success: runlog.success || memory.success,
    entries,
    error: [runlog.error, memory.error].filter(Boolean).join('; ') || undefined
  };
}
