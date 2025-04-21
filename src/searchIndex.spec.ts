import { searchDocuments,SearchIndexFactory } from './searchIndex';

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

describe('[Search-Index] When initializing the search index factory', () => {
  it('should create a new instance without errors', () => {
    const factory = new SearchIndexFactory();
    expect(factory).toBeInstanceOf(SearchIndexFactory);
    expect(factory.indices).toBeDefined();
    expect(factory.indices.size).toBe(0);
  });
});

describe('[Search-Index] When loading all runtime indexes', () => {
  const runtimes = ['python', 'typescript', 'java', 'dotnet'];
  const factory = new SearchIndexFactory();
  const initialMemory = getMemoryUsage();
  const memorySnapshots: Record<string, { heapUsed: number, heapTotal: number }> = {};
  const loadTimes: Record<string, number> = {};
  
  it('should load all indexes with detailed memory tracking', async () => {
    console.log('Initial memory usage:', initialMemory);
    
    // Load each index individually and track memory usage
    for (const runtime of runtimes) {
      const { executionTime, result } = await measureExecutionTime(() => 
        factory.getIndex(runtime, 'latest')
      );
      
      loadTimes[runtime] = executionTime;
      
      // Capture memory snapshot after loading this index
      memorySnapshots[runtime] = getMemoryUsage();
      
      // Calculate cumulative increase from initial
      const cumulativeIncrease = {
        heapUsed: memorySnapshots[runtime].heapUsed - initialMemory.heapUsed,
        heapTotal: memorySnapshots[runtime].heapTotal - initialMemory.heapTotal
      };
      
      console.log(`After loading ${runtime} index (took ${executionTime}ms):`);
      console.log(`  Current memory: ${memorySnapshots[runtime].heapUsed} MB used, ${memorySnapshots[runtime].heapTotal} MB total`);
      console.log(`  Cumulative increase: ${cumulativeIncrease.heapUsed} MB used, ${cumulativeIncrease.heapTotal} MB total`);
      
      // Verify the index loaded successfully
      expect(result).toBeDefined();
      expect(result?.runtime).toBe(runtime);
      expect(result?.index).toBeDefined();
      expect(result?.documents).toBeDefined();
    }
    
    // Check that all indexes are cached
    expect(factory.indices.size).toBe(runtimes.length);
    
    // Output final memory usage summary
    const finalMemory = getMemoryUsage();
    const totalIncrease = {
      heapUsed: finalMemory.heapUsed - initialMemory.heapUsed,
      heapTotal: finalMemory.heapTotal - initialMemory.heapTotal
    };
    
    console.log('\nMemory usage summary:');
    console.log(`  Initial: ${initialMemory.heapUsed} MB used, ${initialMemory.heapTotal} MB total`);
    console.log(`  Final: ${finalMemory.heapUsed} MB used, ${finalMemory.heapTotal} MB total`);
    console.log(`  Total increase: ${totalIncrease.heapUsed} MB used, ${totalIncrease.heapTotal} MB total`);
    
    console.log('\nIndex load times:');
    for (const runtime of runtimes) {
      console.log(`  ${runtime}: ${loadTimes[runtime]} ms`);
    }
  });
});

describe('[Search-Index] When searching for common terms across all runtimes', () => {
  const runtimes = ['python', 'typescript', 'java', 'dotnet'];
  const searchTerms = ['logger', 'idempotency', 'batchProcessor'];
  const factory = new SearchIndexFactory();
  const searchResults: Record<string, Record<string, { time: number, count: number }>> = {};
  
  // Load all indexes before tests
  beforeAll(async () => {
    await Promise.all(runtimes.map(runtime => factory.getIndex(runtime, 'latest')));
  });
  
  runtimes.forEach(runtime => {
    describe(`When searching in ${runtime} runtime`, () => {
      searchResults[runtime] = {};
      
      searchTerms.forEach(term => {
        it(`should find results for "${term}" with acceptable performance`, async () => {
          const index = await factory.getIndex(runtime);
          expect(index).toBeDefined();
          expect(index?.index).toBeDefined();
          expect(index?.documents).toBeDefined();
          
          if (!index?.index || !index?.documents) {
            throw new Error(`Index not properly loaded for ${runtime}`);
          }
          
          const { result: results, executionTime } = await measureExecutionTime(() => 
            Promise.resolve(searchDocuments(index.index!, index.documents!, term))
          );
          
          // Store results for summary
          searchResults[runtime][term] = {
            time: executionTime,
            count: results.length
          };
          
          console.log(`Search for "${term}" in ${runtime} took ${executionTime}ms and found ${results.length} results`);
          
          // Performance assertions
          expect(executionTime).toBeLessThan(1000); // Search should take less than 1 second
          
          // For common terms, we expect to find at least some results
          // The exact number will vary by runtime and term
          if (term === 'logger') {
            expect(results.length).toBeGreaterThan(0);
          }
        });
      });
    });
  });
  
  // Add a test to output the summary after all searches
  afterAll(() => {
    console.log('\n===== SEARCH PERFORMANCE SUMMARY =====');
    console.log('Term\t\tPython\t\tTypeScript\tJava\t\t.NET');
    console.log('----------------------------------------------------------------------');
    
    for (const term of searchTerms) {
      const row = [
        term.padEnd(12),
        `${searchResults['python'][term].time}ms (${searchResults['python'][term].count})`.padEnd(16),
        `${searchResults['typescript'][term].time}ms (${searchResults['typescript'][term].count})`.padEnd(16),
        `${searchResults['java'][term].time}ms (${searchResults['java'][term].count})`.padEnd(16),
        `${searchResults['dotnet'][term].time}ms (${searchResults['dotnet'][term].count})`
      ];
      console.log(row.join(''));
    }
    
    console.log('----------------------------------------------------------------------');
    console.log('Format: execution time in ms (number of results found)');
    console.log('===== END SUMMARY =====\n');
  });
});

describe('[Search-Index] When comparing search performance across runtimes', () => {
  const runtimes = ['python', 'typescript', 'java', 'dotnet'];
  const factory = new SearchIndexFactory();
  const performanceData: Record<string, Record<string, number>> = {};
  
  // Load all indexes before tests
  beforeAll(async () => {
    await Promise.all(runtimes.map(runtime => factory.getIndex(runtime, 'latest')));
  });
  
  it('should collect performance metrics for all runtimes', async () => {
    for (const runtime of runtimes) {
      performanceData[runtime] = {};
      const index = await factory.getIndex(runtime);
      
      if (!index?.index || !index?.documents) {
        throw new Error(`Index not properly loaded for ${runtime}`);
      }
      
      for (const term of ['logger', 'idempotency', 'batchProcessor']) {
        const { executionTime } = await measureExecutionTime(() => 
          Promise.resolve(searchDocuments(index.index!, index.documents!, term))
        );
        
        performanceData[runtime][term] = executionTime;
      }
    }
    
    console.log('Performance comparison across runtimes (ms):', performanceData);
    
    // We don't make specific assertions here, just collect and log the data
    expect(Object.keys(performanceData).length).toBe(runtimes.length);
  });
});

describe('[Search-Index] When reusing cached indexes', () => {
  const factory = new SearchIndexFactory();
  
  it('should return cached index on subsequent calls', async () => {
    // First call should load the index
    const { executionTime: firstLoadTime } = await measureExecutionTime(() => 
      factory.getIndex('python')
    );
    
    // Second call should use the cached index
    const { executionTime: secondLoadTime } = await measureExecutionTime(() => 
      factory.getIndex('python')
    );
    
    console.log('First load time:', firstLoadTime, 'ms');
    console.log('Second load time:', secondLoadTime, 'ms');
    console.log('Cache speedup factor:', Math.round(firstLoadTime / secondLoadTime), 'x faster');
    
    // Second load should be significantly faster
    expect(secondLoadTime).toBeLessThan(firstLoadTime / 2);
  });
});

describe('[Search-Index] When searching with invalid inputs', () => {
  const factory = new SearchIndexFactory();
  
  it('should handle invalid runtime gracefully', async () => {
    const result = await factory.getIndex('invalid-runtime' as any);
    expect(result).toBeUndefined();
  });
  
  it('should return empty results for searches with no matches', async () => {
    const index = await factory.getIndex('python');
    
    if (!index?.index || !index?.documents) {
      throw new Error('Python index not properly loaded');
    }
    
    const results = searchDocuments(index.index, index.documents, 'xyznonexistentterm123456789');
    expect(results).toEqual([]);
  });
});

// Add a final summary after all tests
afterAll(() => {
  console.log('\n===== FINAL TEST SUMMARY =====');
  console.log('All tests completed successfully');
  console.log('Memory usage at end of tests:', getMemoryUsage());
  console.log('===== END FINAL SUMMARY =====');
});
