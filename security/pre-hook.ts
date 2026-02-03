/**
 * Pre-Hook Security Gate
 * 
 * Gates all external actions through security checks.
 * Part of security layer.
 */

import { detectInjections, InjectionResult } from './injection-detector';

export interface ExternalAction {
  type: 'email' | 'tweet' | 'api_call' | 'message' | 'push';
  target: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export interface GateResult {
  allowed: boolean;
  action: ExternalAction;
  checks: SecurityCheck[];
  blocked_reason?: string;
}

export interface SecurityCheck {
  name: string;
  passed: boolean;
  message: string;
}

export interface RateLimitConfig {
  max_per_hour: number;
  current_count: number;
}

// In-memory rate limit tracking
const rateLimits = new Map<string, { count: number; reset: number }>();

/**
 * Check for prompt injection
 */
export function checkInjection(content: string): SecurityCheck {
  const result = detectInjections(content);
  
  return {
    name: 'injection_detection',
    passed: result.risk_level === 'none' || result.risk_level === 'low',
    message: result.detected 
      ? `Injection patterns detected: ${result.patterns.map(p => p.pattern).join(', ')}`
      : 'No injection patterns detected'
  };
}

/**
 * Check rate limit
 */
export function checkRateLimit(
  actionType: string,
  config: RateLimitConfig
): SecurityCheck {
  const key = actionType;
  const now = Date.now();
  const hourMs = 60 * 60 * 1000;
  
  let limit = rateLimits.get(key);
  
  if (!limit || now > limit.reset) {
    limit = { count: 0, reset: now + hourMs };
    rateLimits.set(key, limit);
  }
  
  const passed = limit.count < config.max_per_hour;
  
  if (passed) {
    limit.count++;
  }
  
  return {
    name: 'rate_limit',
    passed,
    message: passed 
      ? `Rate limit OK: ${limit.count}/${config.max_per_hour} per hour`
      : `Rate limit exceeded: ${limit.count}/${config.max_per_hour} per hour`
  };
}

/**
 * Check if target is allowed
 */
export function checkAllowlist(
  target: string,
  allowlist: string[]
): SecurityCheck {
  // If allowlist is empty, all targets allowed
  if (allowlist.length === 0) {
    return {
      name: 'allowlist',
      passed: true,
      message: 'No allowlist configured, target allowed'
    };
  }
  
  const passed = allowlist.some(allowed => 
    target.includes(allowed) || allowed === '*'
  );
  
  return {
    name: 'allowlist',
    passed,
    message: passed
      ? `Target ${target} is allowed`
      : `Target ${target} not in allowlist`
  };
}

/**
 * Main security gate function
 */
export function securityGate(
  action: ExternalAction,
  config: {
    rateLimits?: Record<string, RateLimitConfig>;
    allowlists?: Record<string, string[]>;
  } = {}
): GateResult {
  const checks: SecurityCheck[] = [];
  
  // Check 1: Injection detection
  checks.push(checkInjection(action.content));
  
  // Check 2: Rate limiting
  const rateConfig = config.rateLimits?.[action.type] || { max_per_hour: 100, current_count: 0 };
  checks.push(checkRateLimit(action.type, rateConfig));
  
  // Check 3: Allowlist
  const allowlist = config.allowlists?.[action.type] || [];
  checks.push(checkAllowlist(action.target, allowlist));
  
  // Determine if allowed
  const failed = checks.filter(c => !c.passed);
  const allowed = failed.length === 0;
  
  return {
    allowed,
    action,
    checks,
    blocked_reason: allowed ? undefined : failed.map(f => f.message).join('; ')
  };
}

/**
 * Reset rate limits (for testing)
 */
export function resetRateLimits(): void {
  rateLimits.clear();
}
