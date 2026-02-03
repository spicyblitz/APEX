#!/usr/bin/env node
/**
 * /compound CLI - Document solved problems
 * 
 * Usage:
 *   npx apex-compound --category build-errors --slug webpack-esm-fix
 */

import { writeSolution, Solution, WriteResult } from '../compound/writer.js';
import { indexSolutions } from '../compound/indexer.js';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const VAULT_PATH = process.env.APEX_VAULT_PATH || './vault/solutions';

async function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  
  // Parse arguments
  let category = '';
  let slug = '';
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--category' && args[i + 1]) {
      category = args[i + 1];
      i++;
    } else if (args[i] === '--slug' && args[i + 1]) {
      slug = args[i + 1];
      i++;
    }
  }
  
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('                    /compound - Document Solution');
  console.log('═══════════════════════════════════════════════════════════════════\n');
  
  // Gather input
  if (!category) {
    console.log('Categories: build-errors, test-failures, runtime-errors, performance-issues,');
    console.log('            database-issues, security-issues, integration-issues, config-issues\n');
    category = await prompt('Category: ');
  }
  
  if (!slug) {
    slug = await prompt('Slug (e.g., webpack-esm-fix): ');
  }
  
  const symptom = await prompt('Symptom (what went wrong): ');
  const investigation = await prompt('Investigation (what you tried): ');
  const rootCause = await prompt('Root cause (why it happened): ');
  const solution = await prompt('Solution (how to fix): ');
  const prevention = await prompt('Prevention (how to avoid): ');
  
  const input: Solution = {
    slug,
    category,
    symptom,
    investigation,
    rootCause,
    solution,
    prevention
  };
  
  // Ensure vault directory exists
  const categoryPath = path.join(VAULT_PATH, category);
  if (!fs.existsSync(categoryPath)) {
    fs.mkdirSync(categoryPath, { recursive: true });
  }
  
  // Write solution
  const result: WriteResult = await writeSolution(input, VAULT_PATH);
  
  if (result.success) {
    console.log(`\n✅ Solution written to: ${result.path}`);
    
    // Index for search
    await indexSolutions(VAULT_PATH);
    console.log('✅ Solutions indexed for search');
  } else {
    console.error(`\n❌ Failed to write solution: ${result.error}`);
    process.exit(1);
  }
  
  console.log('\n═══════════════════════════════════════════════════════════════════');
}

main().catch(console.error);
