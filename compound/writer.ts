/**
 * Solution Writer
 * 
 * Creates solution documents in vault/solutions/
 * Part of /compound command.
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export interface Solution {
  slug: string;
  category: string;
  symptom: string;
  investigation: string;
  rootCause: string;
  solution: string;
  prevention: string;
  timeSaved?: string;
}

export interface WriteResult {
  success: boolean;
  path: string;
  error?: string;
}

const CATEGORIES = [
  'build-errors',
  'test-failures', 
  'runtime-errors',
  'config-issues',
  'performance-issues',
  'security-issues',
  'integration-issues',
  'database-issues'
];

/**
 * Validate category
 */
export function isValidCategory(category: string): boolean {
  return CATEGORIES.includes(category);
}

/**
 * Generate slug from text
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

/**
 * Format solution as markdown
 */
export function formatSolution(solution: Solution): string {
  const date = new Date().toISOString().split('T')[0];
  
  return `# Solution: ${solution.slug}

**Category:** ${solution.category}
**Date:** ${date}
**Time Saved:** ${solution.timeSaved || 'TBD'}

---

## Symptom

${solution.symptom}

---

## Investigation

${solution.investigation}

---

## Root Cause

${solution.rootCause}

---

## Solution

${solution.solution}

---

## Prevention

${solution.prevention}
`;
}

/**
 * Write solution to vault/solutions/
 */
export async function writeSolution(
  solution: Solution,
  vaultPath: string = 'vault/solutions'
): Promise<WriteResult> {
  if (!isValidCategory(solution.category)) {
    return {
      success: false,
      path: '',
      error: `Invalid category: ${solution.category}. Valid: ${CATEGORIES.join(', ')}`
    };
  }

  const categoryDir = path.join(vaultPath, solution.category);
  const filePath = path.join(categoryDir, `${solution.slug}.md`);

  try {
    // Ensure directory exists
    await fs.mkdir(categoryDir, { recursive: true });
    
    // Write solution
    const content = formatSolution(solution);
    await fs.writeFile(filePath, content, 'utf-8');
    
    return {
      success: true,
      path: filePath
    };
  } catch (error) {
    return {
      success: false,
      path: filePath,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * List all solutions in a category
 */
export async function listSolutions(
  category: string,
  vaultPath: string = 'vault/solutions'
): Promise<string[]> {
  const categoryDir = path.join(vaultPath, category);
  
  try {
    const files = await fs.readdir(categoryDir);
    return files.filter(f => f.endsWith('.md')).map(f => f.replace('.md', ''));
  } catch {
    return [];
  }
}
