import type { z } from 'zod';
import type { schema } from './schemas.ts';

type ToolProps = {
  search: z.infer<typeof schema.search>;
  runtime: z.infer<typeof schema.runtime>;
  version: z.infer<typeof schema.version>;
};

// Define the structure of MkDocs search index
interface SearchConfig {
  lang: string[];
  separator: string;
  pipeline: string[];
}

interface SearchDocument {
  location: string;
  title: string;
  text: string;
  tags?: string[];
  boost?: number;
  parent?: SearchDocument;
}

interface SearchOptions {
  suggest: boolean;
}

interface MkDocsSearchIndex {
  config: SearchConfig;
  docs: SearchDocument[];
  options?: SearchOptions;
}

export type { ToolProps, MkDocsSearchIndex, SearchConfig, SearchDocument, SearchOptions };
