import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { POWERTOOLS_BASE_URL, runtimes } from '../../constants.ts';
import { logger } from '../../logger.ts';
import { buildResponse } from '../shared/buildResponse.ts';
import { SearchIndexFactory, searchDocuments } from './searchIndex.ts';
import type { ToolProps } from './types.ts';

const searchIndexes = new SearchIndexFactory();

const tool = async ({
  search,
  runtime,
  version,
}: ToolProps): Promise<CallToolResult> => {
  try {
    // First, check if the version is valid
    const versionInfo = await searchIndexes.resolveVersion(runtime, version);
    if (!versionInfo.valid) {
      // Return an error with available versions
      const availableVersions =
        versionInfo.available?.map((v) => v.version) || [];

      return buildResponse({
        content: JSON.stringify({
          error: `Invalid version: ${version} for runtime: ${runtime}`,
          availableVersions,
        }),
        isError: true,
      });
    }

    // do the search
    const idx = await searchIndexes.getIndex(runtime, version);
    if (!idx) {
      // If we get here, it's likely an invalid runtime since version validation already happened
      logger.warn(`Invalid runtime: ${runtime}`);

      return buildResponse({
        content: JSON.stringify({
          error: `Invalid runtime: ${runtime}`,
          availableRuntimes: runtimes,
        }),
        isError: true,
      });
    }
    if (!idx.index || !idx.documents) {
      logger.warn(`Invalid index for runtime: ${runtime}, version: ${version}`);
      return buildResponse({
        content: JSON.stringify({
          error: `Invalid index for runtime: ${runtime}, version: ${version}`,
          suggestion:
            "Try using 'latest' version or check network connectivity",
        }),
        isError: true,
      });
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
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : `Unexpected error: ${String(error)}`;
    logger.error('Error handling tool request', { error });
    return {
      content: [{ type: 'text', text: `Error: ${errorMessage}` }],
      isError: true,
    };
  }
};

export { tool };
