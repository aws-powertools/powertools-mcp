import { beforeEach, expect, it, vi } from 'vitest';
import { createServer } from '../../src/server.ts';

beforeEach(() => {
  vi.clearAllMocks();
});

it('creates a server instance', () => {
  // Act
  const server = createServer();

  // Assess
  expect(server).toBeDefined();
});
