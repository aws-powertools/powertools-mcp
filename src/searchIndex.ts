import dotnetIndex from '../indexes/dotnet_index.json';
import javaIndex from '../indexes/java_index.json';
import pythonIndex from '../indexes/python_index.json';    
import typescriptIndex from '../indexes/typescript_index.json';

import lunr from 'lunr';

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

// Map of runtime to index data
const indexMap = {
    dotnet: dotnetIndex as MkDocsSearchIndex,
    java: javaIndex as MkDocsSearchIndex,
    python: pythonIndex as MkDocsSearchIndex,
    typescript: typescriptIndex as MkDocsSearchIndex,
};

// Define our search index structure
export interface SearchIndex {
    runtime: string;
    version: string;
    url: string;
    index: lunr.Index | undefined;
    documents: Map<string, any> | undefined;
}

/**
 * Convert MkDocs search index to Lunr index
 * Based on the mkdocs-material implementation
 * Optimized to store only essential fields in the document map to reduce memory usage
 */
function mkDocsToLunrIndex(mkDocsIndex: MkDocsSearchIndex): { index: lunr.Index, documents: Map<string, any> } {
    // Create a document map for quick lookups - with minimal data
    const documents = new Map<string, any>();
    
    // Add only essential document data to the map
    for (const doc of mkDocsIndex.docs) {
        documents.set(doc.location, {
            title: doc.title,
            location: doc.location,
            // Store a truncated preview of text instead of the full content
            preview: doc.text ? doc.text.substring(0, 200) + (doc.text.length > 200 ? '...' : '') : '',
            // Optionally store tags if needed
            tags: doc.tags || []
        });
    }
    
    // Create a new lunr index
    const index = lunr(function() {
        // Configure the index based on mkdocs config
        this.ref('location');
        this.field('title', { boost: 10 });
        this.field('text');
        
        // Add documents to the index
        for (const doc of mkDocsIndex.docs) {
            // Skip empty documents
            if (!doc.location && !doc.title && !doc.text) continue;
            
            this.add({
                location: doc.location,
                title: doc.title,
                text: doc.text,
                tags: doc.tags || []
            });
        }
    });
    
    return { index, documents };
}

export class SearchIndexFactory {
    readonly indices: Map<string, SearchIndex>;

    constructor() {
        this.indices = new Map<string, SearchIndex>();
    }

    protected getCacheKey(runtime: string, version = 'latest'): string {
        return `${runtime}-${version}`;
    }

    async getIndex(runtime: string, version = 'latest'): Promise<SearchIndex | undefined> {
        const cacheKey = this.getCacheKey(runtime, version);

        if (this.indices.has(cacheKey)) {
            return this.indices.get(cacheKey);
        }

        // Load the cache key and return the index result
        return await this.loadIndexData(runtime, version);
    }

    protected async loadIndexData(runtime: string, version = 'latest'): Promise<SearchIndex | undefined> {
        try {
            // Get the index data from the imported JSON
            const mkDocsIndex = indexMap[runtime as keyof typeof indexMap];
            
            if (!mkDocsIndex) {
                throw new Error(`Invalid runtime: ${runtime}`);
            }
            
            // Convert to Lunr index
            const { index, documents } = mkDocsToLunrIndex(mkDocsIndex);
            
            // Create the search index
            const searchIndex: SearchIndex = {
                runtime,
                version,
                url: `../indexes/${runtime}_index.json`,
                index,
                documents
            };
            
            // Cache the index
            this.indices.set(this.getCacheKey(runtime, version), searchIndex);
            
            return searchIndex;
        } catch (error) {
            console.error(`Error loading search index [${runtime}]: ${error}`);
            return undefined;
        }
    }
}

/**
 * Search for documents in the index
 * @param index The lunr index to search
 * @param documents The document map for retrieving full documents
 * @param query The search query
 * @returns Array of search results with scores
 */
export function searchDocuments(index: lunr.Index, documents: Map<string, any>, query: string) {
    try {
        // Perform the search
        const results = index.search(query);
        
        // Enhance results with document data
        return results.map(result => {
            const doc = documents.get(result.ref);
            return {
                ref: result.ref,
                score: result.score,
                title: doc?.title || '',
                // Use the preview instead of full text
                snippet: doc?.preview || '',
                location: doc?.location || '',
                matchData: result.matchData
            };
        });
    } catch (error) {
        console.error(`Search error: ${error}`);
        return [];
    }
}
