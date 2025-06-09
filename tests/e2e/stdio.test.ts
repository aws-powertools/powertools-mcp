import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { StdioServer } from '../e2e/helpers.ts';

describe('MCP Server e2e (child process)', () => {
  const server = new StdioServer({
    args:
      process.env.BUILT_OUTPUT === 'true'
        ? ['dist/index.js']
        : ['--experimental-transform-types', 'src/index.ts'],
  });

  beforeAll(async () => {
    await server.start();
  });

  afterAll(() => {
    server.stop();
  });

  it('returns the list of tools available', async () => {
    // Act
    const response = await server.sendRequest<{ tools: { name: string }[] }>({
      id: 1,
      method: 'tools/list',
    });

    // Assess
    expect(Array.isArray(response.tools)).toBe(true);
    expect(response.tools[0].name).toBe('search_docs');
    expect(response.tools[1].name).toBe('fetch_doc_page');
  });

  it('uses the search tool', async () => {
    // Act
    const response = await server.sendRequest<{
      content: { text: string; type: 'text' }[];
    }>({
      id: 2,
      method: 'tools/call',
      params: {
        name: 'search_docs',
        arguments: {
          search: 'metrics',
          runtime: 'typescript',
          version: 'latest',
        },
      },
    });

    // Assess
    expect(response.content[0].type).toBe('text');
    expect(response.content[0].text).toBeDefined();
    const parsedText = JSON.parse(response.content[0].text);
    expect(parsedText).toBeInstanceOf(Array);
    expect(parsedText.length).toBeGreaterThan(0);
    expect(parsedText[0]).toHaveProperty('title');
    expect(parsedText[0]).toHaveProperty('url');
  });

  it('uses the fetch_doc_page tool', async () => {
    // Act
    const response = await server.sendRequest<{
      content: { text: string; type: 'text' }[];
    }>({
      id: 3,
      method: 'tools/call',
      params: {
        name: 'fetch_doc_page',
        arguments: {
          url: 'https://docs.powertools.aws.dev/lambda/typescript/latest/features/metrics/',
        },
      },
    });

    // Assess
    expect(response.content[0].type).toBe('text');
    expect(response.content[0].text).toContain('# Metrics');
  });
});
