import { access, readdir, stat, unlink } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { logger } from './logger.ts';
import type {
  CacheConfig,
  CacheStats,
  ContentType,
} from './types/fetchService.ts';
import { ContentType as ContentTypeMap } from './constants.ts';

class CacheManager {
  private readonly config: CacheConfig;

  /**
   * Creates a new CacheManager instance
   * @param config Cache configuration
   */
  constructor(config: CacheConfig) {
    this.config = config;
  }

  /**
   * Clear the cache files for a specific content type
   * @param contentType The content type to clear
   */
  public async clearCache(contentType: ContentType): Promise<void> {
    const cachePath = this.getCachePathForContentType(contentType);
    logger.debug(`Clearing cache: ${contentType} at path ${cachePath}`);

    try {
      // Check if directory exists before attempting to clear
      await access(cachePath);

      // Get all files and delete them
      const files = await this.getAllFiles(cachePath);

      // Filter out non-content files
      const contentFiles = files.filter(
        (file) =>
          !file.includes('index-') &&
          !file.includes('_tmp') &&
          !basename(file).startsWith('.')
      );

      // Delete each file
      await Promise.all(contentFiles.map((file) => unlink(file)));
    } catch (error) {
      // Directory doesn't exist or other error
      logger.error(`Error clearing cache for ${contentType}:`, { error });
    }
  }

  /**
   * Clear all cache files
   */
  public async clearAllCaches(): Promise<void> {
    for (const contentType of Object.values(ContentTypeMap)) {
      if (this.config.contentTypes[contentType]) {
        await this.clearCache(contentType as ContentType);
      }
    }
  }

  /**
   * Get the cache statistics for a specific content type
   * @param contentType The content type to get statistics for
   * @returns Promise resolving to cache statistics
   */
  public async getStats(contentType: ContentType): Promise<CacheStats> {
    const cachePath = this.getCachePathForContentType(contentType);

    try {
      // Check if cache directory exists
      await access(cachePath);

      // Get all files in the cache directory (recursively)
      const files = await this.getAllFiles(cachePath);

      // Filter out any non-content files (cacache stores metadata and indexes)
      const contentFiles = files.filter(
        (file) =>
          !file.includes('index-') &&
          !file.includes('_tmp') &&
          !basename(file).startsWith('.')
      );

      // Calculate total size
      let totalSize = 0;
      let oldestTime = Date.now();
      let newestTime = 0;

      // Get stats for each file
      const statsPromises = contentFiles.map(async (file) => {
        try {
          const stats = await stat(file);
          totalSize += stats.size;

          // Track oldest and newest files
          if (stats.mtime.getTime() < oldestTime) {
            oldestTime = stats.mtime.getTime();
          }
          if (stats.mtime.getTime() > newestTime) {
            newestTime = stats.mtime.getTime();
          }

          return stats;
        } catch (error) {
          logger.error(`Error getting stats for file ${file}:`, { error });
          return null;
        }
      });

      await Promise.all(statsPromises);

      return {
        size: totalSize,
        entries: contentFiles.length,
        oldestEntry: contentFiles.length > 0 ? new Date(oldestTime) : null,
        newestEntry: contentFiles.length > 0 ? new Date(newestTime) : null,
      };
    } catch (error) {
      // Directory doesn't exist or other error
      logger.error(`Error getting cache stats for ${contentType}:`, { error });
      return {
        size: 0,
        entries: 0,
        oldestEntry: null,
        newestEntry: null,
      };
    }
  }

  /**
   * Clear cache entries older than a specific time
   * @param contentType The content type to clear
   * @param olderThan Date threshold - clear entries older than this date
   * @returns Promise resolving to number of entries cleared
   */
  public async clearOlderThan(
    contentType: ContentType,
    olderThan: Date
  ): Promise<number> {
    const cachePath = this.getCachePathForContentType(contentType);
    let clearedCount = 0;

    try {
      // Get all files in cache
      const files = await this.getAllFiles(cachePath);

      // Filter out non-content files
      const contentFiles = files.filter(
        (file) =>
          !file.includes('index-') &&
          !file.includes('_tmp') &&
          !basename(file).startsWith('.')
      );

      // Check each file and delete if older than threshold
      for (const file of contentFiles) {
        try {
          const stats = await stat(file);

          if (stats.mtime < olderThan) {
            await unlink(file);
            clearedCount++;
          }
        } catch (error) {
          logger.error(`Error checking/removing file ${file}:`, { error });
        }
      }

      return clearedCount;
    } catch (error) {
      logger.error(`Error clearing old cache entries for ${contentType}:`, {
        error,
      });
      return 0;
    }
  }

  /**
   * Recursively get all files in a directory
   * @param dirPath Directory path to search
   * @returns Promise resolving to array of file paths
   */
  private async getAllFiles(dirPath: string): Promise<string[]> {
    try {
      const entries = await readdir(dirPath, { withFileTypes: true });

      const files = await Promise.all(
        entries.map(async (entry) => {
          const fullPath = join(dirPath, entry.name);

          if (entry.isDirectory()) {
            return this.getAllFiles(fullPath);
          }
          return [fullPath];
        })
      );

      // Flatten the array of arrays
      return files.flat();
    } catch (error) {
      logger.error(`Error reading directory ${dirPath}:`, { error });
      return [];
    }
  }

  /**
   * Get the file system path for a specific content type
   * @param contentType The content type
   * @returns The file system path
   */
  public getCachePathForContentType(contentType: ContentType): string {
    const contentTypeConfig = this.config.contentTypes[contentType];
    if (!contentTypeConfig) {
      throw new Error(`Unknown content type: ${contentType}`);
    }
    return join(this.config.basePath, contentTypeConfig.path);
  }
}

export { CacheManager };
