import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  getNumberFromEnv,
  getStringFromEnv,
} from '@aws-lambda-powertools/commons/utils/env';

const MCP_SERVER_NAME = 'powertools-for-aws-mcp' as const;

// Allowed domain for security
const ALLOWED_DOMAIN = 'docs.powertools.aws.dev';
// Base URL for Powertools documentation
const POWERTOOLS_BASE_URL = 'https://docs.powertools.aws.dev/lambda';

const FETCH_TIMEOUT_MS = 15000; // 15 seconds timeout for fetch operations

const runtimes = ['java', 'dotnet', 'typescript', 'python'] as const;

const CACHE_BASE_PATH = getStringFromEnv({
  key: 'CACHE_BASE_PATH',
  defaultValue: join(tmpdir(), 'powertools-mcp'),
});

/**
 * Threshold for search confidence out of 100.
 */
const SEARCH_CONFIDENCE_THRESHOLD = getNumberFromEnv({
  key: 'SEARCH_CONFIDENCE_THRESHOLD',
  defaultValue: 30,
});

export {
  MCP_SERVER_NAME,
  ALLOWED_DOMAIN,
  FETCH_TIMEOUT_MS,
  runtimes,
  POWERTOOLS_BASE_URL,
  CACHE_BASE_PATH,
  SEARCH_CONFIDENCE_THRESHOLD,
};
