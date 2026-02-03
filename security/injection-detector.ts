/**
 * Injection Detector
 * 
 * Scans content for prompt injection patterns.
 * Part of security layer.
 */

export interface InjectionResult {
  detected: boolean;
  patterns: DetectedPattern[];
  risk_level: 'none' | 'low' | 'medium' | 'high';
}

export interface DetectedPattern {
  pattern: string;
  position: number;
  context: string;
  severity: 'low' | 'medium' | 'high';
}

// Known injection patterns
const INJECTION_PATTERNS: { pattern: RegExp; severity: 'low' | 'medium' | 'high'; name: string }[] = [
  // Instruction override attempts
  { pattern: /ignore\s+(all\s+)?(previous|prior)?\s*(instructions?|prompts?)/i, severity: 'high', name: 'instruction_override' },
  { pattern: /disregard\s+(the\s+)?(above|previous)/i, severity: 'high', name: 'disregard_instruction' },
  { pattern: /forget\s+(everything|all|what)/i, severity: 'high', name: 'forget_instruction' },
  
  // Role manipulation
  { pattern: /you\s+are\s+(now|actually|really)\s+a/i, severity: 'high', name: 'role_manipulation' },
  { pattern: /pretend\s+(to\s+be|you('re|are))/i, severity: 'medium', name: 'role_pretend' },
  { pattern: /act\s+as\s+(if|though)/i, severity: 'low', name: 'act_as' },
  
  // System prompt extraction
  { pattern: /repeat\s+(your|the)\s+(system\s+)?prompt/i, severity: 'high', name: 'prompt_extraction' },
  { pattern: /what('s|\s+is)\s+your\s+(system\s+)?prompt/i, severity: 'medium', name: 'prompt_inquiry' },
  { pattern: /show\s+(me\s+)?(your\s+)?instructions/i, severity: 'medium', name: 'instruction_extraction' },
  
  // Jailbreak attempts
  { pattern: /DAN\s+mode/i, severity: 'high', name: 'dan_mode' },
  { pattern: /developer\s+mode/i, severity: 'medium', name: 'developer_mode' },
  { pattern: /no\s+restrictions/i, severity: 'medium', name: 'no_restrictions' }
];

/**
 * Scan content for injection patterns
 */
export function detectInjections(content: string): InjectionResult {
  const patterns: DetectedPattern[] = [];
  
  for (const { pattern, severity, name } of INJECTION_PATTERNS) {
    const match = content.match(pattern);
    if (match && match.index !== undefined) {
      const start = Math.max(0, match.index - 20);
      const end = Math.min(content.length, match.index + match[0].length + 20);
      
      patterns.push({
        pattern: name,
        position: match.index,
        context: content.slice(start, end),
        severity
      });
    }
  }
  
  // Determine overall risk level
  let risk_level: 'none' | 'low' | 'medium' | 'high' = 'none';
  if (patterns.some(p => p.severity === 'high')) {
    risk_level = 'high';
  } else if (patterns.some(p => p.severity === 'medium')) {
    risk_level = 'medium';
  } else if (patterns.length > 0) {
    risk_level = 'low';
  }
  
  return {
    detected: patterns.length > 0,
    patterns,
    risk_level
  };
}

/**
 * Check if content is safe to process
 */
export function isSafe(content: string): boolean {
  const result = detectInjections(content);
  return result.risk_level === 'none' || result.risk_level === 'low';
}

/**
 * Sanitize content by removing injection patterns
 */
export function sanitize(content: string): string {
  let sanitized = content;
  
  for (const { pattern } of INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }
  
  return sanitized;
}
