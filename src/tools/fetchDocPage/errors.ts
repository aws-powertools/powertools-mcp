/**
 * Error thrown when cache operations fail or when a cache miss occurs.
 */
class CacheError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CacheError';
  }
}

export { CacheError };
