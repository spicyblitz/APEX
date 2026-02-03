import { describe, it, expect, vi } from 'vitest';
import { parallelSearch, SearchResult } from './parallel-search';

describe('Parallel Search', () => {
  describe('parallelSearch()', () => {
    it('should execute searches in parallel', async () => {
      const mockSearch1 = vi.fn().mockResolvedValue({ source: 'hn', items: [{ title: 'HN Item', url: 'http://hn.com', snippet: 'test' }] });
      const mockSearch2 = vi.fn().mockResolvedValue({ source: 'reddit', items: [{ title: 'Reddit Item', url: 'http://reddit.com', snippet: 'test' }] });

      const result = await parallelSearch({
        sources: [
          { name: 'hn', search: mockSearch1 },
          { name: 'reddit', search: mockSearch2 }
        ],
        query: 'AI tools'
      });

      expect(result.success).toBe(true);
      expect(result.results.length).toBe(2);
      expect(mockSearch1).toHaveBeenCalledWith('AI tools');
      expect(mockSearch2).toHaveBeenCalledWith('AI tools');
    });

    it('should handle search failures gracefully', async () => {
      const mockSearch1 = vi.fn().mockResolvedValue({ source: 'hn', items: [] });
      const mockSearch2 = vi.fn().mockRejectedValue(new Error('API error'));

      const result = await parallelSearch({
        sources: [
          { name: 'hn', search: mockSearch1 },
          { name: 'reddit', search: mockSearch2 }
        ],
        query: 'test'
      });

      expect(result.success).toBe(false);
      expect(result.errors.length).toBe(1);
      expect(result.errors[0]).toContain('reddit');
      // Should still have results from successful search
      expect(result.results.find(r => r.source === 'hn')).toBeDefined();
    });

    it('should timeout slow searches', async () => {
      const slowSearch = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 5000))
      );
      const fastSearch = vi.fn().mockResolvedValue({ source: 'fast', items: [] });

      const result = await parallelSearch({
        sources: [
          { name: 'slow', search: slowSearch },
          { name: 'fast', search: fastSearch }
        ],
        query: 'test',
        timeout: 100
      });

      expect(result.errors.length).toBe(1);
      expect(result.errors[0]).toContain('slow');
      expect(result.errors[0]).toContain('timeout');
    });

    it('should measure duration', async () => {
      const mockSearch = vi.fn().mockResolvedValue({ source: 'test', items: [] });

      const result = await parallelSearch({
        sources: [{ name: 'test', search: mockSearch }],
        query: 'test'
      });

      expect(result.duration_ms).toBeGreaterThanOrEqual(0);
    });

    it('should return results from all sources', async () => {
      const sources = [
        { name: 'hn', search: vi.fn().mockResolvedValue({ source: 'hn', items: [{ title: 'A', url: '', snippet: '' }] }) },
        { name: 'reddit', search: vi.fn().mockResolvedValue({ source: 'reddit', items: [{ title: 'B', url: '', snippet: '' }] }) },
        { name: 'twitter', search: vi.fn().mockResolvedValue({ source: 'twitter', items: [{ title: 'C', url: '', snippet: '' }] }) }
      ];

      const result = await parallelSearch({ sources, query: 'AI' });

      expect(result.results.length).toBe(3);
      expect(result.results.map(r => r.source)).toEqual(['hn', 'reddit', 'twitter']);
    });
  });
});
