import { getStringFromEnv } from '@aws-lambda-powertools/commons/utils/env';
import { Logger, LogFormatter, LogItem } from '@aws-lambda-powertools/logger';
import type {
  LogAttributes,
  LogLevel,
  UnformattedAttributes,
} from '@aws-lambda-powertools/logger/types';
import { Console } from 'node:console';

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

// Create a custom logger that redirects all output to stderr for MCP compatibility
class MCPLogger extends Logger {
  protected setConsole(): void {
    // Always redirect stdout to stderr for MCP compatibility
    // This ensures logs don't interfere with the MCP stdio protocol
    this.console = new Console({
      stdout: process.stderr,  // Redirect stdout to stderr
      stderr: process.stderr,  // Keep stderr as stderr
    });

    // Patch console.trace to avoid printing stack trace (same as parent)
    this.console.trace = (message: unknown, ...optionalParams: unknown[]) => {
      this.console.log(message, ...optionalParams);
    };
  }
}

const logger = new MCPLogger({
  logLevel,
  logFormatter: new CustomLogFormatter(),
});

export { logger };
