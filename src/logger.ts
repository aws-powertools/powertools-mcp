import { getStringFromEnv } from '@aws-lambda-powertools/commons/utils/env';
import { Logger, LogFormatter, LogItem } from '@aws-lambda-powertools/logger';
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

export { logger };
