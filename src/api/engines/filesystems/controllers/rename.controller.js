/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

/**
 * Rename Controller
 *
 * Handles file renaming operations.
 */

import * as filesystemActions from '../actions';
import workerService from '../workers';

/**
 * Hybrid decision logic for rename operations
 * @param {Array} operations - Array of rename operations
 * @param {Object} options - Decision options
 * @returns {Object} Decision result
 */
function makeRenameDecision(operations, options = {}) {
  const thresholds = {
    batchRenameThreshold: options.batchRenameThreshold || 5,
  };

  if (!Array.isArray(operations)) {
    return {
      shouldUseWorker: false,
      reason: 'Invalid operations data',
      operation: 'rename',
      timestamp: new Date().toISOString(),
    };
  }

  const shouldUseWorker = operations.length >= thresholds.batchRenameThreshold;
  const reason = shouldUseWorker
    ? `Batch rename (${operations.length} operations)`
    : 'Few operations, main process sufficient';

  return {
    shouldUseWorker,
    reason,
    operation: 'rename',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Rename files
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Object} options - Controller options
 */
export async function renameFiles(req, res, options = {}) {
  try {
    const { operations, oldName, newName } = req.body;
    let renameOperations;

    // Parse rename operations from different formats
    if (operations) {
      if (!Array.isArray(operations)) {
        return res.status(400).json({
          success: false,
          error: 'Operations must be an array of {oldName, newName} objects',
        });
      }
      renameOperations = operations;
    } else if (oldName && newName) {
      // Convert single rename to batch format
      renameOperations = [{ oldName, newName }];
    } else {
      return res.status(400).json({
        success: false,
        error: 'Either operations array or oldName/newName pair is required',
      });
    }

    // Use hybrid decision service to determine processing method
    const decision = makeRenameDecision(renameOperations, options);

    let result;
    if (decision.shouldUseWorker) {
      // Use worker service for batch rename
      result = await workerService.processRename(renameOperations);
    } else {
      // Use main process for few operations
      const results = await Promise.allSettled(
        renameOperations.map(async operation => {
          try {
            const result = await filesystemActions.renameFile(
              operation.oldName,
              operation.newName,
            );
            return result;
          } catch (error) {
            return {
              success: false,
              data: {
                oldName: operation.oldName,
                newName: operation.newName,
              },
              message: `Failed to rename file: ${operation.oldName}`,
              error,
            };
          }
        }),
      );

      const successful = results
        .filter(r => r.status === 'fulfilled' && r.value.success)
        .map(r => r.value);
      const failed = results
        .filter(r => r.status === 'rejected' || !r.value.success)
        .map(r => r.reason || r.value);

      result = {
        success: true,
        data: {
          successful,
          failed,
          totalOperations: renameOperations.length,
          successCount: successful.length,
          failCount: failed.length,
        },
        message: `Renamed ${successful.length} of ${renameOperations.length} files successfully`,
      };
    }

    res.json(result);
  } catch (error) {
    console.error('Rename error:', error);
    return res.status(500).json({
      success: false,
      error: 'Rename failed',
      details: error.message,
    });
  }
}
