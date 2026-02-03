#!/usr/bin/env node
/**
 * /trigger CLI - Cross-project trigger management
 */

import { checkTriggers, Trigger, TriggerCondition } from '../triggers/monitor.js';
import * as fs from 'fs';

const DEFAULT_TRIGGERS: Trigger[] = [
  {
    name: 'pattern-validated',
    condition: { name: 'confidence-check', field: 'confidence', operator: 'greater_than', value: 85 },
    action: 'Generate skill',
    enabled: true
  },
  {
    name: 'build-complete',
    condition: { name: 'status-check', field: 'status', operator: 'equals', value: 'complete' },
    action: 'Run /verify',
    enabled: true
  }
];

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'list';
  
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('                    /trigger - Cross-Project Triggers');
  console.log('═══════════════════════════════════════════════════════════════════\n');
  
  switch (command) {
    case 'list':
      console.log('Configured Triggers:\n');
      for (const t of DEFAULT_TRIGGERS) {
        const icon = t.enabled ? '✅' : '⏸️';
        console.log(`${icon} ${t.name}`);
        console.log(`   Condition: ${t.condition.field} ${t.condition.operator} ${t.condition.value}`);
        console.log(`   Action: ${t.action}`);
        console.log('');
      }
      break;
      
    case 'check':
      const statusFile = args[1];
      if (!statusFile || !fs.existsSync(statusFile)) {
        console.log('Usage: apex-trigger check <status-file>');
        return;
      }
      
      const content = fs.readFileSync(statusFile, 'utf-8');
      let status: Record<string, unknown>;
      try {
        status = JSON.parse(content);
      } catch {
        console.log('Could not parse status file');
        return;
      }
      
      console.log(`Checking triggers against: ${statusFile}\n`);
      const results = checkTriggers(DEFAULT_TRIGGERS, status);
      
      for (const result of results) {
        const icon = result.fired ? '🔥' : '⏸️';
        console.log(`${icon} ${result.trigger}: ${result.fired ? 'FIRED' : 'not triggered'}`);
      }
      break;
      
    default:
      console.log('Commands: list, check <file>');
  }
  
  console.log('\n═══════════════════════════════════════════════════════════════════');
}

main().catch(console.error);
