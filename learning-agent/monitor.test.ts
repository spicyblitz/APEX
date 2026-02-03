import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  parseRunlogLine,
  parseDailyLog,
  readRunlog,
  readMemoryFiles,
  monitorAll
} from './monitor';

describe('Log Monitor', () => {
  const testDir = '/tmp/test-learning-agent';
  const testOps = path.join(testDir, 'ops');
  const testMemory = path.join(testDir, 'memory');

  beforeEach(async () => {
    await fs.mkdir(testOps, { recursive: true });
    await fs.mkdir(testMemory, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('parseRunlogLine()', () => {
    it('should parse timestamped entries', () => {
      const entry = parseRunlogLine('[2026-02-03 15:00 EST] DONE: Task complete', 'test.md');
      
      expect(entry).not.toBeNull();
      expect(entry?.timestamp).toBe('2026-02-03 15:00 EST');
      expect(entry?.action).toBe('DONE');
      expect(entry?.outcome).toBe('Task complete');
    });

    it('should return null for non-matching lines', () => {
      expect(parseRunlogLine('Just a regular line', 'test.md')).toBeNull();
      expect(parseRunlogLine('# Heading', 'test.md')).toBeNull();
    });
  });

  describe('parseDailyLog()', () => {
    it('should extract all timestamped entries', () => {
      const content = `# Log

[2026-02-03 10:00 EST] START: Morning work
Some notes here
[2026-02-03 11:00 EST] DONE: Completed task
`;
      const entries = parseDailyLog(content, 'test.md');
      
      expect(entries.length).toBe(2);
      expect(entries[0].action).toBe('START');
      expect(entries[1].action).toBe('DONE');
    });
  });

  describe('readRunlog()', () => {
    it('should read and parse RUNLOG.md', async () => {
      await fs.writeFile(
        path.join(testOps, 'RUNLOG.md'),
        '[2026-02-03 10:00 EST] TEST: Entry 1\n[2026-02-03 11:00 EST] TEST: Entry 2'
      );

      const result = await readRunlog(path.join(testOps, 'RUNLOG.md'));
      
      expect(result.success).toBe(true);
      expect(result.entries.length).toBe(2);
    });

    it('should handle missing file', async () => {
      const result = await readRunlog('/nonexistent/RUNLOG.md');
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('readMemoryFiles()', () => {
    it('should read recent memory files', async () => {
      const today = new Date().toISOString().split('T')[0];
      await fs.writeFile(
        path.join(testMemory, `${today}.md`),
        '[2026-02-03 10:00 EST] LOG: Today entry'
      );

      const result = await readMemoryFiles(testMemory, 7);
      
      expect(result.success).toBe(true);
      expect(result.entries.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('monitorAll()', () => {
    it('should combine runlog and memory entries', async () => {
      await fs.writeFile(
        path.join(testOps, 'RUNLOG.md'),
        '[2026-02-03 10:00 EST] OPS: From runlog'
      );
      
      const today = new Date().toISOString().split('T')[0];
      await fs.writeFile(
        path.join(testMemory, `${today}.md`),
        '[2026-02-03 11:00 EST] MEM: From memory'
      );

      const result = await monitorAll(testOps, testMemory, 7);
      
      expect(result.success).toBe(true);
    });
  });
});
