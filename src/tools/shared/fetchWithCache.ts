import { isNull } from '@aws-lambda-powertools/commons/typeutils';
import { get as getFromCache, put as writeToCache } from 'cacache';
import { CACHE_BASE_PATH, FETCH_TIMEOUT_MS } from '../../constants.ts';
import { logger } from '../../logger.ts';

type FetchProps<T extends 'GET' | 'HEAD' = 'GET' | 'HEAD'> = {
  url: URL;
  contentType: string;
  method: T;
};

type FetchResult<T extends 'GET' | 'HEAD'> = T extends 'GET'
  ? { content: string; eTag: string | null }
  : { content: undefined; eTag: string | null };

/**
 * Get a remote resource from the documentation.
 *
 * @param url - The URL of the remote documentation resource to fetch
 */
const fetchFromRemote = async <T extends 'GET' | 'HEAD'>(
  props: FetchProps<T>
): Promise<FetchResult<T>> => {
  const { url, contentType, method } = props;
  try {
    const response = await fetch(url, {
      method,
      headers: {
        Accept: contentType,
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new Error(
        `Request to fetch ${url} failed: ${response.status} ${response.statusText}`
      );
    }
    const eTag = response.headers.get('etag');
    if (!eTag) {
      logger.warn('No ETag found in response; this may affect caching.');
    }
    const cleanETag = eTag?.replace(/^"(.*)"$/, '$1') || null;
    if (method === 'GET') {
      return {
        content: await response.text(),
        eTag: cleanETag,
      } as FetchResult<T>;
    }
    return {
      content: undefined,
      eTag: cleanETag,
    } as FetchResult<T>;
  } catch (error) {
    logger.error('Failed to fetch remote resource', { error });
    throw new Error('Failed to fetch remote resource', {
      cause: error,
    });
  }
};

/**
 * Error thrown when cache operations fail or when a cache miss occurs.
 */
class CacheError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CacheError';
  }
}

/**
 * Fetch a resource from remote or local cache.
 *
 * When using this function, we first check if the resource is available in the local cache
 * by using the page url as the cache key prefix.
 *
 * If none is found, we fetch the page from the remote server and cache it locally,
 * then return its content.
 *
 * If the local cache includes a potential match, we make a `HEAD` request to the remote server
 * and compare the ETag with the one stored in the local cache.
 *
 * If the ETag matches, we return the cached content. If it doesn't match,
 * we fetch the entire page using a `GET` request and update the local cache with the new content.
 *
 * @param props - options for fetching a resource
 * @param props.url - the URL of the resource to fetch
 */
const fetchWithCache = async (
  props: Omit<FetchProps<'GET'>, 'method'>
): Promise<string> => {
  const cachePath = CACHE_BASE_PATH;
  const cacheKey = props.url.pathname;
  logger.debug('Generated cache key', { cacheKey });

  try {
    const [cachedETagPromise, remoteETagPromise] = await Promise.allSettled([
      getFromCache(cachePath, `${cacheKey}-etag`),
      fetchFromRemote({
        ...props,
        method: 'HEAD',
      }),
    ]);
    const cachedETag =
      cachedETagPromise.status === 'fulfilled'
        ? cachedETagPromise.value.data.toString()
        : null;
    const remoteETag =
      remoteETagPromise.status === 'fulfilled'
        ? remoteETagPromise.value.eTag
        : null;

    if (isNull(cachedETag) && isNull(remoteETag)) {
      throw new CacheError(
        'No cached ETag and remote ETag found, fetching remote resource'
      );
    }

    if (cachedETag === remoteETag) {
      logger.debug('cached eTag matches, returning cached resource');
      try {
        const cachedResource = await getFromCache(cachePath, cacheKey);
        return cachedResource.data.toString();
      } catch (error) {
        throw new CacheError(
          'Cached resource not found even though ETag matches; cache may be corrupted'
        );
      }
    }
    throw new CacheError(
      `ETag mismatch: local ${cachedETag} vs remote ${remoteETag}; fetching remote resource`
    );
  } catch (error) {
    if (error instanceof CacheError) {
      logger.debug(error.message, { cacheKey });
    }
    try {
      const { content, eTag: newEtag } = await fetchFromRemote({
        ...props,
        method: 'GET',
      });

      await writeToCache(cachePath, `${cacheKey}-etag`, newEtag);
      await writeToCache(cachePath, cacheKey, content);

      return content;
    } catch (fetchError) {
      logger.error('Failed to fetch remote resource', {
        error: fetchError,
      });
      throw fetchError;
    }
  }
};

export { fetchWithCache };
