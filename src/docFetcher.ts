import TurndownService from 'turndown';

// Import domino using dynamic import to avoid TypeScript module issues
// @ts-expect-error - Importing domino which doesn't have proper TypeScript definitions
import domino from '@mixmark-io/domino';

// Allowed domain for security
const ALLOWED_DOMAIN = 'docs.powertools.aws.dev';

// Constants for performance tuning
const FETCH_TIMEOUT_MS = 15000; // 15 seconds timeout for fetch operations

// Add a simple cache for documentation pages
const docCache = new Map<string, {content: string, timestamp: number}>();
const CACHE_TTL = 3600000; // 1 hour in milliseconds

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
 * Fetches a documentation page and converts it to markdown using Turndown
 * Specifically targets the div.md-content[data-md-component="content"] container
 * Includes caching to reduce repeated requests
 * @param url The URL of the documentation page to fetch
 * @returns The page content as markdown
 */
export async function fetchDocPage(url: string): Promise<string> {
  try {
    // Validate URL for security
    if (!isValidUrl(url)) {
      throw new Error(`Invalid URL: Only URLs from ${ALLOWED_DOMAIN} are allowed`);
    }
    
    // Check cache first
    const now = Date.now();
    if (docCache.has(url)) {
      const cached = docCache.get(url)!;
      if (now - cached.timestamp < CACHE_TTL) {
        console.error(`Cache hit for ${url}`);
        return cached.content;
      } else {
        console.error(`Cache expired for ${url}`);
      }
    }
    
    // Set up fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    
    try {
      // Fetch the HTML content with timeout
      const response = await fetch(url, { signal: controller.signal });
      
      // Clear the timeout as request completed
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch page: ${response.status} ${response.statusText}`);
      }
      
      // Get the HTML content
      const html = await response.text();
      
      // Extract content from HTML
      const { title, content } = extractContent(html);
      
      // Configure Turndown
      const turndownService = configureTurndown();
      
      // Convert the HTML to Markdown
      let markdown = '';
      
      // Add title if available
      if (title) {
        markdown = `# ${title}\n\n`;
      }
      
      // Convert the main content to Markdown
      markdown += turndownService.turndown(content);
      
      // If we didn't extract much structured content, fall back to text
      if (markdown.length < 100) {
        const doc = domino.createDocument(html);
        const bodyText = doc.body.textContent?.trim() || '';
        if (bodyText) {
          markdown = bodyText;
        }
      }
      
      // Store in cache
      docCache.set(url, {content: markdown, timestamp: Date.now()});
      
      return markdown;
    } finally {
      // Ensure timeout is cleared in all cases
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error(`Error fetching doc page: ${error}`);
    return `Error fetching documentation: ${error instanceof Error ? error.message : String(error)}`;
  }
}
