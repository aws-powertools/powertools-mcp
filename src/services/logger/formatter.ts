import * as fs from 'fs';
import { Transform } from 'stream';

/**
 * Custom log formatter that converts JSON log entries to a pretty format
 * This is a replacement for pino-pretty that we can use directly
 */
export class LogFormatter extends Transform {
  constructor() {
    super({ objectMode: true });
  }

  /**
   * Transform a JSON log entry to a pretty format
   * @param chunk The log entry as a Buffer or string
   * @param encoding The encoding of the chunk
   * @param callback Callback to call when done
   */
  _transform(chunk: any, encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
    try {
      // Parse the JSON log entry
      const logEntry = typeof chunk === 'string' ? JSON.parse(chunk) : JSON.parse(chunk.toString());
      
      // Format the log entry
      const formattedLog = this.formatLogEntry(logEntry);
      
      // Push the formatted log entry
      this.push(formattedLog + '\n');
      callback();
    } catch {
      // If parsing fails, just pass through the original chunk
      this.push(chunk);
      callback();
    }
  }

  /**
   * Format a log entry object to a pretty string
   * @param logEntry The log entry object
   * @returns The formatted log entry
   */
  private formatLogEntry(logEntry: any): string {
    // Extract common fields
    const time = logEntry.time || new Date().toISOString();
    const level = this.getLevelName(logEntry.level || 30);
    const pid = logEntry.pid || process.pid;
    const hostname = logEntry.hostname || 'unknown';
    const msg = logEntry.msg || '';
    
    // Format timestamp
    const timestamp = this.formatTimestamp(time);
    
    // Build the log line
    let logLine = `${timestamp} ${this.colorizeLevel(level)} (${pid} on ${hostname}): ${msg}`;
    
    // Add additional fields (excluding common ones)
    const additionalFields = Object.entries(logEntry)
      .filter(([key]) => !['time', 'level', 'pid', 'hostname', 'msg'].includes(key))
      .map(([key, value]) => `${key}=${this.formatValue(value)}`)
      .join(' ');
    
    if (additionalFields) {
      logLine += ` | ${additionalFields}`;
    }
    
    return logLine;
  }

  /**
   * Format a timestamp to a readable format
   * @param isoTimestamp ISO timestamp string
   * @returns Formatted timestamp
   */
  private formatTimestamp(isoTimestamp: string): string {
    try {
      const date = new Date(isoTimestamp);
      return date.toLocaleString();
    } catch {
      return isoTimestamp;
    }
  }

  /**
   * Get the level name from a level number
   * @param level Level number
   * @returns Level name
   */
  private getLevelName(level: number): string {
    switch (level) {
      case 10: return 'TRACE';
      case 20: return 'DEBUG';
      case 30: return 'INFO';
      case 40: return 'WARN';
      case 50: return 'ERROR';
      case 60: return 'FATAL';
      default: return `LEVEL${level}`;
    }
  }

  /**
   * Colorize a level name (no actual colors in file output)
   * @param level Level name
   * @returns Level name (no colors in file output)
   */
  private colorizeLevel(level: string): string {
    // No colors in file output, just pad for alignment
    return level.padEnd(5);
  }

  /**
   * Format a value for display
   * @param value Any value
   * @returns Formatted string representation
   */
  private formatValue(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    
    if (typeof value === 'object') {
      if (value instanceof Error) {
        return value.message;
      }
      try {
        return JSON.stringify(value);
      } catch {
        return '[Object]';
      }
    }
    
    return String(value);
  }
}

/**
 * Create a writable stream that formats log entries and writes them to a file
 * @param filePath Path to the log file
 * @returns Writable stream
 */
export function createFormattedFileStream(filePath: string): fs.WriteStream {
  // Create a formatter transform stream
  const formatter = new LogFormatter();
  
  // Create a file write stream
  const fileStream = fs.createWriteStream(filePath, { flags: 'a' });
  
  // Pipe the formatter to the file stream
  formatter.pipe(fileStream);
  
  return formatter;
}
