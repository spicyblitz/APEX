import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkLimit,
  getStatus,
  resetLimit,
  resetAllLimits,
  createRateLimiter
} from './rate-limiter';

describe('Rate Limiter', () => {
  const config = { maxRequests: 3, windowMs: 60000 };

  beforeEach(() => {
    resetAllLimits();
  });

  describe('checkLimit()', () => {
    it('should allow requests within limit', () => {
      const result1 = checkLimit('user1', config);
      const result2 = checkLimit('user1', config);
      const result3 = checkLimit('user1', config);
      
      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
      expect(result3.allowed).toBe(true);
    });

    it('should block requests exceeding limit', () => {
      checkLimit('user2', config);
      checkLimit('user2', config);
      checkLimit('user2', config);
      const result = checkLimit('user2', config);
      
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeGreaterThan(0);
    });

    it('should track remaining correctly', () => {
      const result1 = checkLimit('user3', config);
      const result2 = checkLimit('user3', config);
      
      expect(result1.remaining).toBe(2);
      expect(result2.remaining).toBe(1);
    });

    it('should isolate different keys', () => {
      checkLimit('userA', config);
      checkLimit('userA', config);
      checkLimit('userA', config);
      
      const resultB = checkLimit('userB', config);
      expect(resultB.allowed).toBe(true);
      expect(resultB.remaining).toBe(2);
    });
  });

  describe('getStatus()', () => {
    it('should return status without consuming', () => {
      checkLimit('user4', config);
      
      const status1 = getStatus('user4', config);
      const status2 = getStatus('user4', config);
      
      expect(status1.remaining).toBe(status2.remaining);
    });
  });

  describe('resetLimit()', () => {
    it('should reset limit for specific key', () => {
      checkLimit('user5', config);
      checkLimit('user5', config);
      checkLimit('user5', config);
      
      resetLimit('user5');
      
      const result = checkLimit('user5', config);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(2);
    });
  });

  describe('createRateLimiter()', () => {
    it('should create limiter instance', () => {
      const limiter = createRateLimiter(config);
      
      expect(limiter.check('test').allowed).toBe(true);
      expect(limiter.status('test').remaining).toBe(2);
      
      limiter.reset('test');
      expect(limiter.status('test').remaining).toBe(3);
    });
  });
});
