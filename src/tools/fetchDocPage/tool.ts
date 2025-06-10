import { join } from 'node:path';
import { isNull } from '@aws-lambda-powertools/commons/typeutils';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { get as getFromCache, put as writeToCache } from 'cacache';
import type { z } from 'zod';
import { CACHE_BASE_PATH } from '../../constants.ts';
import { logger } from '../../logger.ts';
import { buildResponse } from '../shared/buildResponse.ts';
import { name as toolName } from './constants.ts';
import { CacheError } from './errors.ts';
import type { schema } from './schemas.ts';
import { getRemotePage, getRemotePageETag } from './utils.ts';

/**
 * Fetch a documentation page from remote or local cache.
 *
 * When using this function, we first check if the page is available in the local cache
 * by using the page url as the cache key prefix.
 *
 * If none is found, we fetch the page from the remote server and cache it locally,
 * then return its markdown content.
 *
 * If the local cache includes a potential match, we make a `HEAD` request to the remote server
 * and compare the ETag with the one stored in the local cache.
 *
 * If the ETag matches, we return the cached markdown content. If it doesn't match,
 * we fetch the entire page using a `GET` request and update the local cache with the new content.
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

  const cachePath = join(CACHE_BASE_PATH, 'markdown-cache');
  const cacheKey = url.pathname;
  logger.debug('Generated cache key', { cacheKey });

  try {
    const [cachedETagPromise, remoteETagPromise] = await Promise.allSettled([
      getFromCache(cachePath, `${cacheKey}-etag`),
      getRemotePageETag(url),
    ]);
    const cachedETag =
      cachedETagPromise.status === 'fulfilled'
        ? cachedETagPromise.value.data.toString()
        : null;
    const remoteETag =
      remoteETagPromise.status === 'fulfilled' ? remoteETagPromise.value : null;

    if (isNull(cachedETag) && isNull(remoteETag)) {
      throw new CacheError(
        'No cached ETag and remote ETag found, fetching remote page'
      );
    }

    if (cachedETag === remoteETag) {
      logger.debug('cached eTag matches, returning cached markdown');
      try {
        const cachedMarkdown = await getFromCache(cachePath, cacheKey);
        return buildResponse({
          content: cachedMarkdown.data.toString(),
        });
      } catch (error) {
        throw new CacheError(
          'Cached markdown not found even though ETag matches; cache may be corrupted'
        );
      }
    }
    throw new CacheError(
      `ETag mismatch: local ${cachedETag} vs remote ${remoteETag}; fetching remote page`
    );
  } catch (error) {
    if (error instanceof CacheError) {
      logger.debug(error.message, { cacheKey });
    }
    try {
      const { markdown, eTag: newEtag } = await getRemotePage(url);

      await writeToCache(cachePath, `${cacheKey}-etag`, newEtag);
      await writeToCache(cachePath, cacheKey, markdown);

      return buildResponse({
        content: markdown,
      });
    } catch (fetchError) {
      logger.error('Failed to fetch remote page', {
        error: fetchError,
      });
      return buildResponse({
        content: `${(fetchError as Error).message}`,
        isError: true,
      });
    }
    /* v8 ignore start */
  } finally {
    /* v8 ignore end */
    logger.removeKeys(['url', 'tool']);
  }
};

export { tool };
