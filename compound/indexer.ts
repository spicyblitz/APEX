/**
 * Solution Indexer
 * 
 * Makes solutions searchable via memory_search.
 * Part of /compound command.
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export interface SolutionIndex {
  slug: string;
  category: string;
  path: string;
  symptom: string;
  keywords: string[];
}

export interface IndexResult {
  success: boolean;
  indexed: number;
  error?: string;
}

/**
 * Extract keywords from text
 */
export function extractKeywords(text: string): string[] {
  const words = text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3);
  
  return [...new Set(words)];
}

/**
 * Parse solution file to extract metadata
 */
export async function parseSolutionFile(filePath: string): Promise<SolutionIndex | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Extract slug from filename
    const slug = path.basename(filePath, '.md');
    
    // Extract category from path
    const category = path.basename(path.dirname(filePath));
    
    // Extract symptom section
    const symptomMatch = content.match(/## Symptom\s*\n\n([\s\S]*?)(?=\n---|\n##|$)/);
    const symptom = symptomMatch ? symptomMatch[1].trim() : '';
    
    // Extract keywords from all content
    const keywords = extractKeywords(content);
    
    return {
      slug,
      category,
      path: filePath,
      symptom,
      keywords
    };
  } catch {
    return null;
  }
}

/**
 * Index all solutions in vault
 */
export async function indexSolutions(
  vaultPath: string = 'vault/solutions'
): Promise<{ index: SolutionIndex[]; result: IndexResult }> {
  const index: SolutionIndex[] = [];
  
  try {
    const categories = await fs.readdir(vaultPath);
    
    for (const category of categories) {
      const categoryPath = path.join(vaultPath, category);
      const stats = await fs.stat(categoryPath);
      
      if (!stats.isDirectory()) continue;
      
      const files = await fs.readdir(categoryPath);
      
      for (const file of files) {
        if (!file.endsWith('.md')) continue;
        
        const filePath = path.join(categoryPath, file);
        const parsed = await parseSolutionFile(filePath);
        
        if (parsed) {
          index.push(parsed);
        }
      }
    }
    
    return {
      index,
      result: { success: true, indexed: index.length }
    };
  } catch (error) {
    return {
      index,
      result: {
        success: false,
        indexed: index.length,
        error: error instanceof Error ? error.message : String(error)
      }
    };
  }
}

/**
 * Search solutions by keyword
 */
export function searchSolutions(
  index: SolutionIndex[],
  query: string
): SolutionIndex[] {
  const queryKeywords = extractKeywords(query);
  
  return index
    .map(solution => {
      const matchCount = queryKeywords.filter(kw => 
        solution.keywords.includes(kw) || 
        solution.symptom.toLowerCase().includes(kw)
      ).length;
      
      return { solution, matchCount };
    })
    .filter(({ matchCount }) => matchCount > 0)
    .sort((a, b) => b.matchCount - a.matchCount)
    .map(({ solution }) => solution);
}
