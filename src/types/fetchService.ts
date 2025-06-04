import type { ContentType as ContentTypeMap } from '../constants.ts';

type ContentType =
  | (typeof ContentTypeMap)[keyof typeof ContentTypeMap]
  | Lowercase<(typeof ContentTypeMap)[keyof typeof ContentTypeMap]>;

/**
 * Type definition for Request Cache modes
 */
type RequestCache =
  | 'default'
  | 'no-store'
  | 'reload'
  | 'no-cache'
  | 'force-cache'
  | 'only-if-cached';

/**
 * Interface for Response from fetch
 */
type Response = {
  status: number;
  statusText: string;
  ok: boolean;
  headers: Headers;
  url: string;
  // biome-ignore lint/suspicious/noExplicitAny: TODO: narrow this down
  json(): Promise<any>;
  text(): Promise<string>;
  buffer(): Promise<Buffer>;
  arrayBuffer(): Promise<ArrayBuffer>;
};

/**
 * Cache statistics interface
 */
type CacheStats = {
  size: number;
  entries: number;
  oldestEntry: Date | null;
  newestEntry: Date | null;
};

/**
 * Options for fetch operations
 */
type FetchOptions = {
  // Standard fetch options
  method?: string;
  headers?: Record<string, string> | Headers;
  // biome-ignore lint/suspicious/noExplicitAny: TODO: narrow this down
  body?: any;
  redirect?: 'follow' | 'error' | 'manual';
  follow?: number;
  timeout?: number;
  compress?: boolean;
  size?: number;

  // make-fetch-happen options
  cachePath?: string;
  cache?: RequestCache;
  cacheAdditionalHeaders?: string[];
  proxy?: string | URL;
  noProxy?: string | string[];
  retry?:
    | boolean
    | number
    | {
        retries?: number;
        factor?: number;
        minTimeout?: number;
        maxTimeout?: number;
        randomize?: boolean;
      };
  onRetry?: (cause: Error | Response) => void;
  integrity?: string;
  maxSockets?: number;

  // Our custom option to select content type
  contentType?: ContentType;
};

/**
 * Configuration for the cache system
 */
type CacheConfig = {
  basePath: string;
  contentTypes: {
    [key in ContentType]?: {
      path: string;
      maxAge: number; // in milliseconds
      cacheMode?: RequestCache;
      retries?: number;
      factor?: number;
      minTimeout?: number;
      maxTimeout?: number;
    };
  };
};

export type {
  ContentType,
  RequestCache,
  Response,
  CacheStats,
  FetchOptions,
  CacheConfig,
};
