import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import {
  CallToolResultSchema,
  ListToolsResultSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { beforeEach, describe, expect, it } from 'vitest';
import { POWERTOOLS_BASE_URL } from '../../src/constants.ts';
import { createServer } from '../../src/server.ts';

describe('MCP Server e2e (sdk)', () => {
  let server: ReturnType<typeof createServer>;
  let client: Client;
  let clientTransport: ReturnType<typeof InMemoryTransport.createLinkedPair>[0];
  let serverTransport: ReturnType<typeof InMemoryTransport.createLinkedPair>[1];

  beforeEach(async () => {
    server = createServer();

    client = new Client({ name: 'test client', version: '1.0' });
    [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();

    await Promise.all([
      server.connect(serverTransport),
      client.connect(clientTransport),
    ]);
  });

  it('returns the list of tools available', async () => {
    // Act
    const response = await client.request(
      { method: 'tools/list', params: {} },
      ListToolsResultSchema
    );

    // Assess
    expect(Array.isArray(response.tools)).toBe(true);
    expect(response.tools[0].name).toBe('search_docs');
    expect(response.tools[1].name).toBe('fetch_doc_page');
  });

  it('uses the search tool', async () => {
    // Act
    const response = await client.request(
      {
        method: 'tools/call',
        params: {
          name: 'search_docs',
          arguments: {
            search: 'metrics',
            runtime: 'typescript',
            version: 'latest',
          },
        },
      },
      CallToolResultSchema
    );

    // Assess
    expect(response.content[0].type).toBe('text');
    expect(response.content[0].text).toBeDefined();
    expect(response.content).toHaveNthResultWith(1, {
      title: 'features/metrics/',
      score: expect.any(Number),
      url: expect.stringContaining(
        `${POWERTOOLS_BASE_URL}/typescript/latest/features/metrics/`
      ),
    });
  });

  it('uses the fetch_doc_page tool', async () => {
    // Act
    const response = await client.request(
      {
        method: 'tools/call',
        params: {
          name: 'fetch_doc_page',
          arguments: {
            url: `${POWERTOOLS_BASE_URL}/typescript/latest/features/metrics/`,
          },
        },
      },
      CallToolResultSchema
    );

    // Assess
    expect(response.content[0].type).toBe('text');
    expect(response.content[0].text).toContain('Metrics');
  });
});
