import { NodeHtmlMarkdownConverter } from './nodeHtmlMarkdownConverter';
import { HtmlToMarkdownConverter } from './types';

/**
 * Enum for available HTML-to-markdown converter types
 */
export enum ConverterType {
  NODE_HTML_MARKDOWN = 'node-html-markdown',
  // Add other converters as needed in the future
}

/**
 * Factory for creating HTML-to-markdown converters
 */
export class ConverterFactory {
  /**
   * Create an instance of an HTML-to-markdown converter
   * @param type The type of converter to create
   * @returns An instance of HtmlToMarkdownConverter
   */
  static createConverter(type: ConverterType = ConverterType.NODE_HTML_MARKDOWN): HtmlToMarkdownConverter {
    switch (type) {
      case ConverterType.NODE_HTML_MARKDOWN:
        return new NodeHtmlMarkdownConverter();
      // Add cases for other converters as they are implemented
      default:
        return new NodeHtmlMarkdownConverter();
    }
  }
}
