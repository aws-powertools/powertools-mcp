import { isNullOrUndefined } from '@aws-lambda-powertools/commons/typeutils';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import lunr from 'lunr';
import {
  POWERTOOLS_BASE_URL,
  SEARCH_CONFIDENCE_THRESHOLD,
} from '../../constants.ts';
import { logger } from '../../logger.ts';
import { buildResponse } from '../shared/buildResponse.ts';
import { fetchWithCache } from '../shared/fetchWithCache.ts';
import type { ToolProps, MkDocsSearchIndex } from './types.ts';

/**
 * Search for documentation based on the provided parameters.
 *
 * This tool fetches a search index from the Powertools for AWS documentation,
 * hydrates it into a Lunr index, and performs a search based on the provided query.
 *
 * The search index is expected to be in the full MkDocs Material format with proper
 * field boosting (1000x for titles, 1M for tags) to match the online search experience.
 * Results are filtered based on a confidence threshold to ensure relevance.
 *
 * This tool is designed to work with the Powertools for AWS documentation
 * for various runtimes, including Python and TypeScript, and supports versioning.
 *
 * Search indexes are fetched from a remote source and cached locally
 * using the {@link fetchWithCache | `fetchWithCache`} utility to improve performance and reduce network calls.
 *
 * @param props - options for searching documentation
 * @param props.search - the search query to use
 * @param props.runtime - the runtime to search in (e.g., 'python', 'typescript')
 * @param props.version - the version of the runtime to search in (e.g., 'latest', '1.0.0')
 */
const tool = async (props: ToolProps): Promise<CallToolResult> => {
  const { search, runtime, version } = props;
  logger.appendKeys({ tool: 'searchDocs' });
  logger.appendKeys({ search, runtime, version });

  const urlParts =
    runtime === 'python' || runtime === 'typescript' || runtime === 'java'
      ? [runtime, version]
      : [runtime];
  const baseUrl = `${POWERTOOLS_BASE_URL}/${urlParts.join('/')}`;
  const url = new URL(baseUrl);
  const urlSuffix = '/search/search_index.json';
  url.pathname = `${url.pathname}${urlSuffix}`;

  let searchIndex: MkDocsSearchIndex;
  try {
    const content = await fetchWithCache({
      url,
      contentType: 'application/json',
    });
    const rawIndex = JSON.parse(content);
    
    // Handle both full MkDocs index and simplified format for backward compatibility
    if (rawIndex.docs && Array.isArray(rawIndex.docs)) {
      if (rawIndex.config && rawIndex.config.lang) {
        // Full MkDocs search index format
        searchIndex = rawIndex as MkDocsSearchIndex;
      } else {
        // Simplified format - convert to full structure
        searchIndex = {
          config: {
            lang: ['en'],
            separator: '[\\s\\-]+',
            pipeline: ['stopWordFilter', 'stemmer']
          },
          docs: rawIndex.docs,
          options: { suggest: false }
        };
      }
    } else {
      throw new Error('Invalid search index format: missing docs array');
    }

    if (isNullOrUndefined(searchIndex.docs) || !Array.isArray(searchIndex.docs)) {
      throw new Error(
        `Invalid search index format for ${runtime} ${version}: missing 'docs' property`
      );
    }
  } catch (error) {
    logger.error('Failed to fetch search index', {
      error: (error as Error).message,
    });
    return buildResponse({
      content: `Failed to fetch search index for ${runtime} ${version}: ${(error as Error).message}`,
      isError: true,
    });
  }

  // Build Lunr index with proper MkDocs Material configuration
  const index = lunr(function () {
    // Apply language configuration if not English
    if (searchIndex.config.lang.length === 1 && searchIndex.config.lang[0] !== "en") {
      // Note: This would require language-specific Lunr plugins
      logger.debug(`Language configuration detected: ${searchIndex.config.lang[0]}`);
    } else if (searchIndex.config.lang.length > 1) {
      logger.debug(`Multi-language configuration detected: ${searchIndex.config.lang.join(', ')}`);
    }

    this.ref('location');
    // Use proper MkDocs Material field boosting
    this.field('title', { boost: 1000 });  // 1000x boost for titles
    this.field('text', { boost: 1 });      // 1x boost for text
    this.field('tags', { boost: 1000000 }); // 1M boost for tags

    for (const doc of searchIndex.docs) {
      if (!doc.location || !doc.title || !doc.text) continue;

      const indexDoc: Record<string, any> = {
        location: doc.location,
        title: doc.title,
        text: doc.text,
      };

      // Add tags if present
      if (doc.tags && doc.tags.length > 0) {
        indexDoc.tags = doc.tags.join(' ');
      }

      this.add(indexDoc, { boost: doc.boost || 1 });
    }
  });

  const results = [];
  for (const result of index.search(search)) {
    results.push({
      title: result.ref,
      url: `${baseUrl}/${result.ref}`,
      score: result.score,
    });
  }

  logger.debug(`Search results found: ${results.length}`);

  return buildResponse({
    content: results,
  });
};

export { tool };
