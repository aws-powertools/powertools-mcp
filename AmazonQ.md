# Using Powertools MCP Search Server with Amazon Q

This guide explains how to integrate the Powertools MCP Search Server with Amazon Q to enhance documentation search capabilities.

## Prerequisites

- Amazon Q Developer subscription
- Powertools MCP Search Server installed and built

## Integration Steps

### 1. Configure Amazon Q to use the MCP Server

Amazon Q can be configured to use external tools through the Model Context Protocol. To set up the Powertools MCP Search Server:

```bash
# Start the MCP server
node dist/bundle.js
```

### 2. Using the Search Tool in Amazon Q

Once integrated, you can use the search functionality in your conversations with Amazon Q:

Example prompts:
- "Search the Python Powertools documentation for logger"
- "Find information about idempotency in TypeScript Powertools"
- "Look up batch processing in Java Powertools"

### 3. Understanding Search Results

The search results will be returned in JSON format containing:
- `ref`: The reference to the documentation page
- `score`: The relevance score of the result
- `matchData`: Information about which terms matched

Amazon Q can interpret these results and provide summaries or direct links to the relevant documentation.

## Troubleshooting

If you encounter issues with the integration:

1. Ensure the MCP server is running correctly
2. Check that the search indexes are properly loaded
3. Verify the runtime parameter is one of: python, typescript, java, dotnet

## Example Workflow

1. User asks Amazon Q about a Powertools feature
2. Amazon Q uses the `search_docs` tool to find relevant documentation
3. Amazon Q summarizes the information from the documentation
4. User gets accurate, up-to-date information about Powertools features
