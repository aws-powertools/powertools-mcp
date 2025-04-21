# Powertools MCP Search Server

A Model Context Protocol (MCP) server that provides search functionality for AWS Lambda Powertools documentation across multiple runtimes.

## Overview

This project implements an MCP server that enables Large Language Models (LLMs) to search through AWS Lambda Powertools documentation. It uses lunr.js for efficient local search capabilities and provides results that can be summarized and presented to users.

## Features

- MCP-compliant server for integration with LLMs
- Local search using lunr.js indexes
- Support for multiple runtimes:
  - Python
  - TypeScript
  - Java
  - .NET
- Version-specific documentation search (defaults to latest)

## Installation

```bash
# Install dependencies
pnpm install

# Build the project
pnpm build
```

## Usage

The server can be run as an MCP server that communicates over stdio:

```bash
node dist/bundle.js
```

### Search Tool

The server provides a `search_docs` tool with the following parameters:

- `search`: The search query string
- `runtime`: The Powertools runtime to search (python, typescript, java, dotnet)
- `version`: Optional version string (defaults to 'latest')

## Development

### Project Structure

- `src/`: Source code
  - `index.ts`: Main server implementation
  - `searchIndex.ts`: Search index management
- `indexes/`: Pre-built lunr.js search indexes for each runtime
- `dist/`: Compiled output

### Building

```bash
pnpm build
```

### Testing

```bash
pnpm test
```

## How It Works

1. The server loads pre-built lunr.js indexes for each supported runtime
2. When a search request is received, it:
   - Loads the appropriate index based on runtime and version
   - Performs the search using lunr.js
   - Returns the search results as JSON
3. The LLM can then use these results to find relevant documentation pages

## License

ISC
