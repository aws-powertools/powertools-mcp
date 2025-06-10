import { z } from 'zod';
import { runtimes } from '../../constants.ts';

/**
 * Schema for the input of the tool.
 *
 * Used to parse the tool arguments and validate them before calling the tool.
 */
const schema = {
  search: z
    .string()
    .refine((val) => val.toLowerCase().trim())
    .describe('what to search for'),
  runtime: z
    .enum(runtimes)
    .refine((val) => val.toLowerCase().trim())
    .describe('the runtime index to search'),
  version: z
    .string()
    .refine((val) => val.toLowerCase().trim())
    .optional()
    .describe('version is always semantic 3 digit in the form x.y.z')
    .default('latest'),
};

export { schema };
