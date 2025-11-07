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
import type { ToolProps } from './types.ts';

/**
 * Search for documentation based on the provided parameters.
 *
 * This tool fetches a search index from the Powertools for AWS documentation,
 * hydrates it into a Lunr index, and performs a search based on the provided query.
 *
 * The search index is expected to be in a specific format, and the results
 * are filtered based on a confidence threshold to ensure relevance. This threshold
 * can be configured via the `SEARCH_CONFIDENCE_THRESHOLD` environment variable.
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

  let searchIndexContent: {
    docs: { location: string; title: string; text: string }[];
  };
  try {
    const content = await fetchWithCache({
      url,
      contentType: 'application/json',
    });
    searchIndexContent = JSON.parse(content);
    if (
      isNullOrUndefined(searchIndexContent.docs) ||
      !Array.isArray(searchIndexContent.docs)
    ) {
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

  // TODO: consume built/exported search index - #79
  const index = lunr(function () {
    this.ref('location');
    this.field('title', { boost: 1000 });
    this.field('text', { boost: 1 });
    this.field('tags', { boost: 1000000 });

    for (const doc of searchIndexContent.docs) {
      if (!doc.location || !doc.title || !doc.text) continue;

      this.add({
        location: doc.location,
        title: doc.title,
        text: doc.text,
      });
    }
  });

  const results = [];
  for (const result of index.search(search)) {
    if (result.score < SEARCH_CONFIDENCE_THRESHOLD) break; // Results are sorted by score, so we can stop early
    results.push({
      title: result.ref,
      url: `${baseUrl}/${result.ref}`,
      score: result.score,
    });
  }

  logger.debug(
    `Search results with confidence >= ${SEARCH_CONFIDENCE_THRESHOLD} found: ${results.length}`
  );

  return buildResponse({
    content: results,
  });
};

export { tool };
