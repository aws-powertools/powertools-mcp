import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { POWERTOOLS_BASE_URL } from '../../src/constants.ts';
import { schema, tool } from '../../src/tools/fetchDocPage/index.ts';
import {
  getRemotePage,
  getRemotePageETag,
} from '../../src/tools/fetchDocPage/utils.ts';

const mocks = vi.hoisted(() => ({
  getFromCache: vi.fn(),
  writeToCache: vi.fn(),
}));

vi.mock('cacache', async (importOriginal) => ({
  ...(await importOriginal<typeof import('cacache')>()),
  get: mocks.getFromCache,
  put: mocks.writeToCache,
}));

describe('schema', () => {
  it.each([
    {
      type: 'latest',
      url: `${POWERTOOLS_BASE_URL}/typescript/latest/features/metrics/`,
    },
    {
      type: 'semver',
      url: `${POWERTOOLS_BASE_URL}/typescript/1.2.4/features/metrics/`,
    },
    {
      type: 'dotnet no version',
      url: `${POWERTOOLS_BASE_URL}/dotnet/features/metrics/`,
    },
  ])('parses a valid URL ($type)', ({ url }) => {
    // Act
    const result = schema.url.parse(url);

    // Assess
    expect(result).toEqual(new URL(`${url}index.md`));
  });

  it('handles an URL without a trailing slash', () => {
    // Prepare
    const url = `${POWERTOOLS_BASE_URL}/typescript/latest/features/metrics`;

    // Act
    const result = schema.url.parse(url);

    // Assess
    expect(result).toEqual(new URL(`${url}/index.md`));
  });

  it('rejects an invalid URL', () => {
    // Prepare
    const url = 'https://foo';

    // Act & Assess
    expect(() => schema.url.parse(url)).toThrow();
  });

  it('rejects an URL not allow-listed', () => {
    // Prepare
    const url = 'https://foo.com/typescript/latest/features/metrics/';

    // Act & Assess
    expect(() => schema.url.parse(url)).toThrow();
  });

  it('rejects an URL with an invalid runtime', () => {
    // Prepare
    const url = `${POWERTOOLS_BASE_URL}/invalid-runtime/latest/features/metrics/`;

    // Act & Assess
    expect(() => schema.url.parse(url)).toThrow();
  });

  it('rejects an URL with an invalid version', () => {
    // Prepare
    const invalidUrl = `${POWERTOOLS_BASE_URL}/typescript/invalid-version/features/metrics/`;

    // Act & Assess
    expect(() => schema.url.parse(invalidUrl)).toThrow();
  });
});

describe('utils', () => {
  describe('getRemotePage', () => {
    const server = setupServer(
      ...[
        http.get(
          `${POWERTOOLS_BASE_URL}/typescript/latest/features/metrics/index.md`,
          () =>
            HttpResponse.text(
              'Metrics is a feature of PowerTools for TypeScript.',
              {
                headers: {
                  'Content-Type': 'text/markdown',
                  ETag: '"12345"',
                },
              }
            )
        ),
        http.get(
          `${POWERTOOLS_BASE_URL}/typescript/latest/features/no-etag-for-some-reason.md`,
          () =>
            HttpResponse.text(
              'Metrics is a feature of PowerTools for TypeScript.'
            )
        ),
        http.get(
          `${POWERTOOLS_BASE_URL}/typescript/1.2.4/features/non-existent`,
          () => HttpResponse.json({ error: 'Not found' }, { status: 404 })
        ),
        http.get(
          `${POWERTOOLS_BASE_URL}/typescript/1.2.4/features/panic.md`,
          () => new HttpResponse(null, { status: 500 })
        ),
      ]
    );

    beforeAll(() => server.listen());
    afterEach(() => server.resetHandlers());
    afterAll(() => server.close());

    it('fetches a remote page', async () => {
      // Prepare
      const url = new URL(
        `${POWERTOOLS_BASE_URL}/typescript/latest/features/metrics/index.md`
      );

      // Act
      const result = await getRemotePage(url);

      // Assess
      expect(result.markdown).toBe(
        'Metrics is a feature of PowerTools for TypeScript.'
      );
      expect(result.eTag).toBe('12345');
    });

    it('fetches a remote page without ETag', async () => {
      // Prepare
      const url = new URL(
        `${POWERTOOLS_BASE_URL}/typescript/latest/features/no-etag-for-some-reason.md`
      );

      // Act
      const result = await getRemotePage(url);

      // Assess
      expect(result.markdown).toBe(
        'Metrics is a feature of PowerTools for TypeScript.'
      );
      expect(result.eTag).toBeNull();
    });

    it('throws an error for a non-existent page', async () => {
      // Prepare
      const url = new URL(
        `${POWERTOOLS_BASE_URL}/typescript/1.2.4/features/non-existent`
      );

      // Act & Assess
      await expect(getRemotePage(url)).rejects.toThrow(
        expect.objectContaining({
          message: 'Failed to fetch remote page',
          cause: expect.objectContaining({
            message: 'Failed to fetch page content: 404 Not Found',
          }),
        })
      );
    });

    it('throws an error for a server error', async () => {
      // Prepare
      const url = new URL(
        `${POWERTOOLS_BASE_URL}/typescript/1.2.4/features/panic.md`
      );

      // Act & Assess
      await expect(getRemotePage(url)).rejects.toThrow(
        expect.objectContaining({
          message: 'Failed to fetch remote page',
          cause: expect.objectContaining({
            message: 'Failed to fetch page content: 500 Internal Server Error',
          }),
        })
      );
    });
  });

  describe('getRemotePageETag', () => {
    const server = setupServer(
      ...[
        http.head(
          `${POWERTOOLS_BASE_URL}/typescript/latest/features/metrics/index.md`,
          () => new HttpResponse(null, { headers: { etag: '"12345"' } })
        ),
        http.head(
          `${POWERTOOLS_BASE_URL}/typescript/latest/features/no-etag-for-some-reason.md`,
          () => new HttpResponse(null)
        ),
        http.head(
          `${POWERTOOLS_BASE_URL}/typescript/1.2.4/features/non-existent`,
          () => HttpResponse.json({ error: 'Not found' }, { status: 404 })
        ),
        http.head(
          `${POWERTOOLS_BASE_URL}/typescript/1.2.4/features/panic.md`,
          () => new HttpResponse(null, { status: 500 })
        ),
      ]
    );

    beforeAll(() => server.listen());
    afterEach(() => server.resetHandlers());
    afterAll(() => server.close());

    it('fetches the ETag of a remote page', async () => {
      // Prepare
      const url = new URL(
        `${POWERTOOLS_BASE_URL}/typescript/latest/features/metrics/index.md`
      );

      // Act
      const result = await getRemotePageETag(url);

      // Assess
      expect(result).toBe('12345');
    });

    it('returns null for a remote page without ETag', async () => {
      // Prepare
      const url = new URL(
        `${POWERTOOLS_BASE_URL}/typescript/latest/features/no-etag-for-some-reason.md`
      );

      // Act
      const result = await getRemotePageETag(url);

      // Assess
      expect(result).toBeNull();
    });

    it('throws an error for a non-existent page', async () => {
      // Prepare
      const url = new URL(
        `${POWERTOOLS_BASE_URL}/typescript/1.2.4/features/non-existent`
      );

      // Act & Assess
      await expect(getRemotePageETag(url)).rejects.toThrow(
        expect.objectContaining({
          message: 'Failed to fetch remote page eTag',
          cause: expect.objectContaining({
            message: 'Request to fetch eTag failed: 404 Not Found',
          }),
        })
      );
    });

    it('throws an error for a server error', async () => {
      // Prepare
      const url = new URL(
        `${POWERTOOLS_BASE_URL}/typescript/1.2.4/features/panic.md`
      );

      // Act & Assess
      await expect(getRemotePageETag(url)).rejects.toThrow(
        expect.objectContaining({
          message: 'Failed to fetch remote page eTag',
          cause: expect.objectContaining({
            message: 'Request to fetch eTag failed: 500 Internal Server Error',
          }),
        })
      );
    });
  });
});

describe('tool', () => {
  const baseUrl = `${POWERTOOLS_BASE_URL}/typescript/latest/features/`;
  const server = setupServer(
    ...[
      http.get(
        `${POWERTOOLS_BASE_URL}/typescript/latest/features/metrics/index.md`,
        () =>
          HttpResponse.text(
            'Metrics is a feature of PowerTools for TypeScript.',
            {
              headers: {
                'Content-Type': 'text/markdown',
                ETag: '"12345"',
              },
            }
          )
      ),
      http.head(
        `${POWERTOOLS_BASE_URL}/typescript/latest/features/metrics/index.md`,
        () =>
          HttpResponse.text(null, {
            headers: {
              'Content-Type': 'text/markdown',
              ETag: '"12345"',
            },
          })
      ),
      http.get(
        `${POWERTOOLS_BASE_URL}/typescript/latest/features/no-etag-for-some-reason.md`,
        () =>
          HttpResponse.text(
            'Metrics is a feature of PowerTools for TypeScript.'
          )
      ),
      http.get(
        `${POWERTOOLS_BASE_URL}/typescript/latest/features/non-existent`,
        () => HttpResponse.json({ error: 'Not found' }, { status: 404 })
      ),
    ]
  );

  beforeAll(() => server.listen());
  afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
  });
  afterAll(() => server.close());

  it('returns cached markdown if ETag matches', async () => {
    // Prepare
    mocks.getFromCache.mockResolvedValueOnce({
      data: Buffer.from('12345'),
    });
    const expectedContent =
      'Metrics is a feature of PowerTools for TypeScript.';
    mocks.getFromCache.mockResolvedValueOnce({
      data: Buffer.from(expectedContent),
    });
    const url = new URL(`${baseUrl}metrics/index.md`);
    const cacheKey = url.pathname;

    // Act
    const result = await tool({ url });

    // Assess
    expect(result.content).toBeResponseWithText(expectedContent);
    expect(mocks.getFromCache).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('markdown-cache'),
      `${cacheKey}-etag`
    );
    expect(mocks.getFromCache).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('markdown-cache'),
      `${cacheKey}`
    );
    expect(mocks.writeToCache).not.toHaveBeenCalled();
    expect(console.debug).toHaveLogged(
      expect.objectContaining({
        message: 'cached eTag matches, returning cached markdown',
      })
    );
  });

  it('skips cache if both cached and remote ETags are null', async () => {
    // Prepare
    mocks.getFromCache.mockRejectedValueOnce(new Error('Cache miss'));
    const url = new URL(`${baseUrl}no-etag-for-some-reason.md`);
    const cacheKey = url.pathname;

    // Act
    const result = await tool({ url });

    // Assess
    expect(result.content).toBeResponseWithText(
      'Metrics is a feature of PowerTools for TypeScript.'
    );
    expect(mocks.getFromCache).toHaveBeenCalledExactlyOnceWith(
      expect.stringContaining('markdown-cache'),
      `${cacheKey}-etag`
    );
    expect(console.debug).toHaveLogged(
      expect.objectContaining({
        message: 'No cached ETag and remote ETag found, fetching remote page',
      })
    );
  });

  it('fetches a doc page and updates the cache if ETag does not match', async () => {
    // Prepare
    mocks.getFromCache.mockResolvedValueOnce({
      data: Buffer.from('54321'),
    });
    const url = new URL(`${baseUrl}metrics/index.md`);
    const cacheKey = url.pathname;
    const expectedContent =
      'Metrics is a feature of PowerTools for TypeScript.';

    // Act
    const result = await tool({ url });

    // Assess
    expect(result.content).toBeResponseWithText(expectedContent);
    expect(mocks.getFromCache).toHaveBeenCalledExactlyOnceWith(
      expect.stringContaining('markdown-cache'),
      `${cacheKey}-etag`
    );
    expect(mocks.writeToCache).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('markdown-cache'),
      `${cacheKey}-etag`,
      '12345'
    );
    expect(mocks.writeToCache).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('markdown-cache'),
      cacheKey,
      expectedContent
    );
    expect(console.debug).toHaveLogged(
      expect.objectContaining({
        message:
          'ETag mismatch: local 54321 vs remote 12345; fetching remote page',
      })
    );
  });

  it('fetches a doc page anyway if the cache is incomplete', async () => {
    // Prepare
    mocks.getFromCache.mockResolvedValueOnce({
      data: Buffer.from('12345'),
    });
    mocks.getFromCache.mockRejectedValueOnce(new Error('Cache miss'));
    const url = new URL(`${baseUrl}metrics/index.md`);
    const cacheKey = url.pathname;
    const expectedContent =
      'Metrics is a feature of PowerTools for TypeScript.';

    // Act
    const result = await tool({ url });

    // Assess
    expect(result.content).toBeResponseWithText(expectedContent);
    expect(mocks.getFromCache).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('markdown-cache'),
      `${cacheKey}-etag`
    );
    expect(mocks.getFromCache).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('markdown-cache'),
      cacheKey
    );
    expect(mocks.writeToCache).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('markdown-cache'),
      `${cacheKey}-etag`,
      '12345'
    );
    expect(mocks.writeToCache).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('markdown-cache'),
      cacheKey,
      expectedContent
    );
    expect(console.debug).toHaveLogged(
      expect.objectContaining({
        message:
          'Cached markdown not found even though ETag matches; cache may be corrupted',
      })
    );
  });

  it('gracefully handles errors when fetching remote page', async () => {
    // Prepare
    mocks.getFromCache.mockResolvedValueOnce(null);
    const url = new URL(`${baseUrl}non-existent`);

    // Act
    const result = await tool({ url });

    // Assess
    expect(result.content).toBeResponseWithText('Failed to fetch remote page');
    expect(result.isError).toBe(true);
    expect(mocks.writeToCache).not.toHaveBeenCalled();
  });
});
