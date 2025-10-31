import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { POWERTOOLS_BASE_URL } from '../../src/constants.ts';
import { tool } from '../../src/tools/searchDocs/tool.ts';

const mocks = vi.hoisted(() => {
  process.env.SEARCH_CONFIDENCE_THRESHOLD = '2'; // Set a low threshold for testing
  return {
    getFromCache: vi.fn(),
    writeToCache: vi.fn(),
  };
});

vi.mock('cacache', async (importOriginal) => ({
  ...(await importOriginal<typeof import('cacache')>()),
  get: mocks.getFromCache,
  put: mocks.writeToCache,
}));

describe('tool', () => {
  const server = setupServer(
    ...[
      http.get(
        `${POWERTOOLS_BASE_URL}/typescript/latest/search/search_index.json`,
        () =>
          HttpResponse.text(
            JSON.stringify({
              config: {
                lang: ['en'],
                separator: '[\\s\\-]+',
                pipeline: ['stopWordFilter', 'stemmer']
              },
              docs: [
                {
                  location: 'features/logger/#buffering-logs',
                  title: 'Buffering logs',
                  text: "<p>Log buffering enables you to buffer logs for a specific request or invocation. Enable log buffering by passing <code>logBufferOptions</code> when initializing a Logger instance. You can buffer logs at the <code>WARNING</code>, <code>INFO</code>,  <code>DEBUG</code>, or <code>TRACE</code> level, and flush them automatically on error or manually as needed.</p> <p>This is useful when you want to reduce the number of log messages emitted while still having detailed logs when needed, such as when troubleshooting issues.</p> logBufferingGettingStarted.ts <pre><code>import { Logger } from '@aws-lambda-powertools/logger';\n\nconst logger = new Logger({\n  logBufferOptions: {\n    maxBytes: 20480,\n    flushOnErrorLog: true,\n  },\n});\n\nlogger.debug('This is a debug message'); // This is NOT buffered\n\nexport const handler = async () =&gt; {\n  logger.debug('This is a debug message'); // This is buffered\n  logger.info('This is an info message');\n\n  // your business logic here\n\n  logger.error('This is an error message'); // This also flushes the buffer\n  // or logger.flushBuffer(); // to flush the buffer manually\n};\n</code></pre>",
                  tags: ['logger', 'buffering', 'debug']
                },
                {
                  location: 'features/logger/#configuring-the-buffer',
                  title: 'Configuring the buffer',
                  text: "<p>When configuring the buffer, you can set the following options to fine-tune how logs are captured, stored, and emitted. You can configure the following options in the <code>logBufferOptions</code> constructor parameter:</p> Parameter Description Configuration Default <code>enabled</code> Enable or disable log buffering <code>true</code>, <code>false</code> <code>false</code> <code>maxBytes</code> Maximum size of the log buffer in bytes <code>number</code> <code>20480</code> <code>bufferAtVerbosity</code> Minimum log level to buffer <code>TRACE</code>, <code>DEBUG</code>, <code>INFO</code>, <code>WARNING</code> <code>DEBUG</code> <code>flushOnErrorLog</code> Automatically flush buffer when logging an error <code>true</code>, <code>false</code> <code>true</code> logBufferingBufferAtVerbosity.tslogBufferingflushOnErrorLog.ts <pre><code>import { Logger } from '@aws-lambda-powertools/logger';\n\nconst logger = new Logger({\n  logBufferOptions: {\n    bufferAtVerbosity: 'warn', // (1)!\n  },\n});\n\nexport const handler = async () =&gt; {\n  // All logs below are buffered\n  logger.debug('This is a debug message');\n  logger.info('This is an info message');\n  logger.warn('This is a warn message');\n\n  logger.clearBuffer(); // (2)!\n};\n</code></pre> <ol> <li>Setting <code>bufferAtVerbosity: 'warn'</code> configures log buffering for <code>WARNING</code> and all lower severity levels like <code>INFO</code>, <code>DEBUG</code>, and <code>TRACE</code>.</li> <li>Calling <code>logger.clearBuffer()</code> will clear the buffer without emitting the logs.</li> </ol> <pre><code>import { Logger } from '@aws-lambda-powertools/logger';\n\nconst logger = new Logger({\n  logBufferOptions: {\n    maxBytes: 20480,\n    flushOnErrorLog: false, // (1)!\n  },\n});\n\nexport const handler = async () =&gt; {\n  logger.debug('This is a debug message'); // This is buffered\n\n  try {\n    throw new Error('a non fatal error');\n  } catch (error) {\n    logger.error('A non fatal error occurred', { error }); // This does NOT flush the buffer\n  }\n\n  logger.debug('This is another debug message'); // This is buffered\n\n  try {\n    throw new Error('a fatal error');\n  } catch (error) {\n    logger.error('A fatal error occurred', { error }); // This does NOT flush the buffer\n    logger.flushBuffer();\n  }\n};\n</code></pre> <ol> <li>Disabling <code>flushOnErrorLog</code> will not flush the buffer when logging an error. This is useful when you want to control when the buffer is flushed by calling the <code>logger.flushBuffer()</code> method.</li> </ol>",
                },
                {
                  location: 'features/logger/#flushing-on-errors',
                  title: 'Flushing on errors',
                  text: "<p>When using the <code>logger.injectLambdaContext()</code> class method decorator or the <code>injectLambdaContext()</code> middleware, you can configure the logger to automatically flush the buffer when an error occurs. This is done by setting the <code>flushBufferOnUncaughtError</code> option to <code>true</code> in the decorator or middleware options.</p> logBufferingFlushOnErrorDecorator.tslogBufferingFlushOnErrorMiddy.ts <pre><code>import { Logger } from '@aws-lambda-powertools/logger';\nimport type { Context } from 'aws-lambda';\n\nconst logger = new Logger({\n  logLevel: 'DEBUG',\n  logBufferOptions: { enabled: true },\n});\n\nclass Lambda {\n  @logger.injectLambdaContext({\n    flushBufferOnUncaughtError: true,\n  })\n  async handler(_event: unknown, _context: Context) {\n    // Both logs below are buffered\n    logger.debug('a debug log');\n    logger.debug('another debug log');\n\n    throw new Error('an error log'); // This causes the buffer to flush\n  }\n}\n\nconst lambda = new Lambda();\nexport const handler = lambda.handler.bind(lambda);\n</code></pre> <pre><code>import { Logger } from '@aws-lambda-powertools/logger';\nimport { injectLambdaContext } from '@aws-lambda-powertools/logger/middleware';\nimport middy from '@middy/core';\n\nconst logger = new Logger({\n  logLevel: 'DEBUG',\n  logBufferOptions: { enabled: true },\n});\n\nexport const handler = middy()\n  .use(injectLambdaContext(logger, { flushBufferOnUncaughtError: true }))\n  .handler(async (event: unknown) =&gt; {\n    // Both logs below are buffered\n    logger.debug('a debug log');\n    logger.debug('another debug log');\n\n    throw new Error('an error log'); // This causes the buffer to flush\n  });\n</code></pre>",
                },
                {
                  location: 'features/batch/#processing-messages-from-kinesis',
                  title: 'Processing messages from Kinesis',
                  text: '<p>Processing batches from Kinesis works in three stages:</p> <ol> <li>Instantiate <code>BatchProcessor</code> and choose <code>EventType.KinesisDataStreams</code> for the event type</li> <li>Define your function to handle each batch record, and use the <code>KinesisStreamRecord</code> type annotation for autocompletion</li> <li>Use <code>processPartialResponse</code> to kick off processing</li> </ol> Info <p>This code example optionally uses Logger for completion.</p> index.tsSample responseSample event <pre><code>import {\n  BatchProcessor,\n  EventType,\n  processPartialResponse,\n} from \'@aws-lambda-powertools/batch\';\nimport { Logger } from \'@aws-lambda-powertools/logger\';\nimport type { KinesisStreamHandler, KinesisStreamRecord } from \'aws-lambda\';\n\nconst processor = new BatchProcessor(EventType.KinesisDataStreams); // (1)!\nconst logger = new Logger();\n\nconst recordHandler = async (record: KinesisStreamRecord): Promise&lt;void&gt; =&gt; {\n  logger.info(\'Processing record\', { record: record.kinesis.data });\n  const payload = JSON.parse(record.kinesis.data);\n  logger.info(\'Processed item\', { item: payload });\n};\n\nexport const handler: KinesisStreamHandler = async (event, context) =&gt;\n  processPartialResponse(event, recordHandler, processor, {\n    context,\n  });\n</code></pre> <ol> <li>Creates a partial failure batch processor for Kinesis Data Streams. See partial failure mechanics for details</li> </ol> <p>The second record failed to be processed, therefore the processor added its sequence number in the response.</p> <pre><code>{\n  "Records": [\n    {\n      "kinesis": {\n        "kinesisSchemaVersion": "1.0",\n        "partitionKey": "1",\n        "sequenceNumber": "4107859083838847772757075850904226111829882106684065",\n        "data": "eyJNZXNzYWdlIjogInN1Y2Nlc3MifQ==",\n        "approximateArrivalTimestamp": 1545084650.987\n      },\n      "eventSource": "aws:kinesis",\n      "eventVersion": "1.0",\n      "eventID": "shardId-000000000006:4107859083838847772757075850904226111829882106684065",\n      "eventName": "aws:kinesis:record",\n      "invokeIdentityArn": "arn:aws:iam::123456789012:role/lambda-role",\n      "awsRegion": "us-east-2",\n      "eventSourceARN": "arn:aws:kinesis:us-east-2:123456789012:stream/lambda-stream"\n    },\n    {\n      "kinesis": {\n        "kinesisSchemaVersion": "1.0",\n        "partitionKey": "1",\n        "sequenceNumber": "6006958808509702859251049540584488075644979031228738",\n        "data": "c3VjY2Vzcw==",\n        "approximateArrivalTimestamp": 1545084650.987\n      },\n      "eventSource": "aws:kinesis",\n      "eventVersion": "1.0",\n      "eventID": "shardId-000000000006:6006958808509702859251049540584488075644979031228738",\n      "eventName": "aws:kinesis:record",\n      "invokeIdentityArn": "arn:aws:iam::123456789012:role/lambda-role",\n      "awsRegion": "us-east-2",\n      "eventSourceARN": "arn:aws:kinesis:us-east-2:123456789012:stream/lambda-stream"\n    }\n  ]\n}\n</code></pre> <pre><code>{\n  "batchItemFailures": [\n    {\n      "itemIdentifier": "6006958808509702859251049540584488075644979031228738"\n    }\n  ]\n}\n</code></pre>',
                },
                {
                  location: 'features/batch/#processing-messages-from-dynamodb',
                  title: 'Processing messages from DynamoDB',
                  text: '<p>Processing batches from DynamoDB Streams works in three stages:</p> <ol> <li>Instantiate <code>BatchProcessor</code> and choose <code>EventType.DynamoDBStreams</code> for the event type</li> <li>Define your function to handle each batch record, and use the <code>DynamoDBRecord</code> type annotation for autocompletion</li> <li>Use <code>processPartialResponse</code> to kick off processing</li> </ol> Info <p>This code example optionally uses Logger for completion.</p> index.tsSample responseSample event <pre><code>import {\n  BatchProcessor,\n  EventType,\n  processPartialResponse,\n} from \'@aws-lambda-powertools/batch\';\nimport { Logger } from \'@aws-lambda-powertools/logger\';\nimport type { DynamoDBRecord, DynamoDBStreamHandler } from \'aws-lambda\';\n\nconst processor = new BatchProcessor(EventType.DynamoDBStreams); // (1)!\nconst logger = new Logger();\n\nconst recordHandler = async (record: DynamoDBRecord): Promise&lt;void&gt; =&gt; {\n  if (record.dynamodb?.NewImage) {\n    logger.info(\'Processing record\', { record: record.dynamodb.NewImage });\n    const message = record.dynamodb.NewImage.Message.S;\n    if (message) {\n      const payload = JSON.parse(message);\n      logger.info(\'Processed item\', { item: payload });\n    }\n  }\n};\n\nexport const handler: DynamoDBStreamHandler = async (event, context) =&gt;\n  processPartialResponse(event, recordHandler, processor, {\n    context,\n  });\n</code></pre> <ol> <li>Creates a partial failure batch processor for DynamoDB Streams. See partial failure mechanics for details</li> </ol> <p>The second record failed to be processed, therefore the processor added its sequence number in the response.</p> <pre><code>{\n  "batchItemFailures": [\n    {\n      "itemIdentifier": "8640712661"\n    }\n  ]\n}\n</code></pre> <pre><code>{\n  "Records": [\n    {\n      "eventID": "1",\n      "eventVersion": "1.0",\n      "dynamodb": {\n        "Keys": {\n          "Id": {\n            "N": "101"\n          }\n        },\n        "NewImage": {\n          "Message": {\n            "S": "failure"\n          }\n        },\n        "StreamViewType": "NEW_AND_OLD_IMAGES",\n        "SequenceNumber": "3275880929",\n        "SizeBytes": 26\n      },\n      "awsRegion": "us-west-2",\n      "eventName": "INSERT",\n      "eventSourceARN": "eventsource_arn",\n      "eventSource": "aws:dynamodb"\n    },\n    {\n      "eventID": "1",\n      "eventVersion": "1.0",\n      "dynamodb": {\n        "Keys": {\n          "Id": {\n            "N": "101"\n          }\n        },\n        "NewImage": {\n          "SomethingElse": {\n            "S": "success"\n          }\n        },\n        "StreamViewType": "NEW_AND_OLD_IMAGES",\n        "SequenceNumber": "8640712661",\n        "SizeBytes": 26\n      },\n      "awsRegion": "us-west-2",\n      "eventName": "INSERT",\n      "eventSourceARN": "eventsource_arn",\n      "eventSource": "aws:dynamodb"\n    }\n  ]\n}\n</code></pre>',
                },
              ],
            }),
            {
              headers: {
                'Content-Type': 'application/json',
                ETag: '"12345"',
              },
            }
          )
      ),
      http.get(
        `${POWERTOOLS_BASE_URL}/typescript/latest/features/non-existent`,
        () => HttpResponse.json({ error: 'Not found' }, { status: 404 })
      ),
      http.get(`${POWERTOOLS_BASE_URL}/dotnet/search/search_index.json`, () =>
        HttpResponse.text('Metrics is a feature of PowerTools for TypeScript.')
      ),
      http.get(
        `${POWERTOOLS_BASE_URL}/java/latest/search/search_index.json`,
        () => HttpResponse.text(JSON.stringify({ foo: [] }))
      ),
      http.get(
        `${POWERTOOLS_BASE_URL}/python/latest/search/search_index.json`,
        () =>
          HttpResponse.text(
            JSON.stringify({
              docs: [
                {
                  title: 'Buffering logs',
                  text: "<p>Log buffering enables you to buffer logs for a specific request or invocation. Enable log buffering by passing <code>logBufferOptions</code> when initializing a Logger instance. You can buffer logs at the <code>WARNING</code>, <code>INFO</code>,  <code>DEBUG</code>, or <code>TRACE</code> level, and flush them automatically on error or manually as needed.</p> <p>This is useful when you want to reduce the number of log messages emitted while still having detailed logs when needed, such as when troubleshooting issues.</p> logBufferingGettingStarted.ts <pre><code>import { Logger } from '@aws-lambda-powertools/logger';\n\nconst logger = new Logger({\n  logBufferOptions: {\n    maxBytes: 20480,\n    flushOnErrorLog: true,\n  },\n});\n\nlogger.debug('This is a debug message'); // This is NOT buffered\n\nexport const handler = async () =&gt; {\n  logger.debug('This is a debug message'); // This is buffered\n  logger.info('This is an info message');\n\n  // your business logic here\n\n  logger.error('This is an error message'); // This also flushes the buffer\n  // or logger.flushBuffer(); // to flush the buffer manually\n};\n</code></pre>",
                },
                {
                  location: 'features/logger/#configuring-the-buffer',
                  text: "<p>When configuring the buffer, you can set the following options to fine-tune how logs are captured, stored, and emitted. You can configure the following options in the <code>logBufferOptions</code> constructor parameter:</p> Parameter Description Configuration Default <code>enabled</code> Enable or disable log buffering <code>true</code>, <code>false</code> <code>false</code> <code>maxBytes</code> Maximum size of the log buffer in bytes <code>number</code> <code>20480</code> <code>bufferAtVerbosity</code> Minimum log level to buffer <code>TRACE</code>, <code>DEBUG</code>, <code>INFO</code>, <code>WARNING</code> <code>DEBUG</code> <code>flushOnErrorLog</code> Automatically flush buffer when logging an error <code>true</code>, <code>false</code> <code>true</code> logBufferingBufferAtVerbosity.tslogBufferingflushOnErrorLog.ts <pre><code>import { Logger } from '@aws-lambda-powertools/logger';\n\nconst logger = new Logger({\n  logBufferOptions: {\n    bufferAtVerbosity: 'warn', // (1)!\n  },\n});\n\nexport const handler = async () =&gt; {\n  // All logs below are buffered\n  logger.debug('This is a debug message');\n  logger.info('This is an info message');\n  logger.warn('This is a warn message');\n\n  logger.clearBuffer(); // (2)!\n};\n</code></pre> <ol> <li>Setting <code>bufferAtVerbosity: 'warn'</code> configures log buffering for <code>WARNING</code> and all lower severity levels like <code>INFO</code>, <code>DEBUG</code>, and <code>TRACE</code>.</li> <li>Calling <code>logger.clearBuffer()</code> will clear the buffer without emitting the logs.</li> </ol> <pre><code>import { Logger } from '@aws-lambda-powertools/logger';\n\nconst logger = new Logger({\n  logBufferOptions: {\n    maxBytes: 20480,\n    flushOnErrorLog: false, // (1)!\n  },\n});\n\nexport const handler = async () =&gt; {\n  logger.debug('This is a debug message'); // This is buffered\n\n  try {\n    throw new Error('a non fatal error');\n  } catch (error) {\n    logger.error('A non fatal error occurred', { error }); // This does NOT flush the buffer\n  }\n\n  logger.debug('This is another debug message'); // This is buffered\n\n  try {\n    throw new Error('a fatal error');\n  } catch (error) {\n    logger.error('A fatal error occurred', { error }); // This does NOT flush the buffer\n    logger.flushBuffer();\n  }\n};\n</code></pre> <ol> <li>Disabling <code>flushOnErrorLog</code> will not flush the buffer when logging an error. This is useful when you want to control when the buffer is flushed by calling the <code>logger.flushBuffer()</code> method.</li> </ol>",
                },
                {
                  location: 'features/logger/#flushing-on-errors',
                  title: 'Flushing on errors',
                },
              ],
            }),
            {
              headers: {
                'Content-Type': 'application/json',
                ETag: '"12345"',
              },
            }
          )
      ),
    ]
  );

  beforeAll(() => server.listen());
  afterEach(() => {
    server.resetHandlers();
    vi.clearAllMocks();
  });
  afterAll(() => server.close());

  it('returns search results', async () => {
    // Prepare
    mocks.getFromCache.mockResolvedValueOnce({
      data: null,
    });

    // Act
    const result = await tool({
      version: 'latest',
      runtime: 'typescript',
      search: 'log buffering',
    });

    // Assess
    expect(result.content).toHaveNthResultWith(1, {
      title: 'features/logger/#buffering-logs',
      url: `${POWERTOOLS_BASE_URL}/typescript/latest/features/logger/#buffering-logs`,
      score: expect.any(Number),
    });
  });

  it('gracefully handles malformed search index', async () => {
    // Prepare
    mocks.getFromCache.mockResolvedValueOnce({
      data: null,
    });

    // Act
    const result = await tool({
      version: '',
      runtime: 'dotnet',
      search: 'log buffering',
    });

    // Assess
    expect(result.content).toBeResponseWithText(
      'Failed to fetch search index for dotnet : Unexpected token \'M\', "Metrics is"... is not valid JSON'
    );
    expect(result.isError).toBe(true);
  });

  it('gracefully handles an empty search index', async () => {
    // Prepare
    mocks.getFromCache.mockResolvedValueOnce({
      data: null,
    });

    // Act
    const result = await tool({
      version: 'latest',
      runtime: 'java',
      search: 'log buffering',
    });

    // Assess
    expect(result.content).toBeResponseWithText(
      `Failed to fetch search index for java latest: Invalid search index format: missing docs array`
    );
    expect(result.isError).toBe(true);
  });

  it('gracefully handles incomplete entries in search index', async () => {
    // Prepare
    mocks.getFromCache.mockResolvedValueOnce({
      data: null,
    });

    // Act
    const result = await tool({
      version: 'latest',
      runtime: 'python',
      search: 'log buffering',
    });

    // Assess
    expect(JSON.parse(result.content[0].text as string)).toHaveLength(0);
  });
});
