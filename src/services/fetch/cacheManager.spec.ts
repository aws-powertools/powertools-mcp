import * as fs from 'fs/promises';

import { logger } from '../logger'

import { CacheManager } from './cacheManager';
import { CacheConfig, ContentType } from './types';

// Mock fs/promises
jest.mock('fs/promises', () => ({
  access: jest.fn(),
  readdir: jest.fn(),
  stat: jest.fn(),
  unlink: jest.fn()
}));

describe('[CacheManager] When managing cache files', () => {
  let cacheManager: CacheManager;
  const mockConfig: CacheConfig = {
    basePath: '/tmp/cache',
    contentTypes: {
      [ContentType.WEB_PAGE]: {
        path: 'web-pages',
        maxAge: 3600000,
        cacheMode: 'force-cache'
      },
      [ContentType.MARKDOWN]: {
        path: 'search-indexes',
        maxAge: 7200000,
        cacheMode: 'default'
      }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    cacheManager = new CacheManager(mockConfig);
    logger.info = jest.fn();
  });

  it('should get the correct cache path for a content type', () => {
    // Using private method via any cast for testing
    const webPagePath = (cacheManager as any).getCachePathForContentType(ContentType.WEB_PAGE);
    const searchIndexPath = (cacheManager as any).getCachePathForContentType(ContentType.MARKDOWN);

    expect(webPagePath).toBe('/tmp/cache/web-pages');
    expect(searchIndexPath).toBe('/tmp/cache/search-indexes');
  });

  it('should throw an error for unknown content type', () => {
    expect(() => {
      (cacheManager as any).getCachePathForContentType('unknown-type');
    }).toThrow('Unknown content type: unknown-type');
  });

  describe('When clearing cache', () => {
    it('should clear cache files for a specific content type', async () => {
      // Mock implementation
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      
      // Mock readdir to handle recursive directory structure
      (fs.readdir as jest.Mock).mockImplementation((dirPath) => {
        if (dirPath === '/tmp/cache/web-pages') {
          return Promise.resolve([
            { name: 'file1.txt', isDirectory: () => false },
            { name: 'file2.txt', isDirectory: () => false },
            { name: 'subdir', isDirectory: () => true }
          ]);
        } else if (dirPath === '/tmp/cache/web-pages/subdir') {
          return Promise.resolve([
            { name: 'file3.txt', isDirectory: () => false }
          ]);
        }
        return Promise.resolve([]);
      });
      
      (fs.unlink as jest.Mock).mockResolvedValue(undefined);

      await cacheManager.clearCache(ContentType.WEB_PAGE);

      expect(fs.access).toHaveBeenCalledWith('/tmp/cache/web-pages');
      expect(fs.unlink).toHaveBeenCalledTimes(3);
    });

    it('should handle errors when clearing cache', async () => {
      // Mock implementation to simulate error
      (fs.access as jest.Mock).mockRejectedValue(new Error('Directory not found'));

      await cacheManager.clearCache(ContentType.WEB_PAGE);

      expect(fs.access).toHaveBeenCalledWith('/tmp/cache/web-pages');
      expect(logger.info).toHaveBeenCalledWith(
        'Error clearing cache for web-page:',
        { error: expect.any(Error) }
      );
    });

    it('should clear all caches', async () => {
      // Mock implementation
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      (fs.readdir as jest.Mock).mockResolvedValue([
        { name: 'file1.txt', isDirectory: () => false }
      ]);
      (fs.unlink as jest.Mock).mockResolvedValue(undefined);

      await cacheManager.clearAllCaches();

      expect(fs.access).toHaveBeenCalledTimes(2);
      expect(fs.access).toHaveBeenCalledWith('/tmp/cache/web-pages');
    });
  });

  describe('When getting cache statistics', () => {
    it('should return cache statistics', async () => {
      // Mock implementation
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      (fs.readdir as jest.Mock).mockResolvedValue([
        { name: 'file1.txt', isDirectory: () => false },
        { name: 'file2.txt', isDirectory: () => false }
      ]);
      
      const oldDate = new Date(2023, 1, 1);
      const newDate = new Date(2023, 2, 1);
      
      (fs.stat as jest.Mock)
        .mockResolvedValueOnce({ size: 1000, mtime: oldDate })
        .mockResolvedValueOnce({ size: 2000, mtime: newDate });

      const stats = await cacheManager.getStats(ContentType.WEB_PAGE);

      expect(stats).toEqual({
        size: 3000,
        entries: 2,
        oldestEntry: oldDate,
        newestEntry: newDate
      });
    });

    it('should handle errors when getting cache statistics', async () => {
      // Mock implementation to simulate error
      (fs.access as jest.Mock).mockRejectedValue(new Error('Directory not found'));

      const stats = await cacheManager.getStats(ContentType.WEB_PAGE);

      expect(stats).toEqual({
        size: 0,
        entries: 0,
        oldestEntry: null,
        newestEntry: null
      });
      expect(logger.info).toHaveBeenCalledWith(
        'Error getting cache stats for web-page:',
        { error: expect.any(Error) }
      );
    });
  });

  describe('When clearing old cache entries', () => {
    it('should clear cache entries older than a specific date', async () => {
      // Mock implementation
      (fs.access as jest.Mock).mockResolvedValue(undefined);
      (fs.readdir as jest.Mock).mockResolvedValue([
        { name: 'file1.txt', isDirectory: () => false },
        { name: 'file2.txt', isDirectory: () => false }
      ]);
      
      const oldDate = new Date(2023, 1, 1);
      const newDate = new Date(2023, 2, 1);
      const cutoffDate = new Date(2023, 1, 15);
      
      (fs.stat as jest.Mock)
        .mockResolvedValueOnce({ mtime: oldDate })
        .mockResolvedValueOnce({ mtime: newDate });

      const clearedCount = await cacheManager.clearOlderThan(ContentType.WEB_PAGE, cutoffDate);

      expect(clearedCount).toBe(1);
      expect(fs.unlink).toHaveBeenCalledTimes(1);
    });

    it('should handle errors when clearing old cache entries', async () => {
      // Mock implementation to simulate directory access error
      (fs.access as jest.Mock).mockRejectedValue(new Error('Directory not found'));

      const clearedCount = await cacheManager.clearOlderThan(
        ContentType.WEB_PAGE, 
        new Date()
      );

      expect(clearedCount).toBe(0);
      // Just check that logger.info was called at least once
      expect(logger.info).toHaveBeenCalled();
    });
  });
});
