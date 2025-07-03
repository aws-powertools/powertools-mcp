#!/usr/bin/env node

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { logger } from './logger.ts';
import { createServer } from './server.ts';

async function main() {
  const transport = new StdioServerTransport();
  logger.info('starting Powertools MCP Server');
  const server = createServer();
  await server.connect(transport);
  logger.info('Powertools MCP Server running on stdio');
}

main().catch((error) => {
  logger.error('Powertools MCP Fatal Error', { error });
  process.exit(1);
});
