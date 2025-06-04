# Powertools for AWS MCP Search Server

The Powertools for AWS [Model Context Protocol (MCP)](https://modelcontextprotocol.io/introduction) Search Server is a server that provides search functionality for the Powertools for AWS Lambda documentation across multiple runtimes. It allows your LLM agents to search for documentation and examples related to the toolkit, helping you to quickly find the information you need to use Powertools for AWS Lambda effectively.

## Use Cases

- Bring documentation and examples directly into your LLM agents' context.
- Search for specific topics or keywords within the Powertools for AWS documentation.
- Help your agents understand how to use the Powertools for AWS Lambda toolkit effectively.

## Getting Started

Most clients that support MCP can use this server out of the box using a configuration similar to the following:

```json
{
  "mcpServers": {
    "powertools": {
      "command": "npx",
      "args": [
        "-y",
        "@serverless-dna/powertools-mcp"
      ]
    }
  }
}
```

This setup uses the Node.js package manager to run the MCP server locally and communicate with it using the STDIO interface.

## Development

After cloning the repository, you can set up your development environment by running:

```bash
npm ci
npm run setup:hooks
```

After that you can run tests using `npm t` or `npm run test:unit:coverage` for coverage reports.

You can also run the server locally using: `npm run dev`, this will start an inspector server that lets you interact with the MCP server using a browser UI.

If you want, you can also configure the server to run with Amazon Q, Claude Desktop, or other LLM clients that support the Model Context Protocol (MCP) by using `node` as command and passing the `--experimental-transform-types` flag and the path to the `src/index.ts` file of this project.

For example, with Claude Code, you can add the server by running:

```bash
claude mcp add pt-dev node -- --experimental-transform-types /path/to/project/powertools-mcp/src/index.ts
```

## Credits

[Michael Walmsley](https://www.linkedin.com/in/walmsles/) at [ServerlessDNA.com](https://serverlessdna.com) for creating the initial implementation of this MCP server and donating it to the Powertools for AWS team at Amazon Web Services.

## License

This library is licensed under the MIT License. See the [LICENSE](https://github.com/aws-powertools/powertools-mcp/blob/main/LICENSE) file.
