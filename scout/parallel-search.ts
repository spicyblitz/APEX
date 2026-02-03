/**
 * Parallel Search
 * 
 * Searches multiple sources simultaneously.
 * Part of Scout agent.
 */

export interface SearchResult {
  source: string;
  items: SearchItem[];
  error?: string;
}

export interface SearchItem {
  title: string;
  url: string;
  snippet: string;
  score?: number;
}

export interface ParallelSearchResult {
  success: boolean;
  results: SearchResult[];
  duration_ms: number;
  errors: string[];
}

export interface SearchFunction {
  (query: string): Promise<SearchResult>;
}

export interface SearchOptions {
  sources: {
    name: string;
    search: SearchFunction;
  }[];
  query: string;
  timeout?: number;
}

/**
 * Execute searches in parallel with timeout
 */
export async function parallelSearch(options: SearchOptions): Promise<ParallelSearchResult> {
  const { sources, query, timeout = 10000 } = options;
  const startTime = Date.now();
  const errors: string[] = [];

  // Create timeout promise
  const timeoutPromise = <T>(promise: Promise<T>, ms: number): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error('Search timeout')), ms)
      )
    ]);
  };

  // Execute all searches in parallel
  const searchPromises = sources.map(async ({ name, search }) => {
    try {
      const result = await timeoutPromise(search(query), timeout);
      return { ...result, source: name };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push(`${name}: ${errorMsg}`);
      return {
        source: name,
        items: [],
        error: errorMsg
      };
    }
  });

  const results = await Promise.all(searchPromises);

  return {
    success: errors.length === 0,
    results,
    duration_ms: Date.now() - startTime,
    errors
  };
}

/**
 * Mock HN search (for testing)
 */
export async function searchHN(query: string): Promise<SearchResult> {
  // In production, this would call HN API
  return {
    source: 'hn',
    items: []
  };
}

/**
 * Mock Reddit search (for testing)
 */
export async function searchReddit(query: string): Promise<SearchResult> {
  // In production, this would call Reddit API
  return {
    source: 'reddit',
    items: []
  };
}

/**
 * Mock Twitter search (for testing)
 */
export async function searchTwitter(query: string): Promise<SearchResult> {
  // In production, this would use bird skill
  return {
    source: 'twitter',
    items: []
  };
}
