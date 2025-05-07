// Import domino using dynamic import to avoid TypeScript module issues
import { createHash } from 'crypto';
import * as path from 'path';

import cacheConfig from './config/cache';
import { FetchService } from './services/fetch';
import { ContentType } from './services/fetch/types';

// @ts-expect-error - Importing domino which doesn't have proper TypeScript definitions
import domino from '@mixmark-io/domino';
import * as cacache from 'cacache';
import TurndownService from 'turndown';

// Allowed domain for security
const ALLOWED_DOMAIN = 'docs.powertools.aws.dev';

// Constants for performance tuning
const FETCH_TIMEOUT_MS = 15000; // 15 seconds timeout for fetch operations

// Initialize the fetch service with disk-based caching
const fetchService = new FetchService(cacheConfig);

/**
 * Validates that a URL belongs to the allowed domain
 * @param url The URL to validate
 * @returns True if the URL is valid and belongs to the allowed domain
 */
function isValidUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname === ALLOWED_DOMAIN;
  } catch {
    return false;
  }
}

/**
 * Configure Turndown with custom rules for better Markdown conversion
 * @returns Configured Turndown service
 */
function configureTurndown(): TurndownService {
  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
    bulletListMarker: '*',
    strongDelimiter: '**'
  });

  // Improve code block handling
  turndownService.addRule('fencedCodeBlock', {
    filter: (node): boolean => {
      return (
        node.nodeName === 'PRE' &&
        node.firstChild !== null &&
        node.firstChild.nodeName === 'CODE'
      );
    },
    replacement: (content, node) => {
      const code = node.firstChild as HTMLElement;
      const className = code.getAttribute('class') || '';
      const language = className.match(/language-(\w+)/)?.[1] || '';
      return `\n\`\`\`${language}\n${code.textContent}\n\`\`\`\n\n`;
    }
  });

  // Improve table handling
  turndownService.addRule('tableRule', {
    filter: 'table',
    replacement: (content) => {
      // For complex tables, we might want to keep the HTML
      return content.trim() ? `\n\n${content}\n\n` : '';
    }
  });

  return turndownService;
}

/**
 * Extract content from HTML string using domino
 * @param html The HTML string to process
 * @returns Object containing title and main content element
 */
function extractContent(html: string): { title: string, content: string } {
  // Create a DOM document using domino
  const doc = domino.createDocument(html);
  
  // Remove script and style tags
  const scripts = doc.querySelectorAll('script, style');
  scripts.forEach((script: Element) => script.parentNode?.removeChild(script));
  
  // Get the title
  const titleElement = doc.querySelector('h1') || doc.querySelector('title');
  const title = titleElement ? titleElement.textContent?.trim() || '' : '';
  
  // Extract the main content - specifically target the md-content container
  const mainContent = doc.querySelector('div.md-content[data-md-component="content"]');
  
  // If we found the main content container, use it; otherwise fall back to body
  const contentElement = mainContent || doc.body;
  
  return {
    title,
    content: contentElement.innerHTML
  };
}

/**
 * Generate a cache key for markdown based on URL and ETag
 * @param url The URL of the page
 * @param etag The ETag from the response headers
 * @returns A cache key string
 */
function generateMarkdownCacheKey(url: string, etag: string | null): string {
  // Clean the ETag (remove quotes if present)
  const cleanEtag = etag ? etag.replace(/^"(.*)"$/, '$1') : '';
  
  // Extract path components from URL for readability
  const parsedUrl = new URL(url);
  const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
  
  // Create a cache key with path components and ETag
  // AWS Lambda Powertools documentation URLs follow the pattern:
  // https://docs.powertools.aws.dev/lambda/{runtime}/{version}/{path}
  // We check for "lambda" as the first path component to ensure we're processing
  // a valid Powertools documentation URL with the expected structure
  if (pathParts.length >= 3 && pathParts[0] === 'lambda') {
    const runtime = pathParts[1];
    const version = pathParts[2];
    const pagePath = pathParts.slice(3).join('/') || 'index';
    
    return `${runtime}/${version}/${pagePath}-${cleanEtag}`;
  }
  
  // Fallback for URLs that don't match the expected pattern
  return `page-${cleanEtag}`;
}

/**
 * Generate a hash of HTML content (fallback when ETag is not available)
 * @param html The HTML content
 * @returns MD5 hash of the content
 */
function generateContentHash(html: string): string {
  return createHash('md5').update(html).digest('hex');
}

/**
 * Get the cache directory path for markdown content
 * @returns The path to the markdown cache directory
 */
function getMarkdownCachePath(): string {
  return path.join(
    cacheConfig.basePath,
    cacheConfig.contentTypes[ContentType.MARKDOWN]?.path || 'markdown-cache'
  );
}

/**
 * Check if markdown exists in cache for a given key
 * @param cacheKey The cache key
 * @returns The cached markdown or null if not found
 */
async function getMarkdownFromCache(cacheKey: string): Promise<string | null> {
  try {
    const cachePath = getMarkdownCachePath();
    
    // Use cacache directly to get the content
    const data = await cacache.get.info(cachePath, cacheKey)
      .then(() => cacache.get(cachePath, cacheKey))
      .then(data => data.data.toString('utf8'));
    
    console.error(`[CACHE HIT] Markdown cache hit for key: ${cacheKey}`);
    return data;
  } catch (error) {
    // If entry doesn't exist, cacache throws an error
    if ((error as Error).message.includes('ENOENT') || 
        (error as Error).message.includes('not found')) {
      console.error(`[CACHE MISS] No markdown in cache for key: ${cacheKey}`);
      return null;
    }
    
    console.error(`Error reading markdown from cache: ${error}`);
    return null;
  }
}

/**
 * Save markdown to cache
 * @param cacheKey The cache key
 * @param markdown The markdown content
 */
async function saveMarkdownToCache(cacheKey: string, markdown: string): Promise<void> {
  try {
    const cachePath = getMarkdownCachePath();
    
    // Use cacache directly to store the content
    await cacache.put(cachePath, cacheKey, markdown);
    console.error(`[CACHE SAVE] Markdown saved to cache with key: ${cacheKey}`);
  } catch (error) {
    console.error(`Error saving markdown to cache: ${error}`);
  }
}

/**
 * Fetches a documentation page and converts it to markdown using Turndown
 * Uses disk-based caching with ETag validation for efficient fetching
 * Also caches the converted markdown to avoid redundant conversions
 * 
 * @param url The URL of the documentation page to fetch
 * @returns The page content as markdown
 */
export async function fetchDocPage(url: string): Promise<string> {
  try {
    // Validate URL for security
    if (!isValidUrl(url)) {
      throw new Error(`Invalid URL: Only URLs from ${ALLOWED_DOMAIN} are allowed`);
    }
    
    // Set up fetch options with timeout
    const fetchOptions = {
      timeout: FETCH_TIMEOUT_MS,
      contentType: ContentType.WEB_PAGE,
      headers: {
        'Accept': 'text/html'
      }
    };
    
    try {
      // Log that we're fetching the HTML content
      console.error(`[WEB FETCH] Fetching HTML content from ${url}`);
      
      // Fetch the HTML content with disk-based caching
      const response = await fetchService.fetch(url, fetchOptions);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch page: ${response.status} ${response.statusText}`);
      }
      
      // Check if the response came from cache
      const fromCache = response.headers.get('x-local-cache-status') === 'hit';
      // console.error(`[WEB CACHE] Response: `, response.headers)
      console.error(`[WEB ${fromCache ? 'CACHE HIT' : 'CACHE MISS'}] HTML content ${fromCache ? 'retrieved from cache' : 'fetched from network'} for ${url}`);
      
      // Get the ETag from response headers
      const etag = response.headers.get('etag');
      
      // Get the HTML content
      const html = await response.text();
      
      // If no ETag, generate a content hash as fallback
      const cacheKey = etag 
        ? generateMarkdownCacheKey(url, etag)
        : generateMarkdownCacheKey(url, generateContentHash(html));
      
      // Only check markdown cache when web page is loaded from Cache
      // If cache MISS on HTML load then we must re-render the Markdown
      if (fromCache) {
        // Check if we have markdown cached for this specific HTML version
        const cachedMarkdown = await getMarkdownFromCache(cacheKey);
        if (cachedMarkdown) {
          console.error(`[CACHE HIT] Markdown found in cache for ${url} with key ${cacheKey}`);
          return cachedMarkdown;
        }
      }
      
      console.error(`[CACHE MISS] Markdown not found in cache for ${url} with key ${cacheKey}, converting HTML to markdown`);
      
      // If not in cache, extract content and convert to markdown
      const { title, content } = extractContent(html);
      const turndownService = configureTurndown();
      
      // Build markdown content
      let markdown = '';
      if (title) {
        markdown = `# ${title}\n\n`;
      }
      markdown += turndownService.turndown(content);
      
      // Cache the markdown for future use
      await saveMarkdownToCache(cacheKey, markdown);
      
      return markdown;
    } catch (error) {
      throw new Error(`Failed to fetch or process page: ${error instanceof Error ? error.message : String(error)}`);
    }
  } catch (error) {
    console.error(`Error fetching doc page: ${error}`);
    return `Error fetching documentation: ${error instanceof Error ? error.message : String(error)}`;
  }
}

/**
 * Clear the documentation cache
 * @returns Promise that resolves when the cache is cleared
 */
export async function clearDocCache(): Promise<void> {
  await fetchService.clearCache(ContentType.WEB_PAGE);
  
  // Clear markdown cache using cacache directly
  try {
    const cachePath = getMarkdownCachePath();
    await cacache.rm.all(cachePath);
    console.error('Markdown cache cleared');
  } catch (error) {
    console.error(`Error clearing markdown cache: ${error}`);
  }
}
