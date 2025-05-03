/**
 * Represents different content types for the fetch service
 */
export enum ContentType {
    WEB_PAGE = 'web-page',
    MARKDOWN = 'markdown'
}
  
/**
 * Type definition for Request Cache modes
 */
export type RequestCache = 'default' | 'no-store' | 'reload' | 'no-cache' | 'force-cache' | 'only-if-cached';

/**
 * Interface for Response from fetch
 */
export interface Response {
  status: number;
  statusText: string;
  ok: boolean;
  headers: Headers;
  url: string;
  
  json(): Promise<any>;
  text(): Promise<string>;
  buffer(): Promise<Buffer>;
  arrayBuffer(): Promise<ArrayBuffer>;
}

/**
 * Cache statistics interface
 */
export interface CacheStats {
  size: number;
  entries: number;
  oldestEntry: Date | null;
  newestEntry: Date | null;
}

/**
 * Options for fetch operations
 */
export interface FetchOptions {
  // Standard fetch options
  method?: string;
  headers?: Record<string, string> | Headers;
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
  retry?: boolean | number | {
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
}

/**
 * Configuration for the cache system
 */
export interface CacheConfig {
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
    }
  }
}
