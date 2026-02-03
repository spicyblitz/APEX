import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import {
  checkCondition,
  parseStatusFile,
  checkTriggers,
  monitorStatusFile,
  Trigger,
  TriggerCondition
} from './monitor';

describe('Trigger Monitor', () => {
  const testDir = '/tmp/test-triggers';

  beforeEach(async () => {
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  describe('checkCondition()', () => {
    it('should check equals condition', () => {
      const condition: TriggerCondition = { name: 'test', field: 'status', operator: 'equals', value: 'ready' };
      expect(checkCondition(condition, { status: 'ready' })).toBe(true);
      expect(checkCondition(condition, { status: 'pending' })).toBe(false);
    });

    it('should check contains condition', () => {
      const condition: TriggerCondition = { name: 'test', field: 'message', operator: 'contains', value: 'error' };
      expect(checkCondition(condition, { message: 'Build error occurred' })).toBe(true);
      expect(checkCondition(condition, { message: 'Build success' })).toBe(false);
    });

    it('should check greater_than condition', () => {
      const condition: TriggerCondition = { name: 'test', field: 'confidence', operator: 'greater_than', value: 85 };
      expect(checkCondition(condition, { confidence: 90 })).toBe(true);
      expect(checkCondition(condition, { confidence: 80 })).toBe(false);
    });

    it('should check exists condition', () => {
      const condition: TriggerCondition = { name: 'test', field: 'result', operator: 'exists', value: true };
      expect(checkCondition(condition, { result: 'anything' })).toBe(true);
      expect(checkCondition(condition, {})).toBe(false);
    });
  });

  describe('parseStatusFile()', () => {
    it('should parse key-value pairs', () => {
      const content = 'status: ready\ncount: 42\nenabled: true';
      const data = parseStatusFile(content);
      
      expect(data.status).toBe('ready');
      expect(data.count).toBe(42);
      expect(data.enabled).toBe(true);
    });
  });

  describe('checkTriggers()', () => {
    it('should return fired triggers', () => {
      const triggers: Trigger[] = [
        { name: 'ready-trigger', condition: { name: 'c', field: 'status', operator: 'equals', value: 'ready' }, action: 'notify', enabled: true },
        { name: 'high-score', condition: { name: 'c', field: 'score', operator: 'greater_than', value: 90 }, action: 'alert', enabled: true }
      ];
      
      const results = checkTriggers(triggers, { status: 'ready', score: 95 });
      
      expect(results.filter(r => r.fired).length).toBe(2);
    });

    it('should skip disabled triggers', () => {
      const triggers: Trigger[] = [
        { name: 'disabled', condition: { name: 'c', field: 'status', operator: 'equals', value: 'ready' }, action: 'notify', enabled: false }
      ];
      
      const results = checkTriggers(triggers, { status: 'ready' });
      expect(results.length).toBe(0);
    });
  });

  describe('monitorStatusFile()', () => {
    it('should monitor file and check triggers', async () => {
      await fs.writeFile(`${testDir}/status.md`, 'status: ready\nconfidence: 90');
      
      const triggers: Trigger[] = [
        { name: 'ready', condition: { name: 'c', field: 'status', operator: 'equals', value: 'ready' }, action: 'notify', enabled: true }
      ];
      
      const result = await monitorStatusFile(`${testDir}/status.md`, triggers);
      
      expect(result.success).toBe(true);
      expect(result.results[0].fired).toBe(true);
    });
  });
});
