/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

/**
 * Sync Controller
 *
 * Handles cross-provider synchronization operations.
 */

import workerService from '../workers';

/**
 * Synchronize files between providers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function synchronizeFiles(req, res) {
  try {
    const {
      operations,
      source,
      target,
      sourceProvider,
      targetProvider,
      type,
      recursive,
      deleteOrphaned,
      dryRun,
      compareBy,
    } = req.body;

    let syncOperations;

    if (operations) {
      // Multiple sync operations
      if (!Array.isArray(operations)) {
        return res.status(400).json({
          success: false,
          error:
            'Operations must be an array of {source, target, sourceProvider, targetProvider, ...} objects',
        });
      }
      syncOperations = operations;
    } else if (source && target) {
      // Convert single sync to batch format
      syncOperations = [
        {
          source,
          target,
          sourceProvider,
          targetProvider,
          type,
          recursive: recursive || false,
          deleteOrphaned: deleteOrphaned || false,
          dryRun: dryRun || false,
          compareBy,
        },
      ];
    } else {
      return res.status(400).json({
        success: false,
        error:
          'Either operations array or source/target pair with providers is required',
      });
    }

    // Sync operations are ALWAYS CPU intensive and should ALWAYS use workers
    const result = await workerService.processSync(syncOperations);

    res.json(result);
  } catch (error) {
    console.error('Synchronization error:', error);
    return res.status(500).json({
      success: false,
      error: 'Synchronization failed',
      details: error.message,
    });
  }
}
