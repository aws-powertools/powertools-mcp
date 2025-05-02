// src/types/make-fetch-happen.d.ts
declare module 'make-fetch-happen' {
    export interface Headers {
      append(name: string, value: string): void;
      delete(name: string): void;
      get(name: string): string | null;
      has(name: string): boolean;
      set(name: string, value: string): void;
      forEach(callback: (value: string, name: string) => void): void;
    }
  
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
      blob(): Promise<Blob>;
    }
  
    export interface RequestOptions {
      method?: string;
      body?: any;
      headers?: Record<string, string> | Headers;
      redirect?: 'follow' | 'error' | 'manual';
      follow?: number;
      timeout?: number;
      compress?: boolean;
      size?: number;
      
      // make-fetch-happen specific options
      cachePath?: string;
      cache?: 'default' | 'no-store' | 'reload' | 'no-cache' | 'force-cache' | 'only-if-cached';
      cacheAdditionalHeaders?: string[];
      proxy?: string | URL;
      noProxy?: string | string[];
      ca?: string | Buffer | Array<string | Buffer>;
      cert?: string | Buffer | Array<string | Buffer>;
      key?: string | Buffer | Array<string | Buffer>;
      strictSSL?: boolean;
      localAddress?: string;
      maxSockets?: number;
      retry?: boolean | number | {
        retries?: number;
        factor?: number;
        minTimeout?: number;
        maxTimeout?: number;
        randomize?: boolean;
      };
      onRetry?: (cause: Error | Response) => void;
      integrity?: string;
      dns?: any;
      agent?: any;
    }
  
    // Function that makes fetch requests
    export type FetchImplementation = (url: string | URL, options?: RequestOptions) => Promise<Response>;
  
    // Function that returns a configured fetch function
    export function defaults(options?: RequestOptions): FetchImplementation;
    export function defaults(defaultUrl?: string | URL, options?: RequestOptions): FetchImplementation;
    
    // Default export
    const fetch: FetchImplementation;
    export default fetch;
  }