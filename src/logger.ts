import { Console } from 'node:console';
import { getStringFromEnv } from '@aws-lambda-powertools/commons/utils/env';
import { LogFormatter, Logger, LogItem } from '@aws-lambda-powertools/logger';
import type {
  LogAttributes,
  LogLevel,
  UnformattedAttributes,
} from '@aws-lambda-powertools/logger/types';

const logLevel = getStringFromEnv({
  key: 'LOG_LEVEL',
  defaultValue: 'INFO',
}) as LogLevel;

class CustomLogFormatter extends LogFormatter {
  formatAttributes(
    attributes: UnformattedAttributes,
    additionalLogAttributes: LogAttributes
  ): LogItem {
    return new LogItem({
      attributes: {
        timestamp: attributes.timestamp,
        level: attributes.level,
        message: attributes.message,
      },
    }).addAttributes(additionalLogAttributes);
  }
}

const logger = new Logger({
  logLevel,
  logFormatter: new CustomLogFormatter(),
});
/**
 * Since this MCP server uses the stdio protocol, we always
 * need to emit logs to `stderr` to avoid interfering with MCP's
 * communication over `stdout`.
 *
 * See https://modelcontextprotocol.io/docs/develop/build-server#logging-in-mcp-servers
 */
/* v8 ignore start */ if (process.env.NODE_ENV !== 'test') {
  // @ts-expect-error
  (logger as unknown).console = new Console({
    stdout: process.stderr,
    stderr: process.stderr,
  });
} /* v8 ignore stop */

export { logger };
