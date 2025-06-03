// Constants for cache configuration
const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000; // 14 days in milliseconds
const DEFAULT_CACHE_MODE: RequestCache = 'default';
const DEFAULT_RETRIES = 3;
const DEFAULT_RETRY_FACTOR = 2;
const DEFAULT_MIN_TIMEOUT = 1000; // 1 second
const DEFAULT_MAX_TIMEOUT = 10000; // 10 seconds

/**
 * Represents different content types for the fetch service
 */
const ContentType = {
  WEB_PAGE: 'web-page',
  MARKDOWN: 'markdown',
} as const;

// Allowed domain for security
const ALLOWED_DOMAIN = 'docs.powertools.aws.dev';
// Base URL for Powertools documentation
const POWERTOOLS_BASE_URL = 'https://docs.powertools.aws.dev/lambda';

// Constants for performance tuning
const FETCH_TIMEOUT_MS = 15000; // 15 seconds timeout for fetch operations

export {
  FOURTEEN_DAYS_MS,
  DEFAULT_CACHE_MODE,
  DEFAULT_RETRIES,
  DEFAULT_RETRY_FACTOR,
  DEFAULT_MIN_TIMEOUT,
  DEFAULT_MAX_TIMEOUT,
  ContentType,
  ALLOWED_DOMAIN,
  FETCH_TIMEOUT_MS,
  POWERTOOLS_BASE_URL,
};
