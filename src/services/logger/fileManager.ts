import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

/**
 * Manages log files for the Powertools MCP logger
 * - Creates log files in $HOME/.powertools/logs/
 * - Names files with pattern: YYYY-MM-DD.log
 * - Handles daily log rotation
 * - Cleans up log files older than 7 days
 */
export class LogFileManager {
  private logDir: string;
  private currentDate: string;
  private currentLogPath: string | null = null;
  private retentionDays = 7;

  constructor() {
    const homeDir = os.homedir();
    this.logDir = path.join(homeDir, '.powertools', 'logs');
    this.currentDate = this.getFormattedDate();
  }

  /**
   * Initialize the log directory
   */
  public async initialize(): Promise<void> {
    await this.ensureLogDirectoryExists();
    await this.cleanupOldLogs();
  }

  /**
   * Get the path to the current log file
   * Creates a new log file if needed (e.g., on date change)
   */
  public async getLogFilePath(): Promise<string> {
    const today = this.getFormattedDate();
    
    // If date changed or no current log file, create a new one
    if (today !== this.currentDate || !this.currentLogPath) {
      this.currentDate = today;
      this.currentLogPath = await this.createNewLogFile();
    }
    
    return this.currentLogPath;
  }

  /**
   * Clean up log files older than the retention period
   */
  public async cleanupOldLogs(): Promise<void> {
    try {
      const files = await fs.promises.readdir(this.logDir);
      const now = new Date();
      
      for (const file of files) {
        if (!file.endsWith('.log')) continue;
        
        const filePath = path.join(this.logDir, file);
        const stats = await fs.promises.stat(filePath);
        const fileDate = stats.mtime;
        
        // Calculate days difference
        const daysDiff = Math.floor((now.getTime() - fileDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // Delete files older than retention period
        if (daysDiff > this.retentionDays) {
          await fs.promises.unlink(filePath);
        }
      }
    } catch {
      // Silently fail if cleanup fails - we don't want to break logging
      console.error('Failed to clean up old log files');
    }
  }

  /**
   * Create a new log file for today
   */
  private async createNewLogFile(): Promise<string> {
    await this.ensureLogDirectoryExists();
    
    // Create file with today's date
    const fileName = `${this.currentDate}.log`;
    const filePath = path.join(this.logDir, fileName);
    
    return filePath;
  }

  /**
   * Ensure the log directory exists
   */
  private async ensureLogDirectoryExists(): Promise<void> {
    try {
      await fs.promises.access(this.logDir, fs.constants.F_OK);
    } catch {
      // Directory doesn't exist, create it
      await fs.promises.mkdir(this.logDir, { recursive: true });
    }
  }

  /**
   * Get the current date formatted as YYYY-MM-DD
   */
  private getFormattedDate(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
