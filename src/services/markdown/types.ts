/**
 * Interface for HTML-to-markdown conversion
 */
export interface HtmlToMarkdownConverter {
  /**
   * Convert HTML content to Markdown
   * @param html The HTML content to convert
   * @returns The converted Markdown content
   */
  convert(html: string): string;
  
  /**
   * Extract title and main content from HTML
   * @param html The HTML content to process
   * @returns Object containing title and main content
   */
  extractContent(html: string): { title: string, content: string };
}
