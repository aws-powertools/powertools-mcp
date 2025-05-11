import { logger } from "./services/logger/index";
import { fetchDocPage } from "./docFetcher";
import { searchDocuments,SearchIndexFactory } from "./searchIndex";

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ToolSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from 'zod';
import { zodToJsonSchema } from "zod-to-json-schema";

const _ToolInputSchema = ToolSchema.shape.inputSchema;
type ToolInput = z.infer<typeof _ToolInputSchema>;

// Class managing the Search indexes for searching
const searchIndexes = new SearchIndexFactory();

const searchDocsSchema = z.object({
  search: z.string(),
  runtime: z.string(), 
  version: z.string().optional(), 
});

const fetchDocSchema = z.object({
  url: z.string().url(),
});

export const server = new Server(
  {
    name: "powertools-mcp-server",
    version: "0.6.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// Set Tools List so LLM can get details on the tools and what they do
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search_docs",
        description: 
          "Perform a search of the Powertools for AWS Lambda documentation index to find web page references online. " +
          "Great for finding more details on Powertools features and functions using text search. " +
          "Try searching for features like 'Logger', 'Tracer', 'Metrics', 'Idempotency', 'batchProcessor', etc. " +
          "Powertools is available for the following runtimes: python, typescript, java, dotnet. " +
          "If a specific version is not mentioned the search service will use the latest documentation.",
        inputSchema: zodToJsonSchema(searchDocsSchema) as ToolInput,
      },
      {
        name: "fetch_doc_page",
        description:
          "Fetches the content of a Powertools documentation page and returns it as markdown. " +
          "This allows you to read the full documentation for a specific feature or function. " +
          "You MUST use the url returned form the search_docs tool since this will be the page to load." +
          "The URL must be from the docs.powertools.aws.dev domain. " +
          "Use this after finding relevant pages with search_docs to get detailed information.",
        inputSchema: zodToJsonSchema(fetchDocSchema) as ToolInput,
      }
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;
    logger.info(`Tool request: ${name}`, { tool: name, args });

    switch(name) {
      case "search_docs": {
        const parsed = searchDocsSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(`Invalid arguments for search_docs: ${parsed.error}`);
        }
        const search = parsed.data.search.trim();
        const runtime = parsed.data.runtime.trim().toLowerCase();
        const version = parsed.data.version?.trim().toLowerCase() || 'latest';

      
        // do the search
        const idx = await searchIndexes.getIndex(runtime, version);
        if (!idx) {
          throw new Error(`Invalid runtime: ${runtime}`);
        }
        if (!idx.index || !idx.documents) {
          throw new Error(`Invalid index: ${runtime}`);
        }
        
        // Use the searchDocuments function to get enhanced results
        const results = searchDocuments(idx.index, idx.documents, search);
        logger.debug(`Search results for "${search}" in ${runtime}`, { results: results.length });
        
        // Format results for better readability
        const formattedResults = results.map(result => {
          // Python and TypeScript include version in URL, Java and .NET don't
          let url;
          if (runtime === 'python' || runtime === 'typescript') {
            url = `https://docs.powertools.aws.dev/lambda/${runtime}/${version}/${result.ref}`;
          } else {
            // For Java and .NET, no version in URL
            url = `https://docs.powertools.aws.dev/lambda/${runtime}/${result.ref}`;
          }
          
          return {
            title: result.title,
            url,
            score: result.score,
            snippet: result.snippet // Use the pre-truncated snippet
          };
        });
        
        return {
          content: [{ type: "text", text: JSON.stringify(formattedResults)}]
        }
      }

      case "fetch_doc_page": {
        const parsed = fetchDocSchema.safeParse(args);
        if (!parsed.success) {
          throw new Error(`Invalid arguments for fetch_doc_page: ${parsed.error}`);
        }
        const url = parsed.data.url;
        
        // Fetch the documentation page
        logger.info(`Fetching documentation page`, { url });
        const markdown = await fetchDocPage(url);
        logger.debug(`Fetched documentation page`, { contentLength: markdown.length });
        
        return {
          content: [{ type: "text", text: markdown }]
        }
      }

      // default error case - tool not known
      default:
        logger.warn(`Unknown tool requested`, { tool: name });
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const theError = error instanceof Error ? error : new Error(errorMessage)
    logger.error(`Error handling tool request`, { error: theError });
    return {
      content: [{ type: "text", text: `Error: ${errorMessage}` }],
      isError: true,
    };
  }
});

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    logger.info('Powertools Documentation MCP Server running on stdio');
}

main().catch((error) => {
    logger.error("Fatal error in main()", { error });
    process.exit(1);
});
