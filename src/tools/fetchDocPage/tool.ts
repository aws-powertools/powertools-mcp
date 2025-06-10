import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { z } from 'zod';
import { logger } from '../../logger.ts';
import { buildResponse } from '../shared/buildResponse.ts';
import { fetchWithCache } from '../shared/fetchWithCache.ts';
import { name as toolName } from './constants.ts';
import type { schema } from './schemas.ts';

/**
 * Fetch a documentation page from remote or local cache.
 *
 * @see - {@link fetchWithCache | `fetchWithCache`} for the implementation details on caching and fetching.
 *
 * @param props - options for fetching a documentation page
 * @param props.pageUrl - the URL of the documentation page to fetch
 */
const tool = async (props: {
  url: z.infer<typeof schema.url>;
}): Promise<CallToolResult> => {
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
  }
};

export { tool };
