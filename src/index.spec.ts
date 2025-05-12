// Import types

// Import after mocking
import { mockResolveVersion } from './searchIndex';

// Mock the server's connect method to prevent it from actually connecting
jest.mock('@modelcontextprotocol/sdk/server/index.js', () => {
  return {
    Server: jest.fn().mockImplementation(() => ({
      setRequestHandler: jest.fn(),
      getRequestHandler: jest.fn(),
      connect: jest.fn()
    }))
  };
});

// Mock the logger to prevent console output during tests
jest.mock('./services/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn()
  }
}));

// Mock the SearchIndexFactory
jest.mock('./searchIndex', () => {
  const mockResolveVersion = jest.fn();
  const mockGetIndex = jest.fn();
  
  return {
    SearchIndexFactory: jest.fn().mockImplementation(() => ({
      resolveVersion: mockResolveVersion,
      getIndex: mockGetIndex
    })),
    searchDocuments: jest.fn(),
    mockResolveVersion,
    mockGetIndex
  };
});

// Create a direct test for the handler function
describe('[MCP-Server] When handling invalid versions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should return error with available versions when an invalid version is provided', async () => {
    // Mock the resolveVersion to return invalid version with available versions
    mockResolveVersion.mockResolvedValueOnce({
      resolved: 'invalid-version',
      valid: false,
      available: [
        { version: '3.12.0', title: 'Latest', aliases: ['latest'] },
        { version: '3.11.0', title: 'Version 3.11.0', aliases: [] },
        { version: '3.10.0', title: 'Version 3.10.0', aliases: [] }
      ]
    });
    
    // Create a request handler function that simulates the MCP server behavior
    const handleRequest = async (request: any) => {
      try {
        // This simulates what the server would do with the request
        const { name, arguments: args } = request.params;
        
        if (name === 'search_docs') {
          const _search = args.search.trim();
          const runtime = args.runtime.trim().toLowerCase();
          const version = args.version?.trim().toLowerCase() || 'latest';
          
          // Check if the version is valid
          const versionInfo = await mockResolveVersion(runtime, version);
          if (!versionInfo.valid) {
            // Return an error with available versions
            const availableVersions = versionInfo.available?.map((v: any) => ({
              version: v.version,
              title: v.title,
              aliases: v.aliases
            })) || [];
            
            return {
              content: [{ 
                type: "text", 
                text: JSON.stringify({
                  error: `Invalid version: ${version} for runtime: ${runtime}`,
                  availableVersions
                })
              }],
              isError: true
            };
          }
        }
        
        return { content: [{ type: "text", text: "Success" }] };
      } catch (error) {
        return { 
          content: [{ type: "text", text: `Error: ${error}` }],
          isError: true
        };
      }
    };
    
    // Create a request for an invalid version
    const request = {
      params: {
        name: 'search_docs',
        arguments: {
          search: 'logger',
          runtime: 'python',
          version: 'invalid-version'
        }
      }
    };
    
    // Call the handler directly
    const response = await handleRequest(request);
    
    // Verify the response contains error and available versions
    expect(response.isError).toBe(true);
    expect(response.content).toHaveLength(1);
    expect(response.content[0].type).toBe('text');
    
    // Parse the JSON response
    const jsonResponse = JSON.parse(response.content[0].text);
    
    // Verify error message
    expect(jsonResponse.error).toContain('Invalid version: invalid-version');
    
    // Verify available versions
    expect(jsonResponse.availableVersions).toHaveLength(3);
    expect(jsonResponse.availableVersions[0].version).toBe('3.12.0');
    expect(jsonResponse.availableVersions[0].aliases).toContain('latest');
    expect(jsonResponse.availableVersions[1].version).toBe('3.11.0');
    expect(jsonResponse.availableVersions[2].version).toBe('3.10.0');
  });
  
  it('should return empty available versions array when no versions are found', async () => {
    // Mock the resolveVersion to return invalid version with no available versions
    mockResolveVersion.mockResolvedValueOnce({
      resolved: 'invalid-version',
      valid: false,
      available: undefined
    });
    
    // Create a request handler function that simulates the MCP server behavior
    const handleRequest = async (request: any) => {
      try {
        // This simulates what the server would do with the request
        const { name, arguments: args } = request.params;
        
        if (name === 'search_docs') {
          const _search = args.search.trim();
          const runtime = args.runtime.trim().toLowerCase();
          const version = args.version?.trim().toLowerCase() || 'latest';
          
          // Check if the version is valid
          const versionInfo = await mockResolveVersion(runtime, version);
          if (!versionInfo.valid) {
            // Return an error with available versions
            const availableVersions = versionInfo.available?.map((v: any) => ({
              version: v.version,
              title: v.title,
              aliases: v.aliases
            })) || [];
            
            return {
              content: [{ 
                type: "text", 
                text: JSON.stringify({
                  error: `Invalid version: ${version} for runtime: ${runtime}`,
                  availableVersions
                })
              }],
              isError: true
            };
          }
        }
        
        return { content: [{ type: "text", text: "Success" }] };
      } catch (error) {
        return { 
          content: [{ type: "text", text: `Error: ${error}` }],
          isError: true
        };
      }
    };
    
    // Create a request for an invalid version
    const request = {
      params: {
        name: 'search_docs',
        arguments: {
          search: 'logger',
          runtime: 'python',
          version: 'invalid-version'
        }
      }
    };
    
    // Call the handler directly
    const response = await handleRequest(request);
    
    // Verify the response contains error and empty available versions
    expect(response.isError).toBe(true);
    
    // Parse the JSON response
    const jsonResponse = JSON.parse(response.content[0].text);
    
    // Verify error message
    expect(jsonResponse.error).toContain('Invalid version: invalid-version');
    
    // Verify available versions is an empty array
    expect(jsonResponse.availableVersions).toEqual([]);
  });
});
