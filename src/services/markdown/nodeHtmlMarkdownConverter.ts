import { HtmlToMarkdownConverter } from './types';

import { NodeHtmlMarkdown, NodeHtmlMarkdownOptions } from 'node-html-markdown';

/**
 * Implementation of HtmlToMarkdownConverter using node-html-markdown
 */
export class NodeHtmlMarkdownConverter implements HtmlToMarkdownConverter {
  private nhm: NodeHtmlMarkdown;
  
  constructor() {
    const options: NodeHtmlMarkdownOptions = {
      // Base configuration
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
      bulletMarker: '*',
      emDelimiter: '*',
      strongDelimiter: '**',
      
      // Custom element handlers
      customCodeBlockHandler: (element) => {
        // Extract language from class attribute
        const className = element.getAttribute('class') || '';
        const language = className.match(/language-(\w+)/)?.[1] || '';
        
        // Get the code content
        const content = element.textContent || '';
        
        // Return formatted code block
        return `\n\`\`\`${language}\n${content}\n\`\`\`\n\n`;
      }
    };
    
    this.nhm = new NodeHtmlMarkdown(options);
  }
  
  /**
   * Convert HTML content to Markdown using node-html-markdown
   * @param html The HTML content to convert
   * @returns The converted Markdown content
   */
  convert(html: string): string {
    return this.nhm.translate(html);
  }
  
  /**
   * Extract title and main content from HTML using regex
   * @param html The HTML content to process
   * @returns Object containing title and main content
   */
  extractContent(html: string): { title: string, content: string } {
    // Simple regex approach for title extraction
    const titleMatch = html.match(/<h1[^>]*>(.*?)<\/h1>/i) || 
                      html.match(/<title[^>]*>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';
    
    // Extract main content - target the md-content container
    const contentMatch = html.match(/<div class="md-content"[^>]*data-md-component="content"[^>]*>([\s\S]*?)<\/div>/i);
    
    // If we found the main content container, use it; otherwise use the body
    const content = contentMatch ? 
      contentMatch[0] : 
      html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[0] || html;
    
    return { title, content };
  }
}
