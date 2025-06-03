import { CacheManager } from '../src/cacheManager.ts';
import { it, expect, beforeEach, vi } from 'vitest';
//import { FetchService } from './index';
import type { CacheConfig } from '../src/types/fetchService.ts';
import { ContentType } from '../src/constants.ts';
import { defaults } from 'make-fetch-happen';

// Mock make-fetch-happen
vi.mock('make-fetch-happen', () => ({
  defaults: vi.fn().mockImplementation(() => vi.fn()),
}));

// Mock CacheManager
vi.mock('./cacheManager');

let fetchService: FetchService;

const mockConfig: CacheConfig = {
  basePath: '/tmp/cache',
  contentTypes: {
    [ContentType.WEB_PAGE]: {
      path: 'web-pages',
      maxAge: 3600000,
      cacheMode: 'force-cache',
      retries: 3,
    },
    [ContentType.SEARCH_INDEX]: {
      path: 'search-indexes',
      maxAge: 7200000,
      cacheMode: 'default',
      retries: 2,
    },
  },
};

// Setup CacheManager mock with proper methods
mockCacheManager = {
  clearCache: jest.fn().mockResolvedValue(undefined),
  clearAllCaches: jest.fn().mockResolvedValue(undefined),
  getStats: jest.fn().mockResolvedValue({
    size: 1000,
    entries: 10,
    oldestEntry: new Date(),
    newestEntry: new Date(),
  }),
  clearOlderThan: jest.fn().mockResolvedValue(5),
};

// Set up the mock to return our mockCacheManager
(CacheManager as jest.Mock).mockImplementation(() => mockCacheManager);

fetchService = new FetchService(mockConfig);

beforeEach(() => {
  vi.clearAllMocks();
});

it('should initialize with the correct configuration', () => {
  expect(defaults).toHaveBeenCalledTimes(2);
  expect(defaults).toHaveBeenCalledWith(
    expect.objectContaining({
      cachePath: '/tmp/cache/web-pages',
      cache: 'force-cache',
    })
  );
  expect(defaults).toHaveBeenCalledWith(
    expect.objectContaining({
      cachePath: '/tmp/cache/search-indexes',
      cache: 'default',
    })
  );
  expect(CacheManager).toHaveBeenCalledWith(mockConfig);
});

it('should use explicit content type from options', async () => {
  // Create mock fetch instances
  const mockFetchInstances = new Map();
  const mockWebPageFetch = vi.fn().mockResolvedValue('web-page-response');
  const mockMarkdownFetch = vi.fn().mockResolvedValue('search-index-response');

  mockFetchInstances.set(ContentType.WEB_PAGE, mockWebPageFetch);
  mockFetchInstances.set(ContentType.MARKDOWN, mockMarkdownFetch);

  // Set the mock fetch instances
  (fetchService as any).fetchInstances = mockFetchInstances;

  await fetchService.fetch('https://example.com', {
    contentType: ContentType.WEB_PAGE,
  });

  expect(mockWebPageFetch).toHaveBeenCalledWith(
    'https://example.com',
    expect.objectContaining({
      contentType: ContentType.WEB_PAGE,
    })
  );
  expect(mockMarkdownFetch).not.toHaveBeenCalled();
});

it('should determine content type based on URL pattern', async () => {
  // Create mock fetch instances
  const mockFetchInstances = new Map();
  const mockWebPageFetch = jest.fn().mockResolvedValue('web-page-response');
  const mockSearchIndexFetch = jest
    .fn()
    .mockResolvedValue('search-index-response');

  mockFetchInstances.set(ContentType.WEB_PAGE, mockWebPageFetch);
  mockFetchInstances.set(ContentType.MARKDOWN, mockSearchIndexFetch);

  // Set the mock fetch instances
  (fetchService as any).fetchInstances = mockFetchInstances;

  await fetchService.fetch('https://markdown.local/test');

  expect(mockSearchIndexFetch).toHaveBeenCalledWith(
    'https://markdown.local/test',
    expect.objectContaining({
      headers: {},
    })
  );
  expect(mockWebPageFetch).not.toHaveBeenCalled();
});

it('should use web page content type for regular URLs', async () => {
  // Create mock fetch instances
  const mockFetchInstances = new Map();
  const mockWebPageFetch = jest.fn().mockResolvedValue('web-page-response');
  const mockSearchIndexFetch = jest
    .fn()
    .mockResolvedValue('search-index-response');

  mockFetchInstances.set(ContentType.WEB_PAGE, mockWebPageFetch);
  mockFetchInstances.set(ContentType.SEARCH_INDEX, mockSearchIndexFetch);

  // Set the mock fetch instances
  (fetchService as any).fetchInstances = mockFetchInstances;

  await fetchService.fetch('https://example.com/page');

  expect(mockWebPageFetch).toHaveBeenCalledWith(
    'https://example.com/page',
    expect.objectContaining({
      headers: {},
    })
  );
  expect(mockSearchIndexFetch).not.toHaveBeenCalled();
});

it('should use the correct fetch instance for web page content type', async () => {
  // Create mock fetch instances
  const mockFetchInstances = new Map();
  const mockWebPageFetch = jest.fn().mockResolvedValue('web-page-response');

  mockFetchInstances.set(ContentType.WEB_PAGE, mockWebPageFetch);

  // Set the mock fetch instances
  (fetchService as any).fetchInstances = mockFetchInstances;

  const result = await fetchService.fetchWithContentType(
    'https://example.com',
    ContentType.WEB_PAGE
  );

  expect(mockWebPageFetch).toHaveBeenCalledWith(
    'https://example.com',
    expect.objectContaining({
      headers: {},
    })
  );
  expect(result).toBe('web-page-response');
});

it('should use the correct fetch instance for search index content type', async () => {
  // Create mock fetch instances
  const mockFetchInstances = new Map();
  const mockSearchIndexFetch = jest
    .fn()
    .mockResolvedValue('search-index-response');

  mockFetchInstances.set(ContentType.SEARCH_INDEX, mockSearchIndexFetch);

  // Set the mock fetch instances
  (fetchService as any).fetchInstances = mockFetchInstances;

  const result = await fetchService.fetchWithContentType(
    'https://example.com',
    ContentType.SEARCH_INDEX
  );

  expect(mockSearchIndexFetch).toHaveBeenCalledWith(
    'https://example.com',
    expect.objectContaining({
      headers: {},
    })
  );
  expect(result).toBe('search-index-response');
});

it('should throw an error for unknown content type', () => {
  expect(() => {
    fetchService.fetchWithContentType(
      'https://example.com',
      'unknown-type' as ContentType
    );
  }).toThrow('No fetch instance configured for content type: unknown-type');
});

it('delegates clearCache to CacheManager', async () => {
  // Act
  await fetchService.clearCache(ContentType.WEB_PAGE);

  // Assess
  expect(mockCacheManager.clearCache).toHaveBeenCalledWith(
    ContentType.WEB_PAGE
  );
});

it('delegates clearAllCaches to CacheManager', async () => {
  // Act
  await fetchService.clearAllCaches();

  // Assess
  expect(mockCacheManager.clearAllCaches).toHaveBeenCalled();
});

it('delegates getCacheStats to CacheManager', async () => {
  // Act
  const stats = await fetchService.getCacheStats(ContentType.MARKDOWN);

  // Assess
  expect(mockCacheManager.getStats).toHaveBeenCalledWith(ContentType.MARKDOWN);
  expect(stats).toEqual({
    size: 1000,
    entries: 10,
    oldestEntry: expect.any(Date),
    newestEntry: expect.any(Date),
  });
});

it('delegates clearCacheOlderThan to CacheManager', async () => {
  // Prepare
  const date = new Date();

  // Act
  const result = await fetchService.clearCacheOlderThan(
    ContentType.WEB_PAGE,
    date
  );

  // Assess
  expect(mockCacheManager.clearOlderThan).toHaveBeenCalledWith(
    ContentType.WEB_PAGE,
    date
  );
  expect(result).toBe(5);
});
