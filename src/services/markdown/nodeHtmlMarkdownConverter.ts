import { HtmlToMarkdownConverter } from './types';

import * as cheerio from 'cheerio';
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
   * Extract title and main content from HTML using cheerio DOM parser
   * @param html The HTML content to process
   * @returns Object containing title and main content
   */
  extractContent(html: string): { title: string, content: string } {
    // Load HTML into cheerio
    const $ = cheerio.load(html);
    
    // Extract title - first try h1, then fall back to title tag
    let title = $('h1').first().text().trim();
    if (!title) {
      title = $('title').text().trim();
    }
    
    // Extract main content - target the md-content container
    let contentHtml = '';
    
    // First try to find the main content container
    const mdContent = $('div.md-content[data-md-component="content"]');
    
    if (mdContent.length > 0) {
      // Get the HTML content of the md-content div
      contentHtml = mdContent.html() || '';
    } else {
      // Fall back to body content if md-content not found
      contentHtml = $('body').html() || html;
    }
    
    return { title, content: contentHtml };
  }
}
