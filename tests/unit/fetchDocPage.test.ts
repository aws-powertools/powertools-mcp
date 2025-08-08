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
import { schema, tool } from '../../src/tools/fetchDocPage/index.ts';

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

  it('fetches a documentation page', async () => {
    // Prepare
    mocks.getFromCache.mockRejectedValueOnce(new Error('Cache miss'));
    const url = new URL(`${baseUrl}metrics`);
    const cacheKey = `${url.pathname}/index.md`;

    // Act
    const result = await tool({ url: url.toString() });

    // Assess
    expect(result.content).toBeResponseWithText(
      'Metrics is a feature of PowerTools for TypeScript.'
    );
    expect(mocks.getFromCache).toHaveBeenCalledExactlyOnceWith(
      expect.stringContaining(CACHE_BASE_PATH),
      `${cacheKey}-etag`
    );
  });

  it('gracefully handles errors when fetching remote page', async () => {
    // Prepare
    mocks.getFromCache.mockResolvedValueOnce(null);
    const url = new URL(`${baseUrl}non-existent`);

    // Act
    const result = await tool({ url: url.toString() });

    // Assess
    expect(result.content).toBeResponseWithText(
      'Failed to fetch remote resource'
    );
    expect(result.isError).toBe(true);
    expect(mocks.writeToCache).not.toHaveBeenCalled();
  });
});
