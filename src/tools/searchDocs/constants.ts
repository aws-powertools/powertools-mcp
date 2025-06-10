const name = 'search_docs' as const;
const description =
  'Search Powertools for AWS Lambda documentation to learn about Serverless best practices. ' +
  "Try searching for features like 'Logger', 'Tracer', 'Metrics', 'Idempotency', 'batchProcessor', event handler, etc. " +
  'Powertools is available for the following runtimes: python, typescript, java, dotnet. ' +
  'When searching, always specify the version of Powertools you are interested in, if unsure, try to read it from the workspace configuration, otherwise use "latest".';

export { name, description };
