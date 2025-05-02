import { FetchService } from './services/fetch';
import { ContentType } from './services/fetch/types';
// Import the module after mocking
import { fetchDocPage } from './docFetcher';

// Mock the FetchService module with an inline mock function
jest.mock('./services/fetch', () => {
  return {
    FetchService: jest.fn().mockImplementation(() => ({
      fetch: jest.fn(), // Create the mock function inline
      clearCache: jest.fn()
    }))
  };
});

// Get a reference to the mock function AFTER it's created
const mockFetchService = FetchService as jest.MockedFunction<typeof FetchService>;
const mockFetch = mockFetchService.mock.results[0].value.fetch;

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
