import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

import { LogFileManager } from './fileManager';

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

// Mock fs module
jest.mock('fs', () => ({
  promises: {
    mkdir: jest.fn(),
    readdir: jest.fn(),
    stat: jest.fn(),
    unlink: jest.fn(),
    access: jest.fn(),
  },
  constants: { F_OK: 0 },
  createWriteStream: jest.fn(),
}));

// Mock console.error
console.error = jest.fn();

describe('[Logger] When managing log files', () => {
  let fileManager: LogFileManager;
  const mockDate = new Date('2025-05-11T00:00:00Z');
  const homeDir = os.homedir();
  const logDir = path.join(homeDir, '.powertools', 'logs');
  
  beforeEach(() => {
    // Mock Date
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup default mock implementations
    (fs.promises.mkdir as jest.Mock).mockResolvedValue(undefined);
    (fs.promises.readdir as jest.Mock).mockResolvedValue([]);
    (fs.promises.stat as jest.Mock).mockImplementation((filePath) => {
      // Mock file stats based on filename
      const fileName = path.basename(filePath);
      const match = fileName.match(/^(\d{4})-(\d{2})-(\d{2})/);
      
      if (match) {
        const [, year, month, day] = match;
        const fileDate = new Date(`${year}-${month}-${day}T00:00:00Z`);
        
        return Promise.resolve({
          isFile: () => true,
          mtime: fileDate,
          ctime: fileDate,
          birthtime: fileDate,
        });
      }
      
      return Promise.resolve({
        isFile: () => true,
        mtime: new Date(),
        ctime: new Date(),
        birthtime: new Date(),
      });
    });
    
    // Mock write stream
    const mockWriteStream = {
      write: jest.fn(),
      end: jest.fn(),
      on: jest.fn(),
    };
    (fs.createWriteStream as jest.Mock).mockReturnValue(mockWriteStream);
    
    fileManager = new LogFileManager();
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  it('should create log directory if it does not exist', async () => {
    // Mock directory doesn't exist
    (fs.promises.access as jest.Mock).mockRejectedValue(new Error('ENOENT'));
    
    await fileManager.initialize();
    
    expect(fs.promises.mkdir).toHaveBeenCalledWith(logDir, { recursive: true });
  });
  
  it('should not create log directory if it already exists', async () => {
    // Mock directory exists
    (fs.promises.access as jest.Mock).mockResolvedValue(undefined);
    
    await fileManager.initialize();
    
    expect(fs.promises.mkdir).not.toHaveBeenCalled();
  });
  
  it('should generate correct log filename with date format', async () => {
    const logPath = await fileManager.getLogFilePath();
    
    expect(logPath).toContain('2025-05-11.log');
  });
  
  it.skip('should clean up log files older than 7 days', async () => {
    // Mock log files with various dates
    const files = [
      '2025-05-11.log',  // today
      '2025-05-10.log',  // 1 day old
      '2025-05-05.log',  // 6 days old
      '2025-05-04.log',  // 7 days old
      '2025-05-03.log',  // 8 days old - should be deleted
      '2025-04-30.log',  // 11 days old - should be deleted
    ];
    
    (fs.promises.readdir as jest.Mock).mockResolvedValue(files);
    
    // Mock the stat function to return appropriate dates
    (fs.promises.stat as jest.Mock).mockImplementation((filePath) => {
      const fileName = path.basename(filePath);
      const match = fileName.match(/^(\d{4})-(\d{2})-(\d{2})/);
      
      if (match) {
        const [, year, month, day] = match;
        const fileDate = new Date(`${year}-${month}-${day}T00:00:00Z`);
        
        return Promise.resolve({
          isFile: () => true,
          mtime: fileDate,
          ctime: fileDate,
          birthtime: fileDate,
        });
      }
      
      return Promise.resolve({
        isFile: () => true,
        mtime: new Date(),
        ctime: new Date(),
        birthtime: new Date(),
      });
    });
    
    // Mock the unlink function to simulate deletion
    (fs.promises.unlink as jest.Mock).mockImplementation((filePath) => {
      const fileName = path.basename(filePath);
      if (fileName === '2025-05-03.log' || fileName === '2025-04-30.log') {
        return Promise.resolve();
      }
      return Promise.reject(new Error('File not found'));
    });
    
    await fileManager.cleanupOldLogs();
    
    // Check that old files were deleted
    expect(fs.promises.unlink).toHaveBeenCalledTimes(2);
    expect(fs.promises.unlink).toHaveBeenCalledWith(path.join(logDir, '2025-05-03.log'));
    expect(fs.promises.unlink).toHaveBeenCalledWith(path.join(logDir, '2025-04-30.log'));
  });
  
  it.skip('should create a new log file when current date changes', async () => {
    // Setup initial log file
    (fs.promises.readdir as jest.Mock).mockResolvedValue([]);
    const initialLogPath = await fileManager.getLogFilePath();
    expect(initialLogPath).toContain('2025-05-11.log');
    
    // Change date to next day
    const nextDay = new Date('2025-05-12T00:00:00Z');
    jest.spyOn(global, 'Date').mockImplementation(() => nextDay);
    
    // Reset the current date in the file manager
    // @ts-expect-error - accessing private property for testing
    fileManager.currentDate = '2025-05-12';
    
    // Mock readdir to return no files for the new date
    (fs.promises.readdir as jest.Mock).mockResolvedValue([]);
    
    // Should create a new log file for the new day
    const newLogPath = await fileManager.getLogFilePath();
    expect(newLogPath).toContain('2025-05-12.log');
  });
});
