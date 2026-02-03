#!/usr/bin/env node
/**
 * /scout CLI - Parallel web search for opportunities
 */

import { parallelSearch, SearchResult, SearchItem } from '../scout/parallel-search.js';
import { evaluateOpportunity } from '../scout/evaluator.js';
import { Opportunity } from '../scout/opportunity-writer.js';
import * as fs from 'fs';
import * as path from 'path';

const VAULT_PATH = process.env.APEX_VAULT_PATH || './vault/opportunities';

// Mock search for demonstration
const mockSearch = async (query: string): Promise<SearchResult> => ({
  source: 'mock',
  items: [
    { title: `Result for: ${query}`, url: `https://example.com/q=${encodeURIComponent(query)}`, snippet: 'Mock result', score: 75 }
  ]
});

async function main() {
  const args = process.argv.slice(2);
  const query = args.filter(a => !a.startsWith('--')).join(' ');
  
  if (!query) {
    console.log('Usage: apex-scout <query>');
    return;
  }
  
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('                    /scout - Opportunity Search');
  console.log('═══════════════════════════════════════════════════════════════════\n');
  console.log(`Query: ${query}\n`);
  
  try {
    const sources = [
      { name: 'reddit', search: mockSearch },
      { name: 'hn', search: mockSearch },
      { name: 'twitter', search: mockSearch }
    ];
    
    const results = await parallelSearch({ query, sources });
    
    if (!results.success) {
      console.log('Search failed:', results.errors.join(', '));
      return;
    }
    
    console.log(`Found ${results.results.length} sources in ${results.duration_ms}ms\n`);
    
    for (const result of results.results) {
      console.log(`${result.source.toUpperCase()}:`);
      for (const item of result.items.slice(0, 3)) {
        console.log(`  • ${item.title}`);
      }
      console.log('');
    }
    
    // Save results
    const rawPath = path.join(VAULT_PATH, 'raw');
    if (!fs.existsSync(rawPath)) fs.mkdirSync(rawPath, { recursive: true });
    
    const filename = `${new Date().toISOString().split('T')[0]}-${query.replace(/\s+/g, '-').slice(0, 20)}.json`;
    fs.writeFileSync(path.join(rawPath, filename), JSON.stringify(results, null, 2));
    console.log(`Saved: ${rawPath}/${filename}`);
    
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
  
  console.log('\n═══════════════════════════════════════════════════════════════════');
}

main().catch(console.error);
