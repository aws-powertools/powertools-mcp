import { logger } from './logger.ts';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { server } from './server.ts';

async function main() {
  const transport = new StdioServerTransport();
  logger.info('starting Powertools MCP Server');
  await server.connect(transport);
  logger.info('Powertools Documentation MCP Server running on stdio');
}

main().catch((error) => {
  logger.error('Fatal error in main()', { error });
  process.exit(1);
});
