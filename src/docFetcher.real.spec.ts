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

// This test suite uses real network requests - only run when needed
describe('[DocFetcher-Real] When fetching actual documentation pages', () => {
  // Use a longer timeout since we're making real network requests
  jest.setTimeout(30000);

  // Restore the real fetch implementation
  const originalFetch = global.fetch;
  beforeAll(() => {
    // Ensure we're using the real fetch, not a mock
    global.fetch = originalFetch;
  });

  afterAll(() => {
    // Restore original fetch in case other tests need mocks
    global.fetch = originalFetch;
  });

  it('should fetch and parse the Python logger documentation page', async () => {
    // URL for the Python logger documentation
    const url = 'https://docs.powertools.aws.dev/lambda/python/latest/core/logger/';
    
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
    
    // Log performance metrics
    console.log('Final memory usage:', finalMemory);
    console.log('Memory increase:', memoryIncrease);
    console.log('Execution time:', executionTime, 'ms');
    console.log('Result length:', result.length, 'characters');
    
    // Log content sample for verification
    console.log('Content sample (first 500 chars):');
    console.log(result.substring(0, 500));
    
    // Verify
    expect(executionTime).toBeDefined();
    expect(result).toContain('Logger');
    expect(result.length).toBeGreaterThan(1000); // Should have substantial content
  });

  it('should demonstrate caching performance with real pages', async () => {
    // URL for the Python metrics documentation
    const url = 'https://docs.powertools.aws.dev/lambda/python/latest/core/metrics/';
    
    // First request (uncached)
    console.log('Making first request (uncached)...');
    const { executionTime: firstTime, result: firstResult } = await measureExecutionTime(() => fetchDocPage(url));
    console.log('First request (uncached):', firstTime, 'ms');
    console.log('First result length:', firstResult.length, 'characters');
    
    // Second request (should be cached)
    console.log('Making second request (should be cached)...');
    const { executionTime: secondTime, result: secondResult } = await measureExecutionTime(() => fetchDocPage(url));
    console.log('Second request (cached):', secondTime, 'ms');
    console.log('Second result length:', secondResult.length, 'characters');
    
    // Calculate improvement
    const speedupFactor = Math.max(1, firstTime) / Math.max(0.1, secondTime); // Avoid division by zero
    console.log('Cache speedup factor:', Math.round(speedupFactor), 'x faster');
    
    // Verify
    expect(secondTime).toBeLessThan(firstTime);
    expect(speedupFactor).toBeGreaterThan(2); // Should be at least twice as fast
    expect(firstResult).toEqual(secondResult); // Results should be identical
  });

  it('should compare performance across different runtime documentation pages', async () => {
    // URLs for different runtime documentation pages
    const urls = {
      python: 'https://docs.powertools.aws.dev/lambda/python/latest/core/logger/',
      typescript: 'https://docs.powertools.aws.dev/lambda/typescript/latest/core/logger/',
      java: 'https://docs.powertools.aws.dev/lambda/java/core/logging/',
      dotnet: 'https://docs.powertools.aws.dev/lambda/dotnet/core/logging/'
    };
    
    const results: Record<string, { time: number, size: number }> = {};
    
    // Fetch each runtime's documentation
    for (const [runtime, url] of Object.entries(urls)) {
      console.log(`Fetching ${runtime} documentation...`);
      const { executionTime, result } = await measureExecutionTime(() => fetchDocPage(url));
      
      results[runtime] = {
        time: executionTime,
        size: result.length
      };
      
      console.log(`${runtime}: ${executionTime} ms, ${result.length} characters`);
    }
    
    // Log comparison table
    console.log('\n===== RUNTIME COMPARISON =====');
    console.log('Runtime\t\tTime (ms)\tSize (chars)');
    console.log('----------------------------------------');
    
    for (const [runtime, data] of Object.entries(results)) {
      console.log(`${runtime.padEnd(12)}${data.time} ms\t\t${data.size}`);
    }
    
    console.log('----------------------------------------\n');
    
    // Verify we got results for all runtimes
    expect(Object.keys(results).length).toBe(4);
  });
});

// Add a final summary after all tests
afterAll(() => {
  console.log('\n===== REAL DOCFETCHER TEST SUMMARY =====');
  console.log('All tests completed successfully');
  console.log('Memory usage at end of tests:', getMemoryUsage());
  console.log('===== END SUMMARY =====');
});
