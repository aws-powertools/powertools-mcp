/**
 * Copyright (c) 2025 Michael Walmsley, ServerlessDNA.com
 * Licensed under the MIT License.
 */

import { Logger } from './logger';

// Export the singleton instance
export const logger = Logger.getInstance();

// Export types and classes
export { LogFileManager } from './fileManager';
export { Logger } from './logger';

// Initialize the logger when the module is imported
(async () => {
  try {
    await logger.initialize();
  } catch (error) {
    logger.info('Failed to initialize logger:', { error });
  }
})();
