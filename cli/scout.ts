#!/usr/bin/env node
/**
 * /scout CLI - Parallel web search for opportunities
 * 
 * Usage:
 *   npx apex-scout <query>
 */

import { parallelSearch, SearchOptions, SearchSource, SearchResult } from '../scout/parallel-search.js';
import { evaluateOpportunity, Opportunity } from '../scout/evaluator.js';
import * as fs from 'fs';
import * as path from 'path';

const VAULT_PATH = process.env.APEX_VAULT_PATH || './vault/opportunities';

// Mock search for demonstration
const mockSearch = async (query: string): Promise<SearchResult> => ({
  source: 'mock',
  items: [
    { title: `Result for: ${query}`, url: `https://example.com/search?q=${encodeURIComponent(query)}`, score: 75 }
  ],
  total: 1
});

async function main() {
  const args = process.argv.slice(2);
  
  const query = args.filter(a => !a.startsWith('--')).join(' ');
  
  if (!query) {
    console.log('Usage: apex-scout <query>');
    console.log('');
    console.log('Examples:');
    console.log('  apex-scout AI automation agency');
    console.log('  apex-scout solo founder tools');
    return;
  }
  
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('                    /scout - Opportunity Search');
  console.log('═══════════════════════════════════════════════════════════════════\n');
  console.log(`Query: ${query}\n`);
  console.log('Searching...\n');
  
  try {
    // Define sources with search implementations
    const sources: SearchSource[] = [
      { name: 'reddit', search: mockSearch },
      { name: 'hn', search: mockSearch },
      { name: 'twitter', search: mockSearch }
    ];
    
    const options: SearchOptions = { query, sources };
    const results = await parallelSearch(options);
    
    if (!results.success) {
      console.log('Search failed:');
      results.errors.forEach(e => console.log(`  - ${e}`));
      return;
    }
    
    console.log(`Found ${results.results.length} source results in ${results.duration_ms}ms\n`);
    
    for (const result of results.results) {
      console.log(`${result.source.toUpperCase()}:`);
      for (const item of result.items.slice(0, 3)) {
        console.log(`  • ${item.title}`);
        if (item.url) console.log(`    ${item.url}`);
      }
      console.log('');
    }
    
    // Evaluate results as opportunities
    console.log('───────────────────────────────────────────────────────────────────');
    console.log('                      EVALUATION');
    console.log('───────────────────────────────────────────────────────────────────\n');
    
    for (const result of results.results) {
      for (const item of result.items) {
        const opp: Opportunity = {
          id: `opp-${Date.now()}`,
          source: result.source,
          title: item.title,
          url: item.url || '',
          painPoint: 'To be analyzed',
          opportunity: query,
          relevance: 5,
          effort: 'M',
          status: 'raw'
        };
        
        const evaluation = evaluateOpportunity(opp);
        console.log(`${item.title}`);
        console.log(`  Score: ${evaluation.score}/100 → ${evaluation.recommendation}`);
        console.log('');
      }
    }
    
    // Save raw results
    const rawPath = path.join(VAULT_PATH, 'raw');
    if (!fs.existsSync(rawPath)) {
      fs.mkdirSync(rawPath, { recursive: true });
    }
    
    const filename = `${new Date().toISOString().split('T')[0]}-${query.replace(/\s+/g, '-').toLowerCase().slice(0, 30)}.json`;
    fs.writeFileSync(path.join(rawPath, filename), JSON.stringify(results, null, 2));
    console.log(`Saved to: ${rawPath}/${filename}`);
    
  } catch (error: any) {
    console.error('Scout failed:', error.message);
    process.exit(1);
  }
  
  console.log('\n═══════════════════════════════════════════════════════════════════');
}

main().catch(console.error);
