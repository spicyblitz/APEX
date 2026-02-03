/**
 * Trigger Monitor
 * 
 * Monitors project status files for trigger conditions.
 * Part of cross-learning system.
 */

import * as fs from 'fs/promises';

export interface TriggerCondition {
  name: string;
  field: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'exists';
  value: string | number | boolean;
}

export interface Trigger {
  name: string;
  condition: TriggerCondition;
  action: string;
  enabled: boolean;
}

export interface TriggerResult {
  trigger: Trigger;
  fired: boolean;
  timestamp: string;
  data?: Record<string, unknown>;
}

export interface MonitorResult {
  success: boolean;
  results: TriggerResult[];
  error?: string;
}

/**
 * Check if condition is met
 */
export function checkCondition(
  condition: TriggerCondition,
  data: Record<string, unknown>
): boolean {
  const value = data[condition.field];
  
  switch (condition.operator) {
    case 'equals':
      return value === condition.value;
    case 'contains':
      return String(value).includes(String(condition.value));
    case 'greater_than':
      return Number(value) > Number(condition.value);
    case 'exists':
      return value !== undefined && value !== null;
    default:
      return false;
  }
}

/**
 * Parse status file content
 */
export function parseStatusFile(content: string): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  
  // Parse YAML-like frontmatter
  const lines = content.split('\n');
  for (const line of lines) {
    const match = line.match(/^(\w+):\s*(.+)$/);
    if (match) {
      const [, key, value] = match;
      // Try to parse as number or boolean
      if (value === 'true') data[key] = true;
      else if (value === 'false') data[key] = false;
      else if (!isNaN(Number(value))) data[key] = Number(value);
      else data[key] = value;
    }
  }
  
  return data;
}

/**
 * Check triggers against status data
 */
export function checkTriggers(
  triggers: Trigger[],
  data: Record<string, unknown>
): TriggerResult[] {
  const results: TriggerResult[] = [];
  
  for (const trigger of triggers) {
    if (!trigger.enabled) continue;
    
    const fired = checkCondition(trigger.condition, data);
    results.push({
      trigger,
      fired,
      timestamp: new Date().toISOString(),
      data: fired ? data : undefined
    });
  }
  
  return results;
}

/**
 * Monitor a status file for triggers
 */
export async function monitorStatusFile(
  filePath: string,
  triggers: Trigger[]
): Promise<MonitorResult> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const data = parseStatusFile(content);
    const results = checkTriggers(triggers, data);
    
    return {
      success: true,
      results
    };
  } catch (error) {
    return {
      success: false,
      results: [],
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
