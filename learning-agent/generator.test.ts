import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import {
  generateSkillName,
  generateImplementation,
  formatSkill,
  generateSkill,
  writeSkill,
  skillExists,
  Pattern,
  ConfidenceResult
} from './generator';

describe('Skill Generator', () => {
  const testVaultPath = '/tmp/test-vault-skills';
  
  const mockPattern: Pattern = {
    name: 'build-project',
    action: 'BUILD',
    occurrences: 50,
    examples: ['Build React app', 'Build Node service', 'Build CLI tool'],
    firstSeen: '2026-01-01',
    lastSeen: '2026-02-03'
  };
  
  const mockConfidence: ConfidenceResult = {
    score: 87,
    level: 'high',
    factors: []
  };

  beforeEach(async () => {
    await fs.mkdir(testVaultPath, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testVaultPath, { recursive: true, force: true });
  });

  describe('generateSkillName()', () => {
    it('should prefix with auto-', () => {
      expect(generateSkillName(mockPattern)).toBe('auto-build-project');
    });
  });

  describe('generateImplementation()', () => {
    it('should include action and examples', () => {
      const impl = generateImplementation(mockPattern);
      expect(impl).toContain('BUILD');
      expect(impl).toContain('Build React app');
    });

    it('should include occurrence count', () => {
      const impl = generateImplementation(mockPattern);
      expect(impl).toContain('50 times');
    });
  });

  describe('formatSkill()', () => {
    it('should format as markdown with all sections', () => {
      const skill = generateSkill(mockPattern, mockConfidence);
      const formatted = formatSkill(skill);
      
      expect(formatted).toContain('# Skill:');
      expect(formatted).toContain('## Pattern');
      expect(formatted).toContain('## Implementation');
      expect(formatted).toContain('## Examples');
    });

    it('should include confidence score', () => {
      const skill = generateSkill(mockPattern, mockConfidence);
      const formatted = formatSkill(skill);
      
      expect(formatted).toContain('87%');
    });
  });

  describe('generateSkill()', () => {
    it('should create skill object from pattern', () => {
      const skill = generateSkill(mockPattern, mockConfidence);
      
      expect(skill.name).toBe('auto-build-project');
      expect(skill.confidence).toBe(87);
      expect(skill.examples.length).toBe(3);
      expect(skill.source).toBe('learning-agent');
    });
  });

  describe('writeSkill()', () => {
    it('should write skill file to vault', async () => {
      const skill = generateSkill(mockPattern, mockConfidence);
      const result = await writeSkill(skill, testVaultPath);
      
      expect(result.success).toBe(true);
      expect(result.path).toContain('auto-build-project.md');
      
      const content = await fs.readFile(result.path, 'utf-8');
      expect(content).toContain('Skill: auto-build-project');
    });
  });

  describe('skillExists()', () => {
    it('should return true if skill exists', async () => {
      const skill = generateSkill(mockPattern, mockConfidence);
      await writeSkill(skill, testVaultPath);
      
      expect(await skillExists('auto-build-project', testVaultPath)).toBe(true);
    });

    it('should return false if skill does not exist', async () => {
      expect(await skillExists('nonexistent', testVaultPath)).toBe(false);
    });
  });
});
