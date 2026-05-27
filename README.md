# Powertools for AWS MCP

> [!NOTE]
> **This project is now in maintenance mode and will be deprecated on June 30, 2026.**
> After that date, this package will no longer receive updates or security fixes. See [Alternatives](#alternatives) below for recommended migration paths.

![NodeSupport](https://img.shields.io/static/v1?label=node&message=%2024&color=green?style=flat-square&logo=node)
![GitHub Release](https://img.shields.io/github/v/release/aws-powertools/powertools-mcp?include_prereleases)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/aws-powertools/powertools-mcp/badge)](https://api.securityscorecards.dev/projects/github.com/aws-powertools/powertools-mcp)

The Powertools for AWS [Model Context Protocol (MCP)](https://modelcontextprotocol.io/introduction) server provides search and documentation retrieval for the Powertools for AWS Lambda toolkit across Python, TypeScript, Java, and .NET runtimes. It allows LLM agents to search for documentation and examples, helping you quickly find the information you need to use Powertools for AWS Lambda effectively.

## Alternatives

### Recommended: llms.txt + Agent Skills

Powertools for AWS publishes machine-readable documentation (`llms.txt`) for every runtime. These files give AI agents an authoritative, always up-to-date index of the full documentation — no MCP server required.

| Runtime | llms.txt URL |
|---------|--------------|
| Python | https://docs.aws.amazon.com/powertools/python/latest/llms.txt |
| TypeScript | https://docs.aws.amazon.com/powertools/typescript/latest/llms.txt |
| Java | https://docs.aws.amazon.com/powertools/java/latest/llms.txt |
| .NET | https://docs.aws.amazon.com/powertools/dotnet/llms.txt |

Combined with a [custom agent skill](./SKILL.md), your coding agent can automatically detect which runtime you're working in, fetch the relevant documentation, and apply Powertools patterns — all without running or maintaining a local MCP server.

This approach is lighter weight, works with any agent that supports web fetching, and always reflects the latest published documentation.

> See the [sample skill](./SKILL.md) to get started.

### Alternative: AWS Knowledge MCP Server

For teams that prefer consuming documentation via MCP, the [AWS Knowledge MCP Server](https://awslabs.github.io/mcp/servers/aws-knowledge-mcp-server) is a fully managed remote MCP server that provides up-to-date AWS documentation — including Powertools for AWS. It requires no local setup; just point your MCP client to the remote endpoint:

```
https://knowledge-mcp.global.api.aws
```

This server also covers broader AWS documentation, best practices, architectural guidance, and agent skills beyond Powertools.

## Acknowledgments

This project would not have been possible without the contributions of the community.

Special thanks to [Michael Walmsley](https://www.linkedin.com/in/walmsles/) ([ServerlessDNA.com](https://serverlessdna.com)) for creating the initial implementation and generously donating it to the Powertools for AWS team at Amazon Web Services. Thanks also to all contributors who helped shape, test, and improve this project over time.

## License

This library is licensed under the MIT License. See the [LICENSE](https://github.com/aws-powertools/powertools-mcp/blob/main/LICENSE) file.
