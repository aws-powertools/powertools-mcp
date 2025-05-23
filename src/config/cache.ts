/**
 * Copyright (c) 2025 Michael Walmsley, ServerlessDNA.com
 * Licensed under the MIT License.
 */

/**
 * Cache configuration for the fetch service
 */
import * as os from 'os';
import * as path from 'path';

import { CacheConfig, ContentType, RequestCache } from '../services/fetch/types';

// Constants for cache configuration
const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000; // 14 days in milliseconds
const DEFAULT_CACHE_MODE: RequestCache = 'default';
const DEFAULT_RETRIES = 3;
const DEFAULT_RETRY_FACTOR = 2;
const DEFAULT_MIN_TIMEOUT = 1000; // 1 second
const DEFAULT_MAX_TIMEOUT = 10000; // 10 seconds

/**
 * Default cache configuration with 14-day expiration and ETag validation
 * 
 * This configuration:
 * - Uses a single cache directory for all content
 * - Sets a 14-day expiration for cached content
 * - Relies on ETags for efficient validation
 * - Falls back to the expiration time if ETag validation fails
 */
export const cacheConfig: CacheConfig = {
  // Base path for all cache directories
  basePath: process.env.CACHE_BASE_PATH || path.join(os.homedir(), '.powertools'),
  
  // Content type specific configurations
  contentTypes: {
    [ContentType.WEB_PAGE]: {
      path: 'cached-content',         // Single directory for all content
      maxAge: FOURTEEN_DAYS_MS,       // 14-day timeout
      cacheMode: DEFAULT_CACHE_MODE,  // Standard HTTP cache mode
      retries: DEFAULT_RETRIES,       // Retry attempts
      factor: DEFAULT_RETRY_FACTOR,   // Exponential backoff factor
      minTimeout: DEFAULT_MIN_TIMEOUT,
      maxTimeout: DEFAULT_MAX_TIMEOUT
    },
    [ContentType.MARKDOWN]: {
      path: 'markdown-cache',         // Directory for markdown content
      maxAge: FOURTEEN_DAYS_MS,       // 14-day timeout
      cacheMode: DEFAULT_CACHE_MODE,  // Standard HTTP cache mode
      retries: 0,                     // No retries needed for markdown cache
      factor: DEFAULT_RETRY_FACTOR,
      minTimeout: DEFAULT_MIN_TIMEOUT,
      maxTimeout: DEFAULT_MAX_TIMEOUT
    }
  }
};

export default cacheConfig;
