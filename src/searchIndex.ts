import cacheConfig from './config/cache';
import { FetchService } from './services/fetch';
import { ContentType } from './services/fetch/types';
import { logger } from './services/logger';

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

// Initialize the fetch service with disk-based caching
const fetchService = new FetchService(cacheConfig);

// Base URL for Powertools documentation
const POWERTOOLS_BASE_URL = 'https://docs.powertools.aws.dev/lambda';

// Function to get the search index URL for a runtime
function getSearchIndexUrl(runtime: string, version = 'latest'): string {
    // Python and TypeScript include version in URL, Java and .NET don't
    if (runtime === 'python' || runtime === 'typescript') {
        return `${POWERTOOLS_BASE_URL}/${runtime}/${version}/search/search_index.json`;
    } else {
        // For Java and .NET, no version in URL
        return `${POWERTOOLS_BASE_URL}/${runtime}/search/search_index.json`;
    }
}

// Function to fetch the search index for a runtime
async function fetchSearchIndex(runtime: string, version = 'latest'): Promise<MkDocsSearchIndex | undefined> {
    try {
        const url = getSearchIndexUrl(runtime, version);
        const response = await fetchService.fetch(url, {
            contentType: ContentType.WEB_PAGE,
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to fetch search index: ${response.status} ${response.statusText}`);
        }
        
        const indexData = await response.json();
        return indexData as MkDocsSearchIndex;
    } catch (error) {
        logger.info(`Error fetching search index for ${runtime}: ${error}`);
        return undefined;
    }
}

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
            // Fetch the index data from the live website
            const mkDocsIndex = await fetchSearchIndex(runtime, version);
            
            if (!mkDocsIndex) {
                throw new Error(`Failed to fetch index for runtime: ${runtime}`);
            }
            
            // Convert to Lunr index
            const { index, documents } = mkDocsToLunrIndex(mkDocsIndex);
            
            // Create the search index
            const searchIndex: SearchIndex = {
                runtime,
                version,
                url: getSearchIndexUrl(runtime, version),
                index,
                documents
            };
            
            // Cache the index
            this.indices.set(this.getCacheKey(runtime, version), searchIndex);
            
            return searchIndex;
        } catch (error) {
            logger.info(`Error loading search index [${runtime}]: ${error}`);
            return undefined;
        }
    }
}

/**
 * Search for documents in the index
 * @param index The lunr index to search
 * @param documents The document map for retrieving full documents
 * @param query The search query
 * @param limit Maximum number of results to return (default: 10)
 * @param scoreThreshold Score threshold below max score (default: 10)
 * @returns Array of search results with scores, filtered by relevance and limited to the top results
 */
export function searchDocuments(
    index: lunr.Index, 
    documents: Map<string, any>, 
    query: string, 
    limit: number = 10,
    scoreThreshold: number = 10
) {
    try {
        // Perform the search
        const results = index.search(query);
        
        if (results.length === 0) {
            return [];
        }
        
        // Find the maximum score
        const maxScore = results[0].score;
        
        // Filter results to only include those within the threshold of the max score
        const filteredResults = results.filter(result => {
            return (maxScore - result.score) <= scoreThreshold;
        });
        
        // Apply limit if there are still too many results
        const limitedResults = filteredResults.length > limit 
            ? filteredResults.slice(0, limit) 
            : filteredResults;
        
        // Enhance results with document data
        return limitedResults.map(result => {
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
        logger.info(`Search error: ${error}`);
        return [];
    }
}
