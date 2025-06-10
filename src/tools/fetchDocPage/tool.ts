import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { logger } from '../../logger.ts';
import { buildResponse } from '../shared/buildResponse.ts';
import { fetchWithCache } from '../shared/fetchWithCache.ts';
import { name as toolName } from './constants.ts';
import type { ToolProps } from './types.ts';

/**
 * Fetch a documentation page from remote or local cache.
 *
 * @see - {@link fetchWithCache | `fetchWithCache`} for the implementation details on caching and fetching.
 *
 * @param props - options for fetching a documentation page
 * @param props.url - the URL of the documentation page to fetch
 */
const tool = async (props: ToolProps): Promise<CallToolResult> => {
  const { url } = props;
  logger.appendKeys({ tool: toolName });
  logger.appendKeys({ url: url.toString() });

  try {
    return buildResponse({
      content: await fetchWithCache({ url, contentType: 'text/markdown' }),
    });
  } catch (error) {
    return buildResponse({
      content: `${(error as Error).message}`,
      isError: true,
    });
    /* v8 ignore start */
  } finally {
    /* v8 ignore stop */
    logger.removeKeys(['tool', 'url']);
  }
};

export { tool };
