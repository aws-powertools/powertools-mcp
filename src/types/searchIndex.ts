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

export type { MkDocsSearchIndex };
