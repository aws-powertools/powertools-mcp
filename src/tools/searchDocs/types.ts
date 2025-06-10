import type { z } from 'zod';
import type { schema } from './schemas.ts';

type ToolProps = {
  search: z.infer<typeof schema.search>;
  runtime: z.infer<typeof schema.runtime>;
  version: z.infer<typeof schema.version>;
};

// Define the structure of MkDocs search index
interface MkDocsSearchIndex {
  config: {
    lang: string[];
    separator: string;
    pipeline: string[];
  };
  docs: Array<{
    location: string;
    title: string;
    text: string;
    tags?: string[];
  }>;
}

export type { ToolProps, MkDocsSearchIndex };
