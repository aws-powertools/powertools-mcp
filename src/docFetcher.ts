import * as cheerio from 'cheerio';

// Allowed domain for security
const ALLOWED_DOMAIN = 'docs.powertools.aws.dev';

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
 * Converts an HTML element to markdown
 * @param $elem The cheerio element to convert
 * @returns The markdown string
 */
function elementToMarkdown($: cheerio.CheerioAPI, elem: any): string {
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
      // Process list items recursively
      let ulMarkdown = '\n';
      $elem.find('> li').each((i, li) => {
        ulMarkdown += `* ${$(li).text().trim()}\n`;
      });
      return ulMarkdown + '\n';
    }
    case 'ol': {
      // Process ordered list items recursively
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
    
    // Fetch the HTML content with streaming
    const response = await fetch(url);
    
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
      if (html.length > 10000 && html.includes('</div>')) {
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
        
        // Process elements in order
        contentToProcess.children().each((i, elem) => {
          markdown += elementToMarkdown($, elem);
        });
        
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
      
      // Process elements in order
      contentToProcess.children().each((i, elem) => {
        markdown += elementToMarkdown($, elem);
      });
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
  } catch (error) {
    console.error(`Error fetching doc page: ${error}`);
    return `Error fetching documentation: ${error instanceof Error ? error.message : String(error)}`;
  }
}
