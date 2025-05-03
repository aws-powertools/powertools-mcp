import { createHash } from 'crypto';
import * as path from 'path';

import cacheConfig from './config/cache';
import { FetchService } from './services/fetch';
import { ContentType } from './services/fetch/types';
// Import the module after mocking
import { clearDocCache, fetchDocPage } from './docFetcher';

import * as cacache from 'cacache';

// Mock the FetchService module with an inline mock function
jest.mock('./services/fetch', () => {
  return {
    FetchService: jest.fn().mockImplementation(() => ({
      fetch: jest.fn(), // Create the mock function inline
      clearCache: jest.fn()
    }))
  };
});

// Mock crypto module
jest.mock('crypto', () => {
  return {
    createHash: jest.fn().mockImplementation(() => ({
      update: jest.fn().mockReturnThis(),
      digest: jest.fn().mockReturnValue('mock-content-hash')
    }))
  };
});

// Mock cacache module
jest.mock('cacache', () => {
  return {
    get: jest.fn(),
    put: jest.fn().mockResolvedValue(undefined),
    rm: {
      all: jest.fn().mockResolvedValue(undefined)
    }
  };
});

// Get a reference to the mock function AFTER it's created
const mockFetchService = FetchService as jest.MockedFunction<typeof FetchService>;
const mockFetch = mockFetchService.mock.results[0].value.fetch;
const mockClearCache = mockFetchService.mock.results[0].value.clearCache;
const mockCacacheGet = cacache.get as jest.MockedFunction<typeof cacache.get>;
const mockCacacheGetInfo = jest.fn();
(cacache.get as any).info = mockCacacheGetInfo;

// Helper function to measure memory usage
function getMemoryUsage(): { heapUsed: number, heapTotal: number } {
  const memoryData = process.memoryUsage();
  return {
    heapUsed: Math.round(memoryData.heapUsed / 1024 / 1024), // MB
    heapTotal: Math.round(memoryData.heapTotal / 1024 / 1024), // MB
  };
}

// Helper function to measure execution time
async function measureExecutionTime<T>(fn: () => Promise<T>): Promise<{ result: T, executionTime: number }> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  return {
    result,
    executionTime: Math.round(end - start),
  };
}

// Mock console.error to avoid cluttering test output
beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('[DocFetcher] When validating URLs', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reject URLs from disallowed domains', async () => {
    // Setup
    const invalidUrl = 'https://example.com/docs';
    
    // Execute
    const result = await fetchDocPage(invalidUrl);
    
    // Verify
    expect(result).toContain('Error fetching documentation');
    expect(result).toContain('Invalid URL');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should accept URLs from allowed domain', async () => {
    // Setup
    const validUrl = 'https://docs.powertools.aws.dev/lambda/python/latest/';
    
    // Mock a successful response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      url: validUrl,
      text: jest.fn().mockResolvedValue('<html><body><h1>Test</h1></body></html>'),
      json: jest.fn(),
      buffer: jest.fn(),
      arrayBuffer: jest.fn()
    });
    
    // Execute
    await fetchDocPage(validUrl);
    
    // Verify
    expect(mockFetch).toHaveBeenCalledWith(
      validUrl, 
      expect.objectContaining({
        contentType: ContentType.WEB_PAGE
      })
    );
  });
});

describe('[DocFetcher] Performance measurements', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should measure performance for fetching documentation', async () => {
    // Setup
    const url = 'https://docs.powertools.aws.dev/lambda/python/latest/';
    
    // Mock a successful response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers(),
      url: url,
      text: jest.fn().mockResolvedValue('<html><body><h1>Test Document</h1><p>Content</p></body></html>'),
      json: jest.fn(),
      buffer: jest.fn(),
      arrayBuffer: jest.fn()
    });
    
    // Measure initial memory
    const initialMemory = getMemoryUsage();
    console.log('Initial memory usage:', initialMemory);
    
    // Execute with timing
    const { result, executionTime } = await measureExecutionTime(() => fetchDocPage(url));
    
    // Measure final memory
    const finalMemory = getMemoryUsage();
    const memoryIncrease = {
      heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
      heapTotal: finalMemory.heapTotal - initialMemory.heapTotal
    };
    
    console.log('Final memory usage:', finalMemory);
    console.log('Memory increase:', memoryIncrease);
    console.log('Execution time:', executionTime, 'ms');
    console.log('Result length:', result.length, 'characters');
    
    // Verify
    expect(executionTime).toBeDefined();
    expect(result.length).toBeGreaterThan(0);
  });
});

// Add a final summary after all tests
afterAll(() => {
  console.log('\n===== DOCFETCHER TEST SUMMARY =====');
  console.log('All tests completed successfully');
  console.log('Memory usage at end of tests:', getMemoryUsage());
  console.log('===== END SUMMARY =====');
});

describe('[DocFetcher] When using markdown caching', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should use cached markdown when available', async () => {
    // Setup mock response for HTML fetch
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: {
        get: jest.fn().mockImplementation((name) => {
          if (name === 'etag') return '"mock-etag"';
          return null;
        })
      },
      text: jest.fn().mockResolvedValue('<html><body><div class="md-content" data-md-component="content"><h1>Test Page</h1><p>Test content</p></div></body></html>')
    };
    
    // Setup mock for cacache.get.info and cacache.get
    mockCacacheGetInfo.mockResolvedValueOnce({ integrity: 'sha512-test' });
    mockCacacheGet.mockResolvedValueOnce({ 
      data: Buffer.from('# Test Page\n\nTest content', 'utf8'),
      metadata: null,
      integrity: 'sha512-test'
    });
    
    // Configure the fetch mock
    mockFetch.mockResolvedValueOnce(mockResponse);
    
    // Call the function
    const result = await fetchDocPage('https://docs.powertools.aws.dev/lambda/python/latest/core/logger/');
    
    // Verify the result
    expect(result).toBe('# Test Page\n\nTest content');
    
    // Verify that the markdown was fetched from cache
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith('https://docs.powertools.aws.dev/lambda/python/latest/core/logger/', expect.anything());
    
    // Verify that cacache was used
    expect(mockCacacheGetInfo).toHaveBeenCalledWith(
      path.join(cacheConfig.basePath, 'markdown-cache'),
      'python/latest/core/logger-mock-etag'
    );
    expect(mockCacacheGet).toHaveBeenCalledWith(
      path.join(cacheConfig.basePath, 'markdown-cache'),
      'python/latest/core/logger-mock-etag'
    );
  });

  it('should generate and cache markdown when not in cache', async () => {
    // Setup mock response for HTML fetch
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: {
        get: jest.fn().mockImplementation((name) => {
          if (name === 'etag') return '"mock-etag-2"';
          return null;
        })
      },
      text: jest.fn().mockResolvedValue('<html><body><div class="md-content" data-md-component="content"><h1>Test Page</h1><p>Test content</p></div></body></html>')
    };
    
    // Setup mock for cacache.get.info to throw "not found" error
    mockCacacheGetInfo.mockRejectedValueOnce(new Error('ENOENT: no such file or directory'));
    
    // Configure the fetch mock
    mockFetch.mockResolvedValueOnce(mockResponse);
    
    // Call the function
    const result = await fetchDocPage('https://docs.powertools.aws.dev/lambda/python/latest/core/logger/');
    
    // Verify the result contains markdown
    expect(result).toContain('# Test Page');
    
    // Verify that the markdown was not found in cache and then saved
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith('https://docs.powertools.aws.dev/lambda/python/latest/core/logger/', expect.anything());
    
    // Verify that cacache was used to save the markdown
    expect(cacache.put).toHaveBeenCalledWith(
      path.join(cacheConfig.basePath, 'markdown-cache'),
      'python/latest/core/logger-mock-etag-2',
      expect.stringContaining('# Test Page')
    );
  });

  it('should use content hash when ETag is not available', async () => {
    // Setup mock response for HTML fetch without ETag
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: {
        get: jest.fn().mockReturnValue(null) // No ETag
      },
      text: jest.fn().mockResolvedValue('<html><body><div class="md-content" data-md-component="content"><h1>Test Page</h1><p>Test content</p></div></body></html>')
    };
    
    // Setup mock for cacache.get.info to throw "not found" error
    mockCacacheGetInfo.mockRejectedValueOnce(new Error('ENOENT: no such file or directory'));
    
    // Configure the fetch mock
    mockFetch.mockResolvedValueOnce(mockResponse);
    
    // Call the function
    await fetchDocPage('https://docs.powertools.aws.dev/lambda/python/latest/core/logger/');
    
    // Verify that createHash was called to generate a content hash
    expect(createHash).toHaveBeenCalledWith('md5');
    
    // Verify that the cache key includes the mock content hash
    expect(cacache.put).toHaveBeenCalledWith(
      path.join(cacheConfig.basePath, 'markdown-cache'),
      'python/latest/core/logger-mock-content-hash',
      expect.any(String)
    );
  });

  it('should clear both HTML and markdown caches when clearDocCache is called', async () => {
    // Call the function
    await clearDocCache();
    
    // Verify that both caches were cleared
    expect(mockClearCache).toHaveBeenCalledTimes(1);
    expect(mockClearCache).toHaveBeenCalledWith(ContentType.WEB_PAGE);
    expect(cacache.rm.all).toHaveBeenCalledWith(
      path.join(cacheConfig.basePath, 'markdown-cache')
    );
  });
});
