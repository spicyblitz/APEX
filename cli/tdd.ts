#!/usr/bin/env node
/**
 * /tdd CLI - Enforce test-first development
 * 
 * Usage:
 *   npx apex-tdd <source-file>
 *   npx apex-tdd --check
 * 
 * Enforces RED → GREEN → REFACTOR cycle
 */

import * as fs from 'fs';
import * as path from 'path';
import { exec as execCallback } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(execCallback);

interface TDDState {
  phase: 'red' | 'green' | 'refactor';
  sourceFile: string;
  testFile: string;
  lastTestRun: string;
  testsPassing: boolean;
}

const STATE_FILE = '.forge/tdd-state.json';

function findTestFile(sourceFile: string): string {
  const dir = path.dirname(sourceFile);
  const base = path.basename(sourceFile, path.extname(sourceFile));
  const ext = path.extname(sourceFile);
  
  // Common test file patterns
  const patterns = [
    path.join(dir, `${base}.test${ext}`),
    path.join(dir, `${base}.spec${ext}`),
    path.join(dir, '__tests__', `${base}${ext}`),
    path.join(dir, '__tests__', `${base}.test${ext}`),
  ];
  
  for (const pattern of patterns) {
    if (fs.existsSync(pattern)) {
      return pattern;
    }
  }
  
  // Default: .test.ts in same directory
  return path.join(dir, `${base}.test${ext}`);
}

async function runTests(): Promise<{ passing: boolean; output: string }> {
  try {
    const { stdout, stderr } = await execAsync('npm test 2>&1', { maxBuffer: 10 * 1024 * 1024 });
    const output = stdout + stderr;
    const passing = !output.includes('FAIL') && (output.includes('passing') || output.includes('passed'));
    return { passing, output };
  } catch (error: any) {
    return { passing: false, output: error.stdout || error.message };
  }
}

function loadState(): TDDState | null {
  if (fs.existsSync(STATE_FILE)) {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
  }
  return null;
}

function saveState(state: TDDState): void {
  const dir = path.dirname(STATE_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

async function main() {
  const args = process.argv.slice(2);
  
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('                    /tdd - Test-First Development');
  console.log('═══════════════════════════════════════════════════════════════════\n');
  
  // Check mode
  if (args.includes('--check')) {
    const state = loadState();
    if (!state) {
      console.log('No TDD session active.');
      console.log('Start one with: /tdd <source-file>');
      return;
    }
    
    console.log(`Current TDD Session:`);
    console.log(`  Source: ${state.sourceFile}`);
    console.log(`  Test:   ${state.testFile}`);
    console.log(`  Phase:  ${state.phase.toUpperCase()}`);
    console.log(`  Tests:  ${state.testsPassing ? '✅ Passing' : '❌ Failing'}`);
    return;
  }
  
  // Start or continue TDD session
  let sourceFile = args[0];
  let state = loadState();
  
  if (!sourceFile && !state) {
    console.log('Usage: /tdd <source-file>');
    console.log('       /tdd --check');
    return;
  }
  
  if (sourceFile) {
    // Starting new session
    const testFile = findTestFile(sourceFile);
    state = {
      phase: 'red',
      sourceFile,
      testFile,
      lastTestRun: new Date().toISOString(),
      testsPassing: false
    };
    saveState(state);
    
    console.log(`TDD Session Started`);
    console.log(`  Source: ${sourceFile}`);
    console.log(`  Test:   ${testFile}`);
    console.log('');
  }
  
  if (!state) {
    console.log('No TDD session. Start with: /tdd <source-file>');
    return;
  }
  
  // Check test file exists
  if (!fs.existsSync(state.testFile)) {
    console.log(`⚠️  Test file does not exist: ${state.testFile}`);
    console.log('');
    console.log('TDD Rule: Write the test FIRST!');
    console.log('');
    console.log('Create the test file with a failing test, then run /tdd again.');
    return;
  }
  
  // Run tests
  console.log('Running tests...\n');
  const { passing, output } = await runTests();
  
  state.testsPassing = passing;
  state.lastTestRun = new Date().toISOString();
  
  // Determine phase transition
  if (state.phase === 'red') {
    if (!passing) {
      console.log('🔴 RED Phase - Test failing (good!)');
      console.log('');
      console.log('Now write the minimal code to make it pass.');
      console.log(`Edit: ${state.sourceFile}`);
      console.log('');
      console.log('When ready, run /tdd again to check.');
      state.phase = 'green';
    } else {
      console.log('⚠️  Test is already passing!');
      console.log('');
      console.log('TDD Rule: Start with a FAILING test.');
      console.log('Either:');
      console.log('  1. Add a new failing test case');
      console.log('  2. Delete the implementation and start fresh');
    }
  } else if (state.phase === 'green') {
    if (passing) {
      console.log('🟢 GREEN Phase - Test passing!');
      console.log('');
      console.log('Now you can refactor (optional).');
      console.log('Keep tests passing while improving code quality.');
      console.log('');
      console.log('When done, run /tdd again or start new cycle with /tdd <file>');
      state.phase = 'refactor';
    } else {
      console.log('❌ Tests still failing.');
      console.log('');
      console.log('Keep working on the implementation:');
      console.log(`Edit: ${state.sourceFile}`);
      console.log('');
      console.log('Run /tdd again when ready.');
    }
  } else if (state.phase === 'refactor') {
    if (passing) {
      console.log('🔄 REFACTOR Phase - Tests still passing!');
      console.log('');
      console.log('Good refactoring keeps tests green.');
      console.log('');
      console.log('Ready for next cycle? Run: /tdd <new-source-file>');
      console.log('Or continue refactoring and run /tdd to verify.');
    } else {
      console.log('❌ Refactoring broke tests!');
      console.log('');
      console.log('Undo your changes and try again.');
      console.log('Refactoring should NOT change behavior.');
      state.phase = 'green';
    }
  }
  
  saveState(state);
  
  console.log('');
  console.log('───────────────────────────────────────────────────────────────────');
  console.log(`Phase: ${state.phase.toUpperCase()} | Tests: ${passing ? '✅ PASS' : '❌ FAIL'}`);
  console.log('═══════════════════════════════════════════════════════════════════');
}

main().catch(console.error);
