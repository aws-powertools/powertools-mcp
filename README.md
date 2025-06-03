<div align="center">
  
### ⚠️ EXPERIMENTAL PROJECT ⚠️
[![Status](https://img.shields.io/badge/Status-Experimental-orange.svg)](https://shields.io/)
[![Stability](https://img.shields.io/badge/Stability-Evolving-yellow.svg)](https://shields.io/)
[![Discord](https://img.shields.io/badge/Discord-Join_Community-7289da.svg)](https://discord.gg/B8zZKbbyET)

**This repository contains experimental code under active development.  
APIs and features may change frequently without notice.**

### 💡 Get Involved!
**We're actively seeking community feedback and feature suggestions.**  
[Join our Discord](https://discord.gg/B8zZKbbyET) | [Open an Issue](https://github.com/aws-powertools/powertools-mcp/issues/new/choose)

---
</div>

# Powertools MCP Search Server

A Model Context Protocol (MCP) server that provides search functionality for AWS Lambda Powertools documentation across multiple runtimes.

## Claude Desktop Quickstart

Follow the installation instructions please follow the [Model Context Protocol Quickstart For Claude Desktop users](https://modelcontextprotocol.io/quickstart/user#mac-os-linux).  You will need to add a section tothe MCP configuration file as follows:

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
npx -y @serverless-dna/powertools-mcp
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

### Claude Desktop MCP Configuration

During development you can run the MCP Server with Claude Desktop using the following configuration.

The configuration below shows running in windows claude desktop while developing using the Windows Subsystem for Linux (WSL).  Mac or Linux environments you can run in a similar way.  

The output is a bundled file which enables Node installed in windows to run the MCP server since all dependencies are bundled.

```json
{
  "mcpServers": {
    "powertools": {
	"command": "node",
	"args": [
	  "\\\\wsl$\\Ubuntu\\home\\walmsles\\dev\\serverless-dna\\powertools-mcp\\dist\\bundle.js"
	]
    }
  }
}
```

## How It Works

1. The server loads pre-built lunr.js indexes for each supported runtime
2. When a search request is received, it:
   - Loads the appropriate index based on runtime and version (currently fixed to latest)
   - Performs the search using lunr.js
   - Returns the search results as JSON
3. The LLM can then use these results to find relevant documentation pages

## License

MIT License
