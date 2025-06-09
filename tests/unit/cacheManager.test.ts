import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CacheManager } from '../../src/cacheManager.ts';
import type { CacheConfig, ContentType } from '../../src/types/fetchService.ts';
import { ContentType as ContentTypeMap } from '../../src/constants.ts';

const mocks = vi.hoisted(() => ({
  access: vi.fn(),
  readdir: vi.fn(),
  stat: vi.fn(),
  unlink: vi.fn(),
}));

vi.mock('node:fs/promises', async (importOriginal) => ({
  ...(await importOriginal<typeof import('node:fs/promises')>()),
  access: mocks.access,
  readdir: mocks.readdir,
  stat: mocks.stat,
  unlink: mocks.unlink,
}));

const mockConfig: CacheConfig = {
  basePath: '/tmp/cache',
  contentTypes: {
    [ContentTypeMap.WEB_PAGE]: {
      path: 'web-pages',
      maxAge: 3600000,
      cacheMode: 'force-cache',
    },
    [ContentTypeMap.MARKDOWN]: {
      path: 'search-indexes',
      maxAge: 7200000,
      cacheMode: 'default',
    },
  },
};

beforeEach(() => {
  vi.clearAllMocks();
});

it('gets the correct cache path for a content type', () => {
  // Prepare
  const cacheManager = new CacheManager(mockConfig);

  // Act
  const webPagePath = cacheManager.getCachePathForContentType(
    ContentTypeMap.WEB_PAGE
  );
  const searchIndexPath = cacheManager.getCachePathForContentType(
    ContentTypeMap.MARKDOWN
  );

  // Assess
  expect(webPagePath).toBe('/tmp/cache/web-pages');
  expect(searchIndexPath).toBe('/tmp/cache/search-indexes');
});

it('throws an error for unknown content type', () => {
  // Prepare
  const cacheManager = new CacheManager(mockConfig);

  // Act & Assess
  expect(() => {
    cacheManager.getCachePathForContentType('unknown-type' as ContentType);
  }).toThrow('Unknown content type: unknown-type');
});

it('clears cache files for a specific content type', async () => {
  // Prepare
  const cacheManager = new CacheManager(mockConfig);
  mocks.access.mockResolvedValue(undefined);
  mocks.readdir.mockImplementation((dirPath) => {
    if (dirPath === '/tmp/cache/web-pages') {
      return Promise.resolve([
        { name: 'file1.txt', isDirectory: () => false },
        { name: 'file2.txt', isDirectory: () => false },
        { name: 'subdir', isDirectory: () => true },
      ]);
    }
    if (dirPath === '/tmp/cache/web-pages/subdir') {
      return Promise.resolve([{ name: 'file3.txt', isDirectory: () => false }]);
    }
    return Promise.resolve([]);
  });
  mocks.unlink.mockResolvedValue(undefined);

  // Act
  await cacheManager.clearCache(ContentTypeMap.WEB_PAGE);

  // Assess
  expect(mocks.access).toHaveBeenCalledWith('/tmp/cache/web-pages');
  expect(mocks.unlink).toHaveBeenCalledTimes(3);
});

it('handles errors when clearing cache', async () => {
  // Prepare
  const cacheManager = new CacheManager(mockConfig);
  mocks.access.mockRejectedValue(new Error('Directory not found'));

  // Act
  await cacheManager.clearCache(ContentTypeMap.WEB_PAGE);

  // Assess
  expect(mocks.access).toHaveBeenCalledWith('/tmp/cache/web-pages');
  expect(console.error).toHaveLoggedNth(
    1,
    expect.objectContaining({
      message: 'Error clearing cache for web-page:',
      error: expect.objectContaining({
        message: 'Directory not found',
      }),
    })
  );
});

it('clears all caches', async () => {
  // Prepare
  const cacheManager = new CacheManager(mockConfig);
  mocks.access.mockResolvedValue(undefined);
  mocks.readdir.mockResolvedValue([
    { name: 'file1.txt', isDirectory: () => false },
  ]);
  mocks.unlink.mockResolvedValue(undefined);

  // Act
  await cacheManager.clearAllCaches();

  // Assess
  expect(mocks.access).toHaveBeenCalledTimes(2);
  expect(mocks.access).toHaveBeenCalledWith('/tmp/cache/web-pages');
});

it('returns cache statistics', async () => {
  // Prepare
  const cacheManager = new CacheManager(mockConfig);
  mocks.access.mockResolvedValue(undefined);
  mocks.readdir.mockResolvedValue([
    { name: 'file1.txt', isDirectory: () => false },
    { name: 'file2.txt', isDirectory: () => false },
  ]);
  const oldDate = new Date(2023, 1, 1);
  const newDate = new Date(2023, 2, 1);
  mocks.stat
    .mockResolvedValueOnce({ size: 1000, mtime: oldDate })
    .mockResolvedValueOnce({ size: 2000, mtime: newDate });

  // Act
  const stats = await cacheManager.getStats(ContentTypeMap.WEB_PAGE);

  // Assess
  expect(stats).toEqual({
    size: 3000,
    entries: 2,
    oldestEntry: oldDate,
    newestEntry: newDate,
  });
});

it('handles errors when getting cache statistics', async () => {
  // Prepare
  const cacheManager = new CacheManager(mockConfig);
  mocks.access.mockRejectedValue(new Error('Directory not found'));

  // Act
  const stats = await cacheManager.getStats(ContentTypeMap.WEB_PAGE);

  // Assess
  expect(stats).toEqual({
    size: 0,
    entries: 0,
    oldestEntry: null,
    newestEntry: null,
  });
  expect(console.error).toHaveLoggedNth(
    1,
    expect.objectContaining({
      message: 'Error getting cache stats for web-page:',
      error: expect.objectContaining({
        message: 'Directory not found',
      }),
    })
  );
});

it('clears cache entries older than a specific date', async () => {
  // Prepare
  const cacheManager = new CacheManager(mockConfig);
  mocks.access.mockResolvedValue(undefined);
  mocks.readdir.mockResolvedValue([
    { name: 'file1.txt', isDirectory: () => false },
    { name: 'file2.txt', isDirectory: () => false },
  ]);
  const oldDate = new Date(2023, 1, 1);
  const newDate = new Date(2023, 2, 1);
  const cutoffDate = new Date(2023, 1, 15);
  mocks.stat
    .mockResolvedValueOnce({ mtime: oldDate })
    .mockResolvedValueOnce({ mtime: newDate });

  // Act
  const clearedCount = await cacheManager.clearOlderThan(
    ContentTypeMap.WEB_PAGE,
    cutoffDate
  );

  // Assess
  expect(clearedCount).toBe(1);
  expect(mocks.unlink).toHaveBeenCalledTimes(1);
});

it('handles errors when clearing old cache entries', async () => {
  // Prepare
  const cacheManager = new CacheManager(mockConfig);
  mocks.access.mockRejectedValue(new Error('Directory not found'));

  // Act
  const clearedCount = await cacheManager.clearOlderThan(
    ContentTypeMap.WEB_PAGE,
    new Date()
  );

  // Assess
  expect(clearedCount).toBe(0);
  expect(console.error).toHaveBeenCalled();
});
