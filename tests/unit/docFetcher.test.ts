import { it, expect, beforeEach, vi } from 'vitest';
import { ContentType } from '../../src/constants.ts';
import { clearDocCache, fetchDocPage } from '../../src/docFetcher.ts';

const mocks = vi.hoisted(() => ({
  rmAll: vi.fn(),
  get: {
    info: vi.fn(),
  },
  put: vi.fn(),
  fetch: vi.fn(),
  clearCache: vi.fn(),
}));

vi.mock('../src/fetchService.ts', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../src/fetchService.ts')>()),
  fetchService: {
    fetch: mocks.fetch,
    clearCache: mocks.clearCache,
  },
}));

vi.mock('cacache', async (importOriginal) => ({
  ...(await importOriginal<typeof import('cacache')>()),
  get: {
    info: mocks.get.info,
  },
  put: mocks.put,
  rm: {
    all: mocks.rmAll,
  },
}));

vi.mock('node:crypto', async (importOriginal) => ({
  ...(await importOriginal<typeof import('node:crypto')>()),
  createHash: vi.fn().mockReturnValue({
    update: vi.fn().mockReturnThis(),
    digest: vi.fn().mockReturnValue('mocked-hash'),
  }),
}));

class MockHeaders {
  private headers: Record<string, string> = {};

  constructor(init?: Record<string, string>) {
    if (init) {
      this.headers = { ...init };
    }
  }

  get(name: string): string | null {
    return this.headers[name.toLowerCase()] || null;
  }

  has(name: string): boolean {
    return name.toLowerCase() in this.headers;
  }
}

beforeEach(() => {
  vi.clearAllMocks();
});

it('fetchs a page and convert it to markdown', async () => {
  // Prepare
  const mockHtml = `
      <html>
        <body>
          <div class="md-content" data-md-component="content">
            <h1>Test Heading</h1>
            <p>Test paragraph</p>
          </div>
        </body>
      </html>
    `;
  mocks.fetch.mockResolvedValueOnce({
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new MockHeaders({ etag: 'abc123' }),
    text: vi.fn().mockResolvedValueOnce(mockHtml),
  });
  mocks.get.info = vi.fn().mockRejectedValueOnce(new Error('ENOENT'));
  const url =
    'https://docs.powertools.aws.dev/lambda/python/latest/core/logger/';

  // Act
  const result = await fetchDocPage(url);

  // Assess
  expect(mocks.fetch).toHaveBeenCalledWith(url, expect.any(Object));
  expect(result).toContain('# Test Heading');
  expect(result).toContain('Test paragraph');
});

it('rejects invalid URLs', async () => {
  // Act
  const result = await fetchDocPage('https://example.com/not-allowed');

  // Assess
  expect(mocks.fetch).not.toHaveBeenCalled();
  expect(result).toContain('Error fetching documentation');
  expect(result).toContain('Invalid URL');
});

it('handles fetch errors gracefully', async () => {
  // Arrange
  mocks.fetch.mockRejectedValueOnce(new Error('Network error'));

  // Act
  const result = await fetchDocPage(
    'https://docs.powertools.aws.dev/lambda/python/latest/core/logger/'
  );

  // Assert
  expect(result).toContain('Error fetching documentation');
  expect(result).toContain('Network error');
});

it('handles non-200 responses gracefully', async () => {
  // Prepare
  mocks.fetch.mockResolvedValueOnce({
    ok: false,
    status: 404,
    statusText: 'Not Found',
    headers: new MockHeaders(),
  });

  // Act
  const result = await fetchDocPage(
    'https://docs.powertools.aws.dev/lambda/python/latest/core/nonexistent/'
  );

  // Assess
  expect(result).toContain('Error fetching documentation');
  expect(result).toContain('Failed to fetch page: 404 Not Found');
});

it('clears both web page and markdown caches', async () => {
  // Act
  await clearDocCache();

  // Assess
  expect(mocks.clearCache).toHaveBeenCalledWith(ContentType.WEB_PAGE);
  expect(mocks.rmAll).toHaveBeenCalledWith(
    expect.stringContaining('markdown-cache')
  );
});
