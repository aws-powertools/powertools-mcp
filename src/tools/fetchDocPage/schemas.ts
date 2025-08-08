import { z } from 'zod';
import { ALLOWED_DOMAIN, runtimes } from '../../constants.ts';

/**
 * Schema for the input of the tool.
 *
 * Used to parse the tool arguments and validate them before calling the tool.
 *
 * TypeScript and Python runtimes support semantic versioning (x.y.z) or 'latest' in the URL,
 * so we validate the URL structure accordingly.
 */
const schema = {
  url: z
    .string()
    .url()
    .refine((url) => {
      const parsedUrl = new URL(url);
      if (parsedUrl.hostname !== ALLOWED_DOMAIN) {
        return false;
      }
      const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
      const runtime = pathParts[1];
      if (!runtimes.includes(runtime as (typeof runtimes)[number])) {
        return false;
      }
      if (
        runtime === 'typescript' ||
        runtime === 'python' ||
        runtime === 'java'
      ) {
        const version = pathParts[2];
        const isValidSemver = /^\d+\.\d+\.\d+$/.test(version);
        const isLatest = version === 'latest';
        if (isValidSemver === false && isLatest === false) {
          return false;
        }
      }

      return true;
    })
    .transform((url) => {
      const parsedUrl = new URL(url);
      parsedUrl.pathname = parsedUrl.pathname.replace(/\/$/, '');
      parsedUrl.pathname = `${parsedUrl.pathname}/index.md`;
      return parsedUrl;
    }),
} as const;

export { schema };
