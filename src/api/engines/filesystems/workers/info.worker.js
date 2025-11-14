/**
 * Info Worker - Handles file info and preview operations
 * Supports both same-process and child process execution
 */

import { getFileInfo, previewFile } from '../actions/info';
import { setupForkMode, createWorker } from '../utils';

/**
 * Process info operations
 * @param {Object} data - Info data
 * @returns {Promise<Object>} Info result
 */
async function processInfo(data) {
  const { type, fileName, options } = data;

  switch (type) {
    case 'GET_FILE_INFO':
      return await getFileInfo(fileName, options);

    case 'PREVIEW_FILE':
      return await previewFile(fileName, options);

    default:
      throw new Error(`Unknown info type: ${type}`);
  }
}

// Create worker function using helper
const workerFunction = createWorker(processInfo, 'FILE_INFO');

// Export for same-process execution
export default workerFunction;

// =============================================================================
// CHILD PROCESS EXECUTION (Fork Mode)
// =============================================================================

// Setup fork mode execution using helper
setupForkMode(processInfo, 'FILE_INFO', 'Info');
