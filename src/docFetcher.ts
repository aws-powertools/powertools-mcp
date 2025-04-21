import * as cheerio from 'cheerio';

// Allowed domain for security
const ALLOWED_DOMAIN = 'docs.powertools.aws.dev';

// Constants for performance tuning
const FETCH_TIMEOUT_MS = 15000; // 15 seconds timeout for fetch operations
const PROCESSING_BATCH_SIZE = 10; // Number of elements to process in a batch
const MAX_RECURSION_DEPTH = 5; // Maximum recursion depth for element processing
const CHUNK_SIZE_THRESHOLD = 10000; // Minimum HTML size to process in chunks

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
 * Converts an HTML element to markdown with recursion depth limit
 * @param $ The cheerio API instance
 * @param elem The element to convert
 * @param depth Current recursion depth
 * @returns The markdown string
 */
function elementToMarkdown($: cheerio.CheerioAPI, elem: any, depth: number = 0): string {
  // Limit recursion depth to prevent stack overflow
  if (depth > MAX_RECURSION_DEPTH) {
    return '';
  }

  const tagName = elem.tagName.toLowerCase();
  const $elem = $(elem);
  const text = $elem.text().trim();
  
  if (!text) return '';
  
  // Handle code blocks with syntax highlighting
  if (tagName === 'pre' && $elem.find('code').length > 0) {
    const $code = $elem.find('code').first();
    const codeText = $code.text().trim();
    const codeClass = $code.attr('class') || '';
    const lang = codeClass.match(/language-(\w+)/)?.[1] || '';
    return `\`\`\`${lang}\n${codeText}\n\`\`\`\n\n`;
  }
  
  switch (tagName) {
    case 'h1':
      return `# ${text}\n\n`;
    case 'h2':
      return `## ${text}\n\n`;
    case 'h3':
      return `### ${text}\n\n`;
    case 'h4':
      return `#### ${text}\n\n`;
    case 'h5':
      return `##### ${text}\n\n`;
    case 'h6':
      return `###### ${text}\n\n`;
    case 'p':
      return `${text}\n\n`;
    case 'ul': {
      // Process list items with depth control
      let ulMarkdown = '\n';
      $elem.find('> li').each((i, li) => {
        // Increment depth for child elements
        ulMarkdown += `* ${$(li).text().trim()}\n`;
      });
      return ulMarkdown + '\n';
    }
    case 'ol': {
      // Process ordered list items with depth control
      let olMarkdown = '\n';
      $elem.find('> li').each((i, li) => {
        olMarkdown += `${i+1}. ${$(li).text().trim()}\n`;
      });
      return olMarkdown + '\n';
    }
    case 'li':
      return `* ${text}\n`;
    case 'a': {
      const href = $elem.attr('href');
      return href ? `[${text}](${href})` : text;
    }
    case 'pre':
    case 'code':
      return `\`\`\`\n${text}\n\`\`\`\n\n`;
    case 'table':
      // Basic table support
      return `<table>${$elem.html()}</table>\n\n`;
    default:
      return text ? `${text}\n\n` : '';
  }
}

/**
 * Process DOM elements in batches to prevent thread blocking
 * @param $ The cheerio API instance
 * @param elements Array of elements to process
 * @returns The markdown string
 */
async function processDomElementsInBatches($: cheerio.CheerioAPI, elements: any[]): Promise<string> {
  let markdown = '';
  
  // Process elements in smaller batches
  for (let i = 0; i < elements.length; i += PROCESSING_BATCH_SIZE) {
    const batch = elements.slice(i, i + PROCESSING_BATCH_SIZE);
    
    for (const elem of batch) {
      markdown += elementToMarkdown($, elem);
    }
    
    // Allow event loop to continue by yielding execution
    if (i + PROCESSING_BATCH_SIZE < elements.length) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }
  
  return markdown;
}

// Add a simple cache for documentation pages
const docCache = new Map<string, {content: string, timestamp: number}>();
const CACHE_TTL = 3600000; // 1 hour in milliseconds

/**
 * Fetches a documentation page and converts it to markdown using streaming
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
      // Fetch the HTML content with streaming and timeout
      const response = await fetch(url, { signal: controller.signal });
      
      // Clear the timeout as request completed
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch page: ${response.status} ${response.statusText}`);
      }
      
      // Get the response as a stream
      const bodyStream = response.body;
      
      if (!bodyStream) {
        throw new Error('Response body stream is null');
      }
      
      // Create a readable stream from the response body
      const reader = bodyStream.getReader();
      const decoder = new TextDecoder();
      
      let html = '';
      let markdown = '';
      
      // Process the stream in chunks
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }
        
        // Decode the chunk and append to HTML
        const chunk = decoder.decode(value, { stream: true });
        html += chunk;
        
        // If we have enough HTML to start processing, do it in chunks
        if (html.length > CHUNK_SIZE_THRESHOLD && html.includes('</div>')) {
          // Process this chunk
          const $ = cheerio.load(html);
          
          // Remove script and style tags
          $('script, style').remove();
          
          // Extract the main content - specifically target the md-content container
          const mainContent = $('div.md-content[data-md-component="content"]');
          const contentToProcess = mainContent.length > 0 ? mainContent : $('body');
          
          // Process title only once
          if (markdown === '') {
            const title = $('h1').first().text().trim() || $('title').text().trim();
            if (title) {
              markdown += `# ${title}\n\n`;
            }
          }
          
          // Process elements in batches
          const elements = contentToProcess.children().toArray();
          markdown += await processDomElementsInBatches($, elements);
          
          // Reset HTML buffer to avoid reprocessing
          html = '';
        }
      }
      
      // Process any remaining HTML
      if (html.length > 0) {
        const $ = cheerio.load(html);
        
        // Remove script and style tags
        $('script, style').remove();
        
        // Extract the main content - specifically target the md-content container
        const mainContent = $('div.md-content[data-md-component="content"]');
        const contentToProcess = mainContent.length > 0 ? mainContent : $('body');
        
        // Process title if we haven't yet
        if (markdown === '') {
          const title = $('h1').first().text().trim() || $('title').text().trim();
          if (title) {
            markdown += `# ${title}\n\n`;
          }
        }
        
        // Process elements in batches
        const elements = contentToProcess.children().toArray();
        markdown += await processDomElementsInBatches($, elements);
      }
      
      // If we didn't extract much structured content, fall back to text
      if (markdown.length < 100) {
        const $ = cheerio.load(html);
        const bodyText = $('body').text().trim();
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
