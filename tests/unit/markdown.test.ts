import { it, expect } from 'vitest';
import { NodeHtmlMarkdownConverter } from '../../src/markdown.ts';

it('extracts title from h1 tag', () => {
  // Prepare
  const converter = new NodeHtmlMarkdownConverter();
  const html =
    '<html><body><h1>Test Title</h1><div>Content</div></body></html>';

  // Act
  const result = converter.extractContent(html);

  // Assess
  expect(result.title).toBe('Test Title');
});

it('extracts title from title tag when h1 is not present', () => {
  // Prepare
  const converter = new NodeHtmlMarkdownConverter();
  const html =
    '<html><head><title>Test Title</title></head><body><div>Content</div></body></html>';

  // Act
  const result = converter.extractContent(html);

  // Assess
  expect(result.title).toBe('Test Title');
});

it('extracts content from md-content div', () => {
  // Prepare
  const converter = new NodeHtmlMarkdownConverter();
  const html =
    '<html><body><h1>Title</h1><div class="md-content" data-md-component="content"><p>Test content</p></div></body></html>';

  // Act
  const result = converter.extractContent(html);

  // Assess
  expect(result.content).toContain('Test content');
});

it('falls back to body when md-content is not present', () => {
  // Prepare
  const converter = new NodeHtmlMarkdownConverter();
  const html = '<html><body><p>Test content</p></body></html>';

  // Act
  const result = converter.extractContent(html);

  // Assess
  expect(result.content).toContain('Test content');
});

it('extracts complete content from md-content div with nested elements', () => {
  // Prepare
  const converter = new NodeHtmlMarkdownConverter();
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

  // Act
  const result = converter.extractContent(html);

  // Assess
  expect(result.content).toContain('Section 1');
  expect(result.content).toContain('First paragraph');
  expect(result.content).toContain('Subsection');
  expect(result.content).toContain('Nested content');
  expect(result.content).toContain('Section 2');
  expect(result.content).toContain('Final paragraph');
});

it('converts paragraphs to markdown', () => {
  // Prepare
  const converter = new NodeHtmlMarkdownConverter();
  const html = '<p>Test paragraph</p>';

  // Act
  const result = converter.convert(html);

  // Assess
  expect(result).toBe('Test paragraph');
});

it('convert headings to markdown', () => {
  // Prepare
  const converter = new NodeHtmlMarkdownConverter();
  const html = '<h1>Heading 1</h1><h2>Heading 2</h2>';

  // Act
  const result = converter.convert(html);

  // Assess
  expect(result).toContain('# Heading 1');
  expect(result).toContain('## Heading 2');
});

it('convert code blocks with language', () => {
  // Prepare
  const converter = new NodeHtmlMarkdownConverter();
  const html =
    '<pre><code class="language-typescript">const x = 1;</code></pre>';

  // Act
  const result = converter.convert(html);

  // Assess
  expect(result).toContain('```typescript');
  expect(result).toContain('const x = 1;');
  expect(result).toContain('```');
});

it('converts lists to markdown', () => {
  // Prepare
  const converter = new NodeHtmlMarkdownConverter();
  const html = '<ul><li>Item 1</li><li>Item 2</li></ul>';

  // Act
  const result = converter.convert(html);

  // Assess
  expect(result).toContain('* Item 1');
  expect(result).toContain('* Item 2');
});
