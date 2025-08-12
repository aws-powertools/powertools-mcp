# Powertools for AWS MCP

![NodeSupport](https://img.shields.io/static/v1?label=node&message=%2022&color=green?style=flat-square&logo=node)
![GitHub Release](https://img.shields.io/github/v/release/aws-powertools/powertools-mcp?include_prereleases)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/aws-powertools/powertools-mcp/badge)](https://api.securityscorecards.dev/projects/github.com/aws-powertools/powertools-mcp)
[![Status](https://img.shields.io/badge/Status-Experimental-orange.svg)](https://shields.io/)
[![Stability](https://img.shields.io/badge/Stability-Evolving-yellow.svg)](https://shields.io/)
[![Discord](https://img.shields.io/badge/Discord-Join_Community-7289da.svg)](https://discord.gg/B8zZKbbyET)

The Powertools for AWS [Model Context Protocol (MCP)](https://modelcontextprotocol.io/introduction) is an MCP implementation that provides search functionality for the Powertools for AWS Lambda documentation across multiple runtimes. It allows your LLM agents to search for documentation and examples related to the toolkit, helping you to quickly find the information you need to use Powertools for AWS Lambda effectively.

> [!WARNING]
> **This project is experimental and under active development.** APIs and features may change frequently without notice.

## 💡 Get Involved

We're actively seeking community feedback and feature suggestions [join our Discord](https://discord.gg/B8zZKbbyET) or [open an issue](https://github.com/aws-powertools/powertools-mcp/issues/new/choose) to share your thoughts.

## Use Cases

- Bring documentation and examples directly into your LLM agents' context.
- Search for specific topics or keywords within the Powertools for AWS documentation.
- Help your agents understand how to use the Powertools for AWS Lambda toolkit effectively.

## Getting Started

|                                                                                                           Cursor                                                                                                           |                                                                                                                                                             VS Code                                                                                                                                                             |
| :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
| [![Install MCP Server](https://cursor.com/deeplink/mcp-install-light.svg)](https://cursor.com/install-mcp?name=powertools&config=JTdCJTIyY29tbWFuZCUyMiUzQSUyMm5weCUyMC15JTIwcG93ZXJ0b29scy1mb3ItYXdzLW1jcCUyMiU3RA%3D%3D) | [![Install on VS Code](https://img.shields.io/badge/Install_on-VS_Code-FF9900?style=flat-square&logo=visualstudiocode&logoColor=white)](https://insiders.vscode.dev/redirect/mcp/install?name=Powertools%20for%20AWS%20MCP&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22powertools-for-aws-mcp%22%5D%7D) |

Most clients that support MCP can use this server out of the box using a configuration similar to the following:

> [!NOTE]
> If you are using an older version of the MCP, make sure to update your configuration to use the new package name `powertools-for-aws-mcp`.

```json
{
  "mcpServers": {
    "powertools": {
      "command": "npx",
      "args": ["-y", "powertools-for-aws-mcp"]
    }
  }
}
```

This setup uses the Node.js package manager to run the MCP server locally and communicate with it using the STDIO interface.

### Client-Specific Setup Instructions

For detailed setup instructions for specific clients, see the configurations below:

### Getting Started with Amazon Q Developer CLI

<details>
<summary>Use in Amazon Q Developer CLI</summary>

See [Amazon Q Developer CLI documentation](https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/command-line-mcp-config-CLI.html) for details.

**Add MCP Server using CLI commands:**

```bash
qchat mcp add powertools npx -y powertools-for-aws-mcp
```

**Manual Configuration:**
If you select global scope, the MCP server configuration is stored in `~/.aws/amazonq/mcp.json` and available across all your projects. If you select local scope, the configuration is stored in `.amazonq/mcp.json` within your current project.

#### `~/.aws/amazonq/mcp.json`

```json
{
  "mcpServers": {
    "powertools": {
      "command": "npx",
      "args": ["-y", "powertools-for-aws-mcp"]
    }
  }
}
```

</details>

### Getting Started with Kiro

<details>
<summary>Use in Kiro</summary>

See [Kiro Model Context Protocol Documentation](https://kiro.dev/docs/mcp/configuration/) for details.

1. Navigate to `Kiro` > `MCP Servers`
2. Add a new MCP server by selecting the `+ Add` button.
3. Paste the configuration given below:

#### `kiro_mcp_settings.json`

For macOS/Linux:

```json
{
  "mcpServers": {
    "powertools": {
      "command": "npx",
      "args": ["-y", "powertools-for-aws-mcp"]
    }
  }
}
```

For Windows:

```json
{
  "mcpServers": {
    "powertools": {
      "disabled": false,
      "timeout": 60,
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "powertools-for-aws-mcp"]
    }
  }
}
```

</details>

### Getting Started with Cursor

<details>
<summary>Getting Started with Cursor</summary>

1. You can place MCP configuration in two locations, depending on your use case:

A. **Project Configuration** - For tools specific to a project, create a `.cursor/mcp.json` file in your project directory. - This allows you to define MCP servers that are only available within that specific project.

B. **Global Configuration** - For tools that you want to use across all projects, create a `~/.cursor/mcp.json` file in your home directory. - This makes MCP servers available in all your Cursor workspaces.

#### `.cursor/mcp.json`

```json
{
  "mcpServers": {
    "powertools": {
      "command": "npx",
      "args": ["-y", "powertools-for-aws-mcp"]
    }
  }
}
```

2. **Using MCP in Chat:** The Composer Agent will automatically use any MCP tools that are listed under Available Tools on the MCP settings page if it determines them to be relevant. To prompt tool usage intentionally, please prompt Cursor to use the desired MCP Server you wish to use. For example, `Using the Powertools MCP Server, do...`

3. **Tool Approval:** By default, when the Agent wants to use an MCP tool, it will display a message asking for your approval. You can use the arrow next to the tool name to expand the message and see what arguments the Agent is calling the tool with.

</details>

### Getting Started with Windsurf

<details>
<summary>Getting Started with Windsurf</summary>

1. **Access MCP Settings**

   - Navigate to Windsurf - Settings > Advanced Settings or use the Command Palette > Open Windsurf Settings Page
   - Look for the "Model Context Protocol (MCP) Servers" section

2. **Add MCP Servers**

   - Select "Add Server" to add a new MCP server
   - You can choose from available templates like GitHub, Puppeteer, PostgreSQL, etc.
   - Alternatively, select "Add custom server" to configure your own server

3. **Manual Configuration**
   - You can also manually edit the MCP configuration file located at `~/.codeium/windsurf/mcp_config.json`

#### `~/.codeium/windsurf/mcp_config.json`

```json
{
  "mcpServers": {
    "powertools": {
      "command": "npx",
      "args": ["-y", "powertools-for-aws-mcp"]
    }
  }
}
```

</details>

### Getting Started with VS Code

<details>
<summary>Install in VS Code</summary>

Configure MCP servers in VS Code settings or in `.vscode/mcp.json` (see [VS Code MCP docs](https://code.visualstudio.com/docs/copilot/chat/mcp-servers) for more info.):

#### `.vscode/mcp.json`

```json
{
  "mcpServers": {
    "powertools": {
      "command": "npx",
      "args": ["-y", "powertools-for-aws-mcp"]
    }
  }
}
```

</details>

### Getting Started with Claude Code

<details>
<summary>Use in Claude Code</summary>

**Add MCP Server using CLI commands:**

```bash
claude mcp add powertools
```

**Manual Configuration (Recommended):**
You can directly edit the configuration file located at `~/.claude.json`. This approach is more flexible and allows you to see all configurations at once.

#### `~/.claude.json`

```json
{
  "mcpServers": {
    "powertools": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "powertools-for-aws-mcp"]
    }
  }
}
```

**Restart Claude Code:**
After editing the config file, restart Claude Code for the changes to take effect.

</details>

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
