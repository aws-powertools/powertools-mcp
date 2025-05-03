/**
 * Fetch Service wrapped around "make-fetch-happen" module.
 * 
 * This service provides a content-type aware HTTP client with configurable caching strategies.
 * It serves as a "drop-in" replacement for node-fetch that adds file system caching with
 * proper HTTP caching mechanisms (ETag, Last-Modified) and additional features like:
 * - Content-type specific caching configurations
 * - Automatic retry with exponential backoff
 * - Cache statistics and management
 * - Conditional requests to reduce bandwidth
 */
import * as path from 'path';

import { CacheManager } from './cacheManager';
import { CacheConfig, CacheStats, ContentType, FetchOptions, Response } from './types';

import { defaults } from 'make-fetch-happen';

/**
 * Service for making HTTP requests with different caching configurations based on content type.
 * Each content type can have its own caching strategy, retry policy, and file system location.
 */
export class FetchService {
  /**
   * The cache configuration for this service instance
   */
  private readonly config: CacheConfig;
  
  /**
   * Map of content types to their corresponding fetch instances
   * Each content type has its own pre-configured fetch instance with specific caching settings
   */
  private readonly fetchInstances: Map<ContentType, any> = new Map();
  
  /**
   * Cache manager instance for handling file system operations
   */
  private readonly cacheManager: CacheManager;

  /**
   * Creates a new FetchService instance with content-type specific caching
   * 
   * @param config - Cache configuration defining base path and content type settings
   * @throws Error if the configuration is invalid or cache directories cannot be accessed
   */
  constructor(config: CacheConfig) {
    this.config = config;
    this.cacheManager = new CacheManager(config);

    // Initialize fetch instances for each content type
    if (config.contentTypes) {
      Object.entries(config.contentTypes).forEach(([type, settings]) => {
        const contentType = type as ContentType;
        this.fetchInstances.set(contentType, defaults({
          cachePath: path.join(config.basePath, settings.path),
          retry: {
            retries: settings.retries || 3,
            factor: settings.factor || 2,
            minTimeout: settings.minTimeout || 1000,
            maxTimeout: settings.maxTimeout || 5000,
          },
          cache: settings.cacheMode || 'default',
          // Enable ETag and Last-Modified validation
          cacheAdditionalHeaders: ['etag', 'last-modified']
        }));
      });
    }
  }

  /**
   * Fetch a resource using the appropriate content type determined automatically
   * from the URL or explicitly specified in options.
   * 
   * @param url - The URL to fetch, either as a string or URL object
   * @param options - Optional fetch options with make-fetch-happen extensions
   * @returns Promise resolving to the fetch Response
   * @throws Error if the content type cannot be determined or no fetch instance is configured
   * 
   * @example
   * ```typescript
   * // Automatic content type detection
   * const response = await fetchService.fetch('https://example.com/api/data');
   * 
   * // Explicit content type
   * const response = await fetchService.fetch('https://example.com/page', {
   *   contentType: ContentType.WEB_PAGE
   * });
   * ```
   */
  public async fetch(url: string | URL, options?: FetchOptions): Promise<Response> {
    const contentType = this.determineContentType(url, options?.contentType);
    return this.fetchWithContentType(url, contentType, options);
  }

  /**
   * Determine which content type to use based on URL and options
   * 
   * @param url - The URL to analyze for content type determination
   * @param explicitType - Optional explicit content type that overrides URL-based detection
   * @returns The determined ContentType
   * 
   * @internal
   */
  private determineContentType(url: string | URL, explicitType?: ContentType): ContentType {
    if (explicitType) return explicitType;
    
    const urlString = url.toString();
    if (urlString.includes('markdown.local')) {
      return ContentType.MARKDOWN;
    }
    return ContentType.WEB_PAGE;
  }

  /**
   * Fetch a resource using a specific content type
   * 
   * @param url - The URL to fetch, either as a string or URL object
   * @param contentType - The specific content type to use for this request
   * @param options - Optional fetch options with make-fetch-happen extensions
   * @returns Promise resolving to the fetch Response
   * @throws Error if no fetch instance is configured for the specified content type
   * 
   * @example
   * ```typescript
   * const response = await fetchService.fetchWithContentType(
   *   'https://example.com/api/data',
   *   ContentType.API_DATA,
   *   { headers: { 'Accept': 'application/json' } }
   * );
   * ```
   */
  public fetchWithContentType(
    url: string | URL, 
    contentType: ContentType, 
    options?: FetchOptions
  ): Promise<Response> {
    const fetchInstance = this.fetchInstances.get(contentType);
    if (!fetchInstance) {
      throw new Error(`No fetch instance configured for content type: ${contentType}`);
    }
    
    // Add headers to enable conditional requests
    const headers = options?.headers || {};
    
    // Perform the fetch with proper caching
    return fetchInstance(url, {
      ...options,
      headers
    });
  }

  /**
   * Clear the cache files for a specific content type
   * 
   * @param contentType - The content type whose cache should be cleared
   * @returns Promise that resolves when the cache has been cleared
   * @throws Error if the content type is unknown or cache directory cannot be accessed
   * 
   * @example
   * ```typescript
   * await fetchService.clearCache(ContentType.WEB_PAGE);
   * ```
   */
  public clearCache(contentType: ContentType): Promise<void> {
    return this.cacheManager.clearCache(contentType);
  }

  /**
   * Clear all cache files for all configured content types
   * 
   * @returns Promise that resolves when all caches have been cleared
   * @throws Error if any cache directory cannot be accessed
   * 
   * @example
   * ```typescript
   * await fetchService.clearAllCaches();
   * ```
   */
  public clearAllCaches(): Promise<void> {
    return this.cacheManager.clearAllCaches();
  }

  /**
   * Get the cache statistics for a specific content type
   * 
   * @param contentType - The content type to get statistics for
   * @returns Promise resolving to cache statistics including size, entry count, and timestamps
   * @throws Error if the content type is unknown
   * 
   * @example
   * ```typescript
   * const stats = await fetchService.getCacheStats(ContentType.API_DATA);
   * console.log(`Cache size: ${stats.size} bytes, ${stats.entries} entries`);
   * ```
   */
  public getCacheStats(contentType: ContentType): Promise<CacheStats> {
    return this.cacheManager.getStats(contentType);
  }

  /**
   * Clear cache entries older than a specific time
   * 
   * @param contentType - The content type to clear
   * @param olderThan - Date threshold - clear entries older than this date
   * @returns Promise resolving to number of entries cleared
   * @throws Error if the content type is unknown or cache directory cannot be accessed
   * 
   * @example
   * ```typescript
   * // Clear entries older than 7 days
   * const date = new Date();
   * date.setDate(date.getDate() - 7);
   * const cleared = await fetchService.clearCacheOlderThan(ContentType.SEARCH_INDEX, date);
   * console.log(`Cleared ${cleared} old cache entries`);
   * ```
   */
  public clearCacheOlderThan(contentType: ContentType, olderThan: Date): Promise<number> {
    return this.cacheManager.clearOlderThan(contentType, olderThan);
  }
}
