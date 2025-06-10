import type { z } from 'zod';
import type { schema } from './schemas.ts';

type ToolProps = {
  url: z.infer<typeof schema.url>;
};

export type { ToolProps };
