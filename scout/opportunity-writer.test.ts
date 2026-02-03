import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs/promises';
import {
  generateId,
  generateSlug,
  calculateScore,
  formatOpportunity,
  writeOpportunity,
  Opportunity
} from './opportunity-writer';

describe('Opportunity Writer', () => {
  const testVaultPath = '/tmp/test-vault-opportunities';
  
  const mockOpp: Opportunity = {
    source: 'reddit/r/SaaS',
    signal: 'User needs better invoicing',
    painPoint: 'Current tools are too complex',
    opportunity: 'Build simple invoicing for freelancers',
    relevance: 8,
    effort: 'M'
  };

  beforeEach(async () => {
    await fs.mkdir(testVaultPath, { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(testVaultPath, { recursive: true, force: true });
  });

  describe('generateId()', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^opp-\d{4}-\d{2}-\d{2}-[a-z0-9]{4}$/);
    });
  });

  describe('generateSlug()', () => {
    it('should convert signal to slug', () => {
      expect(generateSlug('User needs better invoicing')).toBe('user-needs-better-invoicing');
    });

    it('should limit length', () => {
      const slug = generateSlug('This is a very long signal that should be truncated for the filename');
      expect(slug.length).toBeLessThanOrEqual(30);
    });
  });

  describe('calculateScore()', () => {
    it('should calculate score based on relevance and effort', () => {
      expect(calculateScore({ ...mockOpp, relevance: 10, effort: 'S' })).toBe(12);
      expect(calculateScore({ ...mockOpp, relevance: 10, effort: 'M' })).toBe(10);
      expect(calculateScore({ ...mockOpp, relevance: 10, effort: 'L' })).toBe(8);
    });
  });

  describe('formatOpportunity()', () => {
    it('should format with YAML frontmatter', () => {
      const formatted = formatOpportunity(mockOpp);
      expect(formatted).toContain('---');
      expect(formatted).toContain('source: reddit/r/SaaS');
      expect(formatted).toContain('relevance: 8');
    });

    it('should include all sections', () => {
      const formatted = formatOpportunity(mockOpp);
      expect(formatted).toContain('## Signal');
      expect(formatted).toContain('## Pain Point');
      expect(formatted).toContain('## Opportunity');
      expect(formatted).toContain('## Analysis');
    });
  });

  describe('writeOpportunity()', () => {
    it('should write opportunity to vault', async () => {
      const result = await writeOpportunity(mockOpp, testVaultPath);
      
      expect(result.success).toBe(true);
      expect(result.path).toContain('.md');
      
      const content = await fs.readFile(result.path, 'utf-8');
      expect(content).toContain('User needs better invoicing');
    });

    it('should create directory if not exists', async () => {
      const newPath = `${testVaultPath}/nested/path`;
      const result = await writeOpportunity(mockOpp, newPath);
      
      expect(result.success).toBe(true);
    });

    it('should return generated ID', async () => {
      const result = await writeOpportunity(mockOpp, testVaultPath);
      expect(result.id).toMatch(/^opp-/);
    });
  });
});
