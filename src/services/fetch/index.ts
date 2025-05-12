/**
 * Export the FetchService and related types from the fetch module
 */
import cacheConfig from '../../config/cache';

import { FetchService } from './fetch';

// Create and export a global instance of FetchService
export const fetchService = new FetchService(cacheConfig);

// Export types and classes for when direct instantiation is needed
export { CacheManager } from './cacheManager';
export { FetchService } from './fetch';
export * from './types';

