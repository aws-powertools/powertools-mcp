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
import { CACHE_BASE_PATH, POWERTOOLS_BASE_URL } from '../../src/constants.ts';
import { fetchWithCache } from '../../src/tools/shared/fetchWithCache.ts';

const mocks = vi.hoisted(() => ({
  getFromCache: vi.fn(),
  writeToCache: vi.fn(),
}));

vi.mock('cacache', async (importOriginal) => ({
  ...(await importOriginal<typeof import('cacache')>()),
  get: mocks.getFromCache,
  put: mocks.writeToCache,
}));

describe('fetchWithCache', () => {
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

  it('returns cached resource if ETag matches', async () => {
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
    const result = await fetchWithCache({ url, contentType: 'text/markdown' });

    // Assess
    expect(result).toEqual(expectedContent);
    expect(mocks.getFromCache).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining(CACHE_BASE_PATH),
      `${cacheKey}-etag`
    );
    expect(mocks.getFromCache).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining(CACHE_BASE_PATH),
      `${cacheKey}`
    );
    expect(mocks.writeToCache).not.toHaveBeenCalled();
    expect(console.debug).toHaveLogged(
      expect.objectContaining({
        message: 'cached eTag matches, returning cached resource',
      })
    );
  });

  it('skips cache if both cached and remote ETags are null', async () => {
    // Prepare
    mocks.getFromCache.mockRejectedValueOnce(new Error('Cache miss'));
    const url = new URL(`${baseUrl}no-etag-for-some-reason.md`);
    const cacheKey = url.pathname;

    // Act
    const result = await fetchWithCache({ url, contentType: 'text/markdown' });

    // Assess
    expect(result).toEqual(
      'Metrics is a feature of PowerTools for TypeScript.'
    );
    expect(mocks.getFromCache).toHaveBeenCalledExactlyOnceWith(
      expect.stringContaining(CACHE_BASE_PATH),
      `${cacheKey}-etag`
    );
    expect(console.debug).toHaveLogged(
      expect.objectContaining({
        message:
          'No cached ETag and remote ETag found, fetching remote resource',
      })
    );
  });

  it('fetches a resource and updates the cache if ETag does not match', async () => {
    // Prepare
    mocks.getFromCache.mockResolvedValueOnce({
      data: Buffer.from('54321'),
    });
    const url = new URL(`${baseUrl}metrics/index.md`);
    const cacheKey = url.pathname;
    const expectedContent =
      'Metrics is a feature of PowerTools for TypeScript.';

    // Act
    const result = await fetchWithCache({ url, contentType: 'text/markdown' });

    // Assess
    expect(result).toEqual(expectedContent);
    expect(mocks.getFromCache).toHaveBeenCalledExactlyOnceWith(
      expect.stringContaining(CACHE_BASE_PATH),
      `${cacheKey}-etag`
    );
    expect(mocks.writeToCache).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining(CACHE_BASE_PATH),
      `${cacheKey}-etag`,
      '12345'
    );
    expect(mocks.writeToCache).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining(CACHE_BASE_PATH),
      cacheKey,
      expectedContent
    );
    expect(console.debug).toHaveLogged(
      expect.objectContaining({
        message:
          'ETag mismatch: local 54321 vs remote 12345; fetching remote resource',
      })
    );
  });

  it('fetches a resource anyway if the cache is incomplete', async () => {
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
    const result = await fetchWithCache({ url, contentType: 'text/markdown' });

    // Assess
    expect(result).toEqual(expectedContent);
    expect(mocks.getFromCache).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining(CACHE_BASE_PATH),
      `${cacheKey}-etag`
    );
    expect(mocks.getFromCache).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining(CACHE_BASE_PATH),
      cacheKey
    );
    expect(mocks.writeToCache).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining(CACHE_BASE_PATH),
      `${cacheKey}-etag`,
      '12345'
    );
    expect(mocks.writeToCache).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining(CACHE_BASE_PATH),
      cacheKey,
      expectedContent
    );
    expect(console.debug).toHaveLogged(
      expect.objectContaining({
        message:
          'Cached resource not found even though ETag matches; cache may be corrupted',
      })
    );
  });

  it('throws when unable to fetch remote resource', async () => {
    // Prepare
    mocks.getFromCache.mockResolvedValueOnce(null);
    const url = new URL(`${baseUrl}non-existent`);

    // Act & Assess
    await expect(
      fetchWithCache({ url, contentType: 'text/markdown' })
    ).rejects.toThrow(
      expect.objectContaining({
        message: 'Failed to fetch remote resource',
        cause: expect.objectContaining({
          message: `Request to fetch ${url.toString()} failed: 404 Not Found`,
        }),
      })
    );
  });
});
