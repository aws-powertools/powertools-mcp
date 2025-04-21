import { fetchDocPage } from './docFetcher';

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

// Mock fetch for testing
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.Mock;

// Mock console.error to avoid cluttering test output
beforeEach(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe('[DocFetcher] When validating URLs', () => {
  beforeEach(() => {
    mockFetch.mockClear();
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
    
    // Mock a successful response with minimal content
    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: {
        getReader: () => ({
          read: jest.fn()
            .mockResolvedValueOnce({ 
              done: false, 
              value: new TextEncoder().encode('<html><body><h1>Test</h1></body></html>') 
            })
            .mockResolvedValueOnce({ done: true })
        })
      }
    });
    
    // Execute
    await fetchDocPage(validUrl);
    
    // Verify
    expect(mockFetch).toHaveBeenCalledWith(validUrl, expect.anything());
  });
});

describe('[DocFetcher] Performance measurements', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('should measure performance for fetching documentation', async () => {
    // Setup
    const url = 'https://docs.powertools.aws.dev/lambda/python/latest/';
    
    // Mock a successful response with minimal content
    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: {
        getReader: () => ({
          read: jest.fn()
            .mockResolvedValueOnce({ 
              done: false, 
              value: new TextEncoder().encode('<html><body><h1>Test Document</h1><p>Content</p></body></html>') 
            })
            .mockResolvedValueOnce({ done: true })
        })
      }
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
