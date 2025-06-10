import { FETCH_TIMEOUT_MS } from '../../constants.ts';
import { logger } from '../../logger.ts';

const getTimeout = (abortController: AbortController) =>
  setTimeout(() => {
    /* v8 ignore next */
    abortController.abort();
  }, FETCH_TIMEOUT_MS);

/**
 * Get the content of a remote documentation page.
 *
 * @param url - The URL of the remote documentation page to fetch.
 */
const getRemotePage = async (
  url: URL
): Promise<{ markdown: string; eTag: string | null }> => {
  const abortController = new AbortController();
  const timeoutId = getTimeout(abortController);
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'text/markdown',
      },
      signal: abortController.signal,
    });
    if (!response.ok) {
      throw new Error(
        `Failed to fetch page content: ${response.status} ${response.statusText}`
      );
    }
    const markdown = await response.text();
    logger.debug('Fetched content', { markdown: markdown.slice(0, 100) });
    const { headers } = response;
    const eTag = headers.get('etag')?.replace(/^"(.*)"$/, '$1') || null;
    if (!eTag) {
      logger.warn('No ETag found in response; this may affect caching.');
    }

    return {
      markdown,
      eTag,
    };
  } catch (error) {
    logger.error('Failed to page fetch content', { error });
    throw new Error('Failed to fetch remote page', {
      cause: error,
    });
    /* v8 ignore start */
  } finally {
    /* v8 ignore end */
    clearTimeout(timeoutId);
  }
};

/**
 * Get the ETag of a remote documentation page.
 *
 * @param url - The URL of the remote documentation page to fetch the ETag from.
 */
const getRemotePageETag = async (url: URL): Promise<string | null> => {
  const abortController = new AbortController();
  const timeoutId = getTimeout(abortController);
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      headers: {
        Accept: 'text/markdown',
      },
      signal: abortController.signal,
    });
    if (!response.ok) {
      throw new Error(
        `Request to fetch eTag failed: ${response.status} ${response.statusText}`
      );
    }
    const eTag = response.headers.get('etag');
    if (!eTag) {
      logger.warn('No ETag found in response; this may affect caching.');
      return null;
    }
    logger.debug('Fetched ETag', { eTag });
    return eTag.replace(/^"(.*)"$/, '$1'); // Clean ETag by removing quotes
  } catch (error) {
    logger.error('Failed to fetch eTag', { error });
    throw new Error('Failed to fetch remote page eTag', {
      cause: error,
    });
    /* v8 ignore start */
  } finally {
    /* v8 ignore end */
    clearTimeout(timeoutId);
  }
};

/**
 * Generate a cache key based on the URL of a documentation page.
 *
 * @param props - options for generating a cache key
 * @param props.url - the URL of the documentation page
 */
const generateCacheKey = (props: { url: URL }): string => {
  const { url } = props;
  const pathParts = url.pathname.split('/').filter(Boolean);
  const [_, runtime, version, ...rest] = pathParts;
  const pagePath = rest.join('/');

  return `${runtime}/${version}/${pagePath}`;
};

export { getRemotePage, getRemotePageETag, generateCacheKey };
