import { z } from 'zod';
import { ALLOWED_DOMAIN, runtimes } from '../../constants.ts';

/**
 * Schema for the input of the tool.
 *
 * Used to parse the tool arguments and validate them before calling the tool.
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
      const version = pathParts[2];
      const isValidSemver = /^\d+\.\d+\.\d+$/.test(version);
      const isLatest = version === 'latest';
      if (isValidSemver === false && isLatest === false) {
        return false;
      }

      return true;
    })
    .transform((url) => {
      const parsedUrl = new URL(url);
      parsedUrl.pathname = parsedUrl.pathname.replace(/\/$/, '');
      parsedUrl.pathname = `${parsedUrl.pathname}/index.md`;
      return parsedUrl;
    }),
};

export { schema };
