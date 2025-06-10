import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { MCP_SERVER_NAME as name } from './constants.ts';
import {
  tool as fetchDocPage,
  description as fetchDocPageDescription,
  schema as fetchDocPageInputSchema,
  name as fetchDocPageName,
} from './tools/fetchDocPage/index.ts';
import {
  tool as searchDocs,
  description as searchDocsDescription,
  name as searchDocsName,
  schema as searchDocsSchema,
} from './tools/searchDocs/index.ts';
import { VERSION as version } from './version.ts';

const createServer = () => {
  const server = new McpServer({
    name,
    version,
  });

  server.tool(
    searchDocsName,
    searchDocsDescription,
    searchDocsSchema,
    searchDocs
  );

  server.tool(
    fetchDocPageName,
    fetchDocPageDescription,
    fetchDocPageInputSchema,
    fetchDocPage
  );

  return server;
};

export { createServer };
