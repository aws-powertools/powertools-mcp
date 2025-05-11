import { LogFileManager } from './fileManager';

import pino from 'pino';

/**
 * Core logger for Powertools MCP
 * Wraps Pino logger with file management capabilities
 */
export class Logger {
  private static instance: Logger | null = null;
  private fileManager: LogFileManager;
  private logger: pino.Logger | null = null;
  private initialized = false;
  private currentLogPath: string | null = null;

  /**
   * Private constructor to enforce singleton pattern
   */
  private constructor() {
    this.fileManager = new LogFileManager();
  }

  protected renewPinoLogger(logPath: string): pino.Logger {
    const fileTransport = pino.transport({
      target: 'pino/file',
      options: { destination: logPath }
    });

    return pino({
          level: process.env.LOG_LEVEL || 'info',
          timestamp: () => `,"time":"${new Date().toISOString()}"`,
        }, 
        fileTransport,
      );
  }

  /**
   * Get the singleton instance of the logger
   */
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Reset the singleton instance (for testing)
   */
  public static resetInstance(): void {
    Logger.instance = null;
  }

  /**
   * Initialize the logger
   * Sets up the file manager and creates the initial log file
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;
    
    await this.fileManager.initialize();
    this.currentLogPath = await this.fileManager.getLogFilePath();
    
    this.logger = this.renewPinoLogger(this.currentLogPath);
    
    this.initialized = true;
  }

  /**
   * Get the underlying Pino logger instance
   */
  public getPinoLogger(): pino.Logger {
    if (!this.logger) {
      throw new Error('Logger not initialized. Call initialize() first.');
    }
    return this.logger;
  }

  /**
   * Create a child logger with additional context
   */
  public child(bindings: pino.Bindings): Logger {
    const childLogger = new Logger();
    childLogger.initialized = this.initialized;
    childLogger.fileManager = this.fileManager;
    childLogger.currentLogPath = this.currentLogPath;
    
    if (this.logger) {
      childLogger.logger = this.logger.child(bindings);
    }
    
    return childLogger;
  }

  /**
   * Check if the log file needs to be rotated
   * This should be called before each log operation
   */
  private async checkLogRotation(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
      return;
    }
    
    const logPath = await this.fileManager.getLogFilePath();
    
    // If log path changed, update the logger
    if (logPath !== this.currentLogPath) {
      this.currentLogPath = logPath;
      
      // Create a new logger instance with the new file
      this.logger = this.renewPinoLogger(this.currentLogPath)
    }
  }

  /**
   * Log at info level
   */
  public async info(msg: string, obj?: object): Promise<void> {
    await this.checkLogRotation();
    this.logger?.info(obj || {}, msg);
  }

  /**
   * Log at error level
   */
  public async error(msg: string | Error, obj?: object): Promise<void> {
    await this.checkLogRotation();
    if (msg instanceof Error) {
      this.logger?.error({ err: msg, ...obj }, msg.message);
    } else {
      this.logger?.error(obj || {}, msg);
    }
  }

  /**
   * Log at warn level
   */
  public async warn(msg: string, obj?: object): Promise<void> {
    await this.checkLogRotation();
    this.logger?.warn(obj || {}, msg);
  }

  /**
   * Log at debug level
   */
  public async debug(msg: string, obj?: object): Promise<void> {
    await this.checkLogRotation();
    this.logger?.debug(obj || {}, msg);
  }

  /**
   * Log at trace level
   */
  public async trace(msg: string, obj?: object): Promise<void> {
    await this.checkLogRotation();
    this.logger?.trace(obj || {}, msg);
  }

  /**
   * Log at fatal level
   */
  public async fatal(msg: string, obj?: object): Promise<void> {
    await this.checkLogRotation();
    this.logger?.fatal(obj || {}, msg);
  }
}
