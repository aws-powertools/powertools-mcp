import { logger } from './logger.ts';
import { fetchDocPage } from './docFetcher.ts';
import { searchDocuments, SearchIndexFactory } from './searchIndex.ts';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { POWERTOOLS_BASE_URL, runtimes } from './constants.ts';

const searchIndexes = new SearchIndexFactory();

const searchDocsSchema = z.object({
  search: z.string().describe('what to search for'),
  runtime: z.enum(runtimes).describe('the runtime index to search'),
  version: z
    .string()
    .optional()
    .describe('version is always semantic 3 digit in the form x.y.z'),
});

const fetchDocSchema = z.object({
  url: z.string().url(),
});

const listTools = async () => ({
  tools: [
    {
      name: 'search_docs',
      description:
        'Search Powertools for AWS Lambda documentation to learn about Serverless best practices. ' +
        "Try searching for features like 'Logger', 'Tracer', 'Metrics', 'Idempotency', 'batchProcessor', event handler, etc. " +
        'Powertools is available for the following runtimes: python, typescript, java, dotnet. ' +
        'When searching, always specify the version of Powertools you are interested in, if unsure, try to read it from the workspace configuration, otherwise use "latest".',
      inputSchema: {
        type: 'object',
        properties: {
          search: {
            type: 'string',
            description: 'what to search for',
          },
          runtime: {
            type: 'string',
            enum: runtimes,
            description: 'the runtime index to search',
          },
          version: {
            type: 'string',
            description: 'version is always semantic 3 digit in the form x.y.z',
          },
        },
        required: ['search', 'runtime'],
        additionalProperties: false,
        $schema: 'http://json-schema.org/draft-07/schema#',
      },
    },
    {
      name: 'fetch_doc_page',
      description:
        'Fetches the content of a Powertools documentation page and returns it as markdown.' +
        'Use this after finding relevant pages with search_docs to get detailed information.',
      inputSchema: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            format: 'uri',
          },
        },
        required: ['url'],
        additionalProperties: false,
        $schema: 'http://json-schema.org/draft-07/schema#',
      },
    },
  ],
});

const toolCall = async (request: {
  params: { name: string; arguments?: unknown };
}) => {
  try {
    const { name, arguments: args } = request.params;
    logger.info(`Tool request: ${name}`, { tool: name, args });

    switch (name) {
      case 'search_docs': {
        const parsed = searchDocsSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(`Invalid arguments for search_docs: ${parsed.error}`);
        }
        const search = parsed.data.search.trim();
        const runtime = parsed.data.runtime.trim().toLowerCase();
        const version = parsed.data.version?.trim().toLowerCase() || 'latest';

        // First, check if the version is valid
        const versionInfo = await searchIndexes.resolveVersion(
          runtime,
          version
        );
        if (!versionInfo.valid) {
          // Return an error with available versions
          const availableVersions =
            versionInfo.available?.map((v) => v.version) || [];

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  error: `Invalid version: ${version} for runtime: ${runtime}`,
                  availableVersions,
                }),
              },
            ],
            isError: true,
          };
        }

        // do the search
        const idx = await searchIndexes.getIndex(runtime, version);
        if (!idx) {
          // If we get here, it's likely an invalid runtime since version validation already happened
          logger.warn(`Invalid runtime: ${runtime}`);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  error: `Invalid runtime: ${runtime}`,
                  availableRuntimes: runtimes,
                }),
              },
            ],
            isError: true,
          };
        }
        if (!idx.index || !idx.documents) {
          logger.warn(
            `Invalid index for runtime: ${runtime}, version: ${version}`
          );
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  error: `Failed to load index for runtime: ${runtime}, version: ${version}`,
                  suggestion:
                    "Try using 'latest' version or check network connectivity",
                }),
              },
            ],
            isError: true,
          };
        }

        // Use the searchDocuments function to get enhanced results
        logger.info(
          `Searching for "${search}" in ${runtime} ${version} (resolved to ${idx.version})`
        );
        const results = searchDocuments(idx.index, idx.documents, search);
        logger.info(`Search results for "${search}" in ${runtime}`, {
          results: results.length,
        });

        // Format results for better readability
        const formattedResults = results.map((result) => {
          // Python and TypeScript include version in URL, Java and .NET don't
          let url: string;
          if (runtime === 'python' || runtime === 'typescript') {
            url = `${POWERTOOLS_BASE_URL}/${runtime}/${idx.version}/${result.ref}`;
          } else {
            // For Java and .NET, no version in URL
            url = `${POWERTOOLS_BASE_URL}/${runtime}/${result.ref}`;
          }

          return {
            title: result.title,
            url,
            score: result.score,
            snippet: result.snippet, // Use the pre-truncated snippet
          };
        });

        return {
          content: [{ type: 'text', text: JSON.stringify(formattedResults) }],
        };
      }

      case 'fetch_doc_page': {
        const parsed = fetchDocSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(
            `Invalid arguments for fetch_doc_page: ${parsed.error}`
          );
        }
        const url = parsed.data.url;

        // Fetch the documentation page
        logger.info('Fetching documentation page', { url });
        const markdown = await fetchDocPage(url);
        logger.debug('Fetched documentation page', {
          contentLength: markdown.length,
        });

        return {
          content: [{ type: 'text', text: markdown }],
        };
      }

      // default error case - tool not known
      default:
        logger.warn('Unknown tool requested', { tool: name });
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error('Error handling tool request', { error });
    return {
      content: [{ type: 'text', text: `Error: ${errorMessage}` }],
      isError: true,
    };
  }
};

const server = new Server(
  {
    name: 'powertools-mcp-server',
    version: '0.6.0', // TODO: synchronize this with package.json version
  },
  {
    capabilities: {
      tools: {}, // TODO: why are the tools not here?
    },
  }
);
server.setRequestHandler(ListToolsRequestSchema, listTools);
server.setRequestHandler(CallToolRequestSchema, toolCall);

export { server, listTools, toolCall };
