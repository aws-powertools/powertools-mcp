import { it, expect, beforeEach, vi } from 'vitest';
import { listTools } from '../../src/server.ts';

beforeEach(() => {
  vi.clearAllMocks();
});

it('lists the available tools', async () => {
  // Act
  const response = await listTools();

  // Assess
  expect(response.tools).toHaveLength(2);
  expect(response.tools[0].name).toBe('search_docs');
  expect(response.tools[1].name).toBe('fetch_doc_page');
});
