#!/usr/bin/env node
/**
 * /learn CLI - Learning Agent: detect patterns and generate skills
 * 
 * Usage:
 *   npx apex-learn [--path <memory-dir>] [--threshold 85]
 */

import { monitorAll } from '../learning-agent/monitor.js';
import { detectPatterns } from '../learning-agent/detector.js';
import { calculateConfidence, shouldAutoGenerate, needsHumanReview } from '../learning-agent/confidence.js';
import { generateSkill, writeSkill } from '../learning-agent/generator.js';
import * as fs from 'fs';

const DEFAULT_MEMORY_PATH = './memory';
const DEFAULT_OPS_PATH = './ops';
const DEFAULT_SKILLS_PATH = './vault/skills';

async function main() {
  const args = process.argv.slice(2);
  
  let memoryPath = DEFAULT_MEMORY_PATH;
  let opsPath = DEFAULT_OPS_PATH;
  let skillsPath = DEFAULT_SKILLS_PATH;
  let threshold = 85;
  let dryRun = args.includes('--dry-run');
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--path' && args[i + 1]) {
      memoryPath = args[i + 1];
      i++;
    } else if (args[i] === '--threshold' && args[i + 1]) {
      threshold = parseInt(args[i + 1], 10);
      i++;
    }
  }
  
  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('                    /learn - Pattern Detection');
  console.log('═══════════════════════════════════════════════════════════════════\n');
  console.log(`Memory Path: ${memoryPath}`);
  console.log(`Threshold:   ${threshold}%`);
  console.log(`Dry Run:     ${dryRun}\n`);
  
  // Check if paths exist
  if (!fs.existsSync(memoryPath) && !fs.existsSync(opsPath)) {
    console.log(`⚠️  No memory or ops path found.`);
    console.log('Create memory files first, then run /learn again.');
    return;
  }
  
  console.log('Scanning logs...\n');
  
  try {
    // Monitor logs
    const monitorResult = await monitorAll(memoryPath, opsPath);
    console.log(`Found ${monitorResult.entries.length} log entries\n`);
    
    if (monitorResult.entries.length === 0) {
      console.log('No entries found. Nothing to learn from.');
      return;
    }
    
    // Detect patterns
    const detectorResult = detectPatterns(monitorResult.entries);
    console.log(`Detected ${detectorResult.patterns.length} patterns\n`);
    
    if (detectorResult.patterns.length === 0) {
      console.log('No patterns detected yet. Need more data.');
      return;
    }
    
    console.log('───────────────────────────────────────────────────────────────────');
    console.log('                         PATTERNS FOUND');
    console.log('───────────────────────────────────────────────────────────────────\n');
    
    let generated = 0, review = 0, discarded = 0;
    
    for (const pattern of detectorResult.patterns) {
      const confidence = calculateConfidence(pattern);
      
      const icon = confidence.score >= threshold ? '✅' : 
                   confidence.score >= 70 ? '⚠️' : '❌';
      
      console.log(`${icon} ${pattern.name}`);
      console.log(`   Occurrences: ${pattern.occurrences}`);
      console.log(`   Confidence: ${confidence.score}%`);
      
      if (shouldAutoGenerate(confidence)) {
        console.log(`   → AUTO-GENERATE`);
        generated++;
        
        if (!dryRun) {
          if (!fs.existsSync(skillsPath)) {
            fs.mkdirSync(skillsPath, { recursive: true });
          }
          const skill = generateSkill(pattern, confidence);
          await writeSkill(skill, skillsPath);
          console.log(`   → Written to: ${skillsPath}/${skill.name}.md`);
        }
      } else if (needsHumanReview(confidence)) {
        console.log(`   → NEEDS REVIEW`);
        review++;
      } else {
        console.log(`   → DISCARDED`);
        discarded++;
      }
      console.log('');
    }
    
    console.log('───────────────────────────────────────────────────────────────────');
    console.log(`Generated: ${generated} | Review: ${review} | Discarded: ${discarded}`);
    if (dryRun) console.log('(Dry run - no files written)');
    
  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  }
  
  console.log('\n═══════════════════════════════════════════════════════════════════');
}

main().catch(console.error);
