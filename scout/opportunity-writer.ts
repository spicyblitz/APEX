/**
 * Opportunity Writer
 * 
 * Saves opportunities to vault/opportunities/raw/
 * Part of Scout agent.
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export interface Opportunity {
  id?: string;
  source: string;
  signal: string;
  painPoint: string;
  opportunity: string;
  relevance: number;  // 1-10
  effort: 'S' | 'M' | 'L';
  score?: number;
}

export interface WriteResult {
  success: boolean;
  path: string;
  id: string;
  error?: string;
}

/**
 * Generate opportunity ID
 */
export function generateId(): string {
  const date = new Date().toISOString().split('T')[0];
  const rand = Math.random().toString(36).slice(2, 6);
  return `opp-${date}-${rand}`;
}

/**
 * Generate slug from signal
 */
export function generateSlug(signal: string): string {
  return signal
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30);
}

/**
 * Calculate opportunity score
 */
export function calculateScore(opp: Opportunity): number {
  // Score = relevance * effort_multiplier
  const effortMultiplier = { S: 1.2, M: 1.0, L: 0.8 };
  return Math.round(opp.relevance * effortMultiplier[opp.effort] * 10) / 10;
}

/**
 * Format opportunity as YAML frontmatter + markdown
 */
export function formatOpportunity(opp: Opportunity): string {
  const id = opp.id || generateId();
  const score = opp.score || calculateScore(opp);
  const date = new Date().toISOString();

  return `---
id: ${id}
source: ${opp.source}
relevance: ${opp.relevance}
effort: ${opp.effort}
score: ${score}
created: ${date}
status: raw
---

# ${opp.signal}

## Signal

${opp.signal}

## Pain Point

${opp.painPoint}

## Opportunity

${opp.opportunity}

## Analysis

- **Relevance:** ${opp.relevance}/10
- **Effort:** ${opp.effort}
- **Score:** ${score}
`;
}

/**
 * Write opportunity to vault
 */
export async function writeOpportunity(
  opp: Opportunity,
  vaultPath: string = 'vault/opportunities/raw'
): Promise<WriteResult> {
  const id = opp.id || generateId();
  const slug = generateSlug(opp.signal);
  const date = new Date().toISOString().split('T')[0];
  const filename = `${date}-${slug}.md`;
  const filePath = path.join(vaultPath, filename);

  try {
    await fs.mkdir(vaultPath, { recursive: true });
    
    const content = formatOpportunity({ ...opp, id });
    await fs.writeFile(filePath, content, 'utf-8');

    return {
      success: true,
      path: filePath,
      id
    };
  } catch (error) {
    return {
      success: false,
      path: filePath,
      id,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
