
import { LogFileManager } from './fileManager';
import { Logger } from './logger';

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

// Mock the file manager
jest.mock('./fileManager');

// Mock pino
jest.mock('pino', () => {
  const mockPinoLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
    fatal: jest.fn(),
    child: jest.fn().mockImplementation(() => ({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      trace: jest.fn(),
      fatal: jest.fn(),
    })),
  };
  
  const mockPino = jest.fn().mockImplementation(() => mockPinoLogger);
  mockPino.destination = jest.fn().mockReturnValue({ write: jest.fn() });
  mockPino.transport = jest.fn().mockReturnValue({});
  
  return mockPino;
});

// Mock formatter
jest.mock('./formatter', () => ({
  createFormattedFileStream: jest.fn().mockReturnValue({
    write: jest.fn(),
    end: jest.fn(),
    on: jest.fn(),
  }),
}));

describe('[Logger] When using the core logger', () => {
  let logger: Logger;
  let mockFileManager: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock LogFileManager implementation
    mockFileManager = {
      initialize: jest.fn().mockResolvedValue(undefined),
      getLogFilePath: jest.fn().mockResolvedValue('/home/user/.powertools/logs/2025-05-11.log'),
      cleanupOldLogs: jest.fn().mockResolvedValue(undefined),
    };
    
    (LogFileManager as jest.Mock).mockImplementation(() => mockFileManager);
    
    logger = Logger.getInstance();
  });
  
  afterEach(() => {
    Logger.resetInstance();
    jest.restoreAllMocks();
  });
  
  it('should create a singleton instance', () => {
    const instance1 = Logger.getInstance();
    const instance2 = Logger.getInstance();
    
    expect(instance1).toBe(instance2);
  });
  
  it('should initialize the file manager on first access', async () => {
    await logger.initialize();
    
    expect(mockFileManager.initialize).toHaveBeenCalled();
  });
  
  it('should create a child logger with context', async () => {
    await logger.initialize();
    
    const childLogger = logger.child({ service: 'test-service' });
    expect(childLogger).toBeDefined();
    expect(childLogger).not.toBe(logger);
  });
  
  it('should log messages at different levels', async () => {
    await logger.initialize();
    
    // Mock the internal logger
    const mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      trace: jest.fn(),
      fatal: jest.fn(),
    };
    
    // @ts-expect-error - accessing private property for testing
    logger.logger = mockLogger;
    
    await logger.info('Info message');
    expect(mockLogger.info).toHaveBeenCalledWith({}, 'Info message');
    
    await logger.error('Error message');
    expect(mockLogger.error).toHaveBeenCalledWith({}, 'Error message');
    
    await logger.warn('Warning message');
    expect(mockLogger.warn).toHaveBeenCalledWith({}, 'Warning message');
    
    await logger.debug('Debug message');
    expect(mockLogger.debug).toHaveBeenCalledWith({}, 'Debug message');
  });
  
  it('should log messages with context', async () => {
    await logger.initialize();
    
    // Mock the internal logger
    const mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      trace: jest.fn(),
      fatal: jest.fn(),
    };
    
    // @ts-expect-error - accessing private property for testing
    logger.logger = mockLogger;
    
    await logger.info('Info with context', { requestId: '123' });
    expect(mockLogger.info).toHaveBeenCalledWith({ requestId: '123' }, 'Info with context');
  });
  
  it('should handle daily log rotation', async () => {
    // Mock date change
    mockFileManager.getLogFilePath
      .mockResolvedValueOnce('/home/user/.powertools/logs/2025-05-11.log')
      .mockResolvedValueOnce('/home/user/.powertools/logs/2025-05-12.log');
    
    await logger.initialize();
    
    // Reset the mock count since initialize() already called it once
    mockFileManager.getLogFilePath.mockClear();
    
    // Mock the internal logger to avoid actual logging
    const mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      trace: jest.fn(),
      fatal: jest.fn(),
    };
    
    // @ts-expect-error - accessing private property for testing
    logger.logger = mockLogger;
    
    // First log should use the first file
    await logger.info('First log');
    
    // Second log should check for a new file
    // Force a check by setting lastCheckTime to past
    // @ts-expect-error - accessing private property for testing
    logger.lastCheckTime = 0;
    
    await logger.info('Second log');
    
    // Should have checked for a new log file twice
    expect(mockFileManager.getLogFilePath).toHaveBeenCalledTimes(1);
  });
  
  it('should handle error objects correctly', async () => {
    await logger.initialize();
    
    // Mock the internal logger
    const mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
      trace: jest.fn(),
      fatal: jest.fn(),
    };
    
    // @ts-expect-error - accessing private property for testing
    logger.logger = mockLogger;
    
    const testError = new Error('Test error');
    await logger.error(testError);
    expect(mockLogger.error).toHaveBeenCalledWith({ err: testError }, 'Test error');
    
    await logger.error(testError, { requestId: '123' });
    expect(mockLogger.error).toHaveBeenCalledWith({ err: testError, requestId: '123' }, 'Test error');
  });
});
