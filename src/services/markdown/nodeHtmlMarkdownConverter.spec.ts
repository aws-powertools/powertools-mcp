import { NodeHtmlMarkdownConverter } from './nodeHtmlMarkdownConverter';

describe('[Markdown-Converter] When using NodeHtmlMarkdownConverter', () => {
  let converter: NodeHtmlMarkdownConverter;

  beforeEach(() => {
    converter = new NodeHtmlMarkdownConverter();
  });

  describe('[Content-Extraction] When extracting content from HTML', () => {
    it('should extract title from h1 tag', () => {
      const html = '<html><body><h1>Test Title</h1><div>Content</div></body></html>';
      const result = converter.extractContent(html);
      expect(result.title).toBe('Test Title');
    });

    it('should extract title from title tag when h1 is not present', () => {
      const html = '<html><head><title>Test Title</title></head><body><div>Content</div></body></html>';
      const result = converter.extractContent(html);
      expect(result.title).toBe('Test Title');
    });

    it('should extract content from md-content div', () => {
      const html = '<html><body><h1>Title</h1><div class="md-content" data-md-component="content"><p>Test content</p></div></body></html>';
      const result = converter.extractContent(html);
      expect(result.content).toContain('Test content');
    });

    it('should fall back to body when md-content is not present', () => {
      const html = '<html><body><p>Test content</p></body></html>';
      const result = converter.extractContent(html);
      expect(result.content).toContain('Test content');
    });
    
    it('should extract complete content from md-content div with nested elements', () => {
      const html = `
        <html>
          <body>
            <div class="md-content" data-md-component="content">
              <h2>Section 1</h2>
              <p>First paragraph</p>
              <div class="nested">
                <h3>Subsection</h3>
                <p>Nested content</p>
              </div>
              <h2>Section 2</h2>
              <p>Final paragraph</p>
            </div>
          </body>
        </html>
      `;
      const result = converter.extractContent(html);
      expect(result.content).toContain('Section 1');
      expect(result.content).toContain('First paragraph');
      expect(result.content).toContain('Subsection');
      expect(result.content).toContain('Nested content');
      expect(result.content).toContain('Section 2');
      expect(result.content).toContain('Final paragraph');
    });
  });

  describe('[Markdown-Conversion] When converting HTML to markdown', () => {
    it('should convert paragraphs to markdown', () => {
      const html = '<p>Test paragraph</p>';
      const result = converter.convert(html);
      expect(result).toBe('Test paragraph');
    });

    it('should convert headings to markdown', () => {
      const html = '<h1>Heading 1</h1><h2>Heading 2</h2>';
      const result = converter.convert(html);
      expect(result).toContain('# Heading 1');
      expect(result).toContain('## Heading 2');
    });

    it('should convert code blocks with language', () => {
      const html = '<pre><code class="language-typescript">const x = 1;</code></pre>';
      const result = converter.convert(html);
      expect(result).toContain('```typescript');
      expect(result).toContain('const x = 1;');
      expect(result).toContain('```');
    });

    it('should convert lists to markdown', () => {
      const html = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      const result = converter.convert(html);
      expect(result).toContain('* Item 1');
      expect(result).toContain('* Item 2');
    });
  });
});
