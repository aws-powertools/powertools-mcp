/**
 * Simplified test approach for docFetcher
 * 
 * This test uses direct mocking of the module's dependencies
 * rather than trying to mock the underlying libraries.
 */

// Mock the modules before importing anything
// Now import the modules
import { fetchService } from './services/fetch';
import { ContentType } from './services/fetch/types';
import { clearDocCache, fetchDocPage } from './docFetcher';

import * as cacache from 'cacache';

jest.mock('./services/fetch', () => ({
  fetchService: {
    fetch: jest.fn(),
    clearCache: jest.fn()
  }
}));

// Mock cacache directly with a simple implementation
jest.mock('cacache', () => ({
  get: jest.fn().mockImplementation(() => Promise.resolve({
    data: Buffer.from('cached content'),
    metadata: {}
  })),
  put: jest.fn().mockResolvedValue(),
  rm: {
    all: jest.fn().mockResolvedValue()
  }
}));

// Mock crypto
jest.mock('crypto', () => ({
  createHash: jest.fn().mockReturnValue({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn().mockReturnValue('mocked-hash')
  })
}));

// Create a simple mock for Headers
class MockHeaders {
  private headers: Record<string, string> = {};
  
  constructor(init?: Record<string, string>) {
    if (init) {
      this.headers = { ...init };
    }
  }
  
  get(name: string): string | null {
    return this.headers[name.toLowerCase()] || null;
  }
  
  has(name: string): boolean {
    return name.toLowerCase() in this.headers;
  }
}

describe('[DocFetcher] When fetching documentation pages', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should fetch a page and convert it to markdown', async () => {
    // Arrange
    const mockHtml = `
      <html>
        <body>
          <div class="md-content" data-md-component="content">
            <h1>Test Heading</h1>
            <p>Test paragraph</p>
          </div>
        </body>
      </html>
    `;
    
    (fetchService.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new MockHeaders({ 'etag': 'abc123' }),
      text: jest.fn().mockResolvedValueOnce(mockHtml)
    });
    
    // Mock cacache.get.info to throw ENOENT (cache miss)
    (cacache.get as any).info = jest.fn().mockRejectedValueOnce(new Error('ENOENT'));
    
    // Act
    const url = 'https://docs.powertools.aws.dev/lambda/python/latest/core/logger/';
    const result = await fetchDocPage(url);
    
    // Assert
    expect(fetchService.fetch).toHaveBeenCalledWith(url, expect.any(Object));
    expect(result).toContain('# Test Heading');
    expect(result).toContain('Test paragraph');
  });
  
  it('should reject invalid URLs', async () => {
    // Act
    const url = 'https://example.com/not-allowed';
    const result = await fetchDocPage(url);
    
    // Assert
    expect(fetchService.fetch).not.toHaveBeenCalled();
    expect(result).toContain('Error fetching documentation');
    expect(result).toContain('Invalid URL');
  });
  
  it('should handle fetch errors gracefully', async () => {
    // Arrange
    (fetchService.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));
    
    // Act
    const url = 'https://docs.powertools.aws.dev/lambda/python/latest/core/logger/';
    const result = await fetchDocPage(url);
    
    // Assert
    expect(result).toContain('Error fetching documentation');
    expect(result).toContain('Network error');
  });
  
  it('should handle non-200 responses gracefully', async () => {
    // Arrange
    (fetchService.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      headers: new MockHeaders()
    });
    
    // Act
    const url = 'https://docs.powertools.aws.dev/lambda/python/latest/core/nonexistent/';
    const result = await fetchDocPage(url);
    
    // Assert
    expect(result).toContain('Error fetching documentation');
    expect(result).toContain('Failed to fetch page: 404 Not Found');
  });
});

describe('[DocFetcher] When clearing the cache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should clear both web page and markdown caches', async () => {
    // Act
    await clearDocCache();
    
    // Assert
    expect(fetchService.clearCache).toHaveBeenCalledWith(ContentType.WEB_PAGE);
    expect(cacache.rm.all).toHaveBeenCalledWith(expect.stringContaining('markdown-cache'));
  });
});
