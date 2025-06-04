import { homedir } from 'node:os';
import { join } from 'node:path';
import {
  ContentType,
  DEFAULT_CACHE_MODE,
  DEFAULT_MAX_TIMEOUT,
  DEFAULT_MIN_TIMEOUT,
  DEFAULT_RETRIES,
  DEFAULT_RETRY_FACTOR,
  FOURTEEN_DAYS_MS,
} from './constants.ts';
import type { CacheConfig } from './types/fetchService.ts';

/**
 * Default cache configuration with 14-day expiration and ETag validation
 *
 * This configuration:
 * - Uses a single cache directory for all content
 * - Sets a 14-day expiration for cached content
 * - Relies on ETags for efficient validation
 * - Falls back to the expiration time if ETag validation fails
 */
const cacheConfig: CacheConfig = {
  // Base path for all cache directories
  basePath: process.env.CACHE_BASE_PATH || join(homedir(), '.powertools'),

  // Content type specific configurations
  contentTypes: {
    [ContentType.WEB_PAGE]: {
      path: 'cached-content', // Single directory for all content
      maxAge: FOURTEEN_DAYS_MS, // 14-day timeout
      cacheMode: DEFAULT_CACHE_MODE, // Standard HTTP cache mode
      retries: DEFAULT_RETRIES, // Retry attempts
      factor: DEFAULT_RETRY_FACTOR, // Exponential backoff factor
      minTimeout: DEFAULT_MIN_TIMEOUT,
      maxTimeout: DEFAULT_MAX_TIMEOUT,
    },
    [ContentType.MARKDOWN]: {
      path: 'markdown-cache', // Directory for markdown content
      maxAge: FOURTEEN_DAYS_MS, // 14-day timeout
      cacheMode: DEFAULT_CACHE_MODE, // Standard HTTP cache mode
      retries: 0, // No retries needed for markdown cache
      factor: DEFAULT_RETRY_FACTOR,
      minTimeout: DEFAULT_MIN_TIMEOUT,
      maxTimeout: DEFAULT_MAX_TIMEOUT,
    },
  },
};

export { cacheConfig };
