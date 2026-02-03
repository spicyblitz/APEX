#!/usr/bin/env node
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const script = join(__dirname, '..', 'cli', 'trigger.ts');

spawn('npx', ['tsx', script, ...process.argv.slice(2)], { 
  stdio: 'inherit',
  cwd: process.cwd()
});
