/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

/**
 * Enhanced Sync Actions - Cross-provider synchronization operations
 * Supports synchronization between different storage servers/providers:
 * - File to File (single and multiple) across providers
 * - Folder to Folder (single and multiple) across providers
 * - Local to Cloud, Cloud to Cloud, etc.
 */

import { FilesystemError, createResponse } from '../utils';
import { FilesystemManager } from '../manager';

/**
 * Determine if a path is a file or directory on a specific provider
 * @param {string} filePath - Path to check
 * @param {string} provider - Provider name
 * @param {FilesystemManager} manager - Filesystem manager instance
 * @returns {Promise<Object>} Object with isFile, isDirectory, exists booleans
 */
async function getPathTypeOnProvider(filePath, provider, manager) {
  try {
    // Try to get metadata first (works for files)
    await manager.getMetadata(filePath, { provider });
    return { isFile: true, isDirectory: false, exists: true };
  } catch (error) {
    // If metadata fails, try to list as directory
    try {
      await manager.list(filePath, { provider });
      return { isFile: false, isDirectory: true, exists: true };
    } catch (listError) {
      return { isFile: false, isDirectory: false, exists: false };
    }
  }
}

/**
 * Synchronize a single file between providers
 * @param {string} sourceFile - Source file path
 * @param {string} targetFile - Target file path
 * @param {string} sourceProvider - Source provider name
 * @param {string} targetProvider - Target provider name
 * @param {Object} options - Sync options
 * @returns {Promise<Object>} Sync result
 */
async function syncFileBetweenProviders(
  sourceFile,
  targetFile,
  sourceProvider,
  targetProvider,
  options = {},
) {
  const manager = new FilesystemManager(options);

  try {
    // Check if source file exists on source provider
    const sourceType = await getPathTypeOnProvider(
      sourceFile,
      sourceProvider,
      manager,
    );
    if (!sourceType.exists || !sourceType.isFile) {
      throw new FilesystemError(
        `Source file not found on ${sourceProvider}: ${sourceFile}`,
        'FILE_NOT_FOUND',
        404,
      );
    }

    // Get source file metadata
    const sourceMetadata = await manager.getMetadata(sourceFile, {
      provider: sourceProvider,
    });

    // Check if target file exists on target provider
    const targetType = await getPathTypeOnProvider(
      targetFile,
      targetProvider,
      manager,
    );
    let shouldSync = true;
    let operation = 'add';

    if (targetType.exists && targetType.isFile) {
      // Target exists, check if update is needed
      const targetMetadata = await manager.getMetadata(targetFile, {
        provider: targetProvider,
      });

      if (options.compareBy === 'size') {
        shouldSync = sourceMetadata.size !== targetMetadata.size;
      } else if (options.compareBy === 'content') {
        // TODO: Implement content comparison (hash-based)
        shouldSync = sourceMetadata.modified > targetMetadata.modified;
      } else {
        // Default: compare by modification time
        shouldSync = sourceMetadata.modified > targetMetadata.modified;
      }

      operation = shouldSync ? 'update' : 'unchanged';
    }

    const result = {
      sourceFile,
      targetFile,
      sourceProvider,
      targetProvider,
      operation,
      synced: false,
      error: null,
    };

    // Perform cross-provider sync if needed and not dry run
    if (shouldSync && !options.dryRun) {
      try {
        await manager.copyBetweenProviders(
          sourceFile,
          sourceProvider,
          targetProvider,
          {
            destinationFileName: targetFile,
            overwrite: true,
            ...options,
          },
        );
        result.synced = true;
      } catch (error) {
        result.error = error.message;
      }
    } else if (shouldSync && options.dryRun) {
      result.synced = true; // Would sync in real run
    }

    return result;
  } catch (error) {
    return {
      sourceFile,
      targetFile,
      sourceProvider,
      targetProvider,
      operation: 'error',
      synced: false,
      error: error.message,
    };
  }
}

/**
 * Synchronize a directory between providers
 * @param {string} sourceDir - Source directory path
 * @param {string} targetDir - Target directory path
 * @param {string} sourceProvider - Source provider name
 * @param {string} targetProvider - Target provider name
 * @param {Object} options - Sync options
 * @returns {Promise<Object>} Sync result
 */
async function syncDirectoryBetweenProviders(
  sourceDir,
  targetDir,
  sourceProvider,
  targetProvider,
  options = {},
) {
  const manager = new FilesystemManager(options);

  try {
    // Check if source directory exists on source provider
    const sourceType = await getPathTypeOnProvider(
      sourceDir,
      sourceProvider,
      manager,
    );
    if (!sourceType.exists || !sourceType.isDirectory) {
      throw new FilesystemError(
        `Source directory not found on ${sourceProvider}: ${sourceDir}`,
        'DIRECTORY_NOT_FOUND',
        404,
      );
    }

    // Get list of files from source provider
    const sourceFiles = await manager.list(sourceDir, {
      provider: sourceProvider,
      recursive: options.recursive || false,
      filesOnly: false, // Include both files and directories
    });

    // Get list of files from target provider (create if doesn't exist)
    let targetFiles = [];
    const targetType = await getPathTypeOnProvider(
      targetDir,
      targetProvider,
      manager,
    );

    if (targetType.exists && targetType.isDirectory) {
      targetFiles = await manager.list(targetDir, {
        provider: targetProvider,
        recursive: options.recursive || false,
        filesOnly: false,
      });
    }

    // Create maps for easier comparison
    const sourceMap = new Map(sourceFiles.map(f => [f.name, f]));
    const targetMap = new Map(targetFiles.map(f => [f.name, f]));

    const operations = {
      toAdd: [], // Files that exist in source but not in target
      toUpdate: [], // Files that exist in both but are different
      toDelete: [], // Files that exist in target but not in source
      unchanged: [], // Files that are the same in both
    };

    for (const [fileName, sourceFile] of sourceMap) {
      const targetFile = targetMap.get(fileName);

      if (!targetFile) {
        operations.toAdd.push(sourceFile);
      } else if (sourceFile.isFile && targetFile.isFile) {
        // Compare files
        if (options.compareBy === 'size') {
          if (sourceFile.size !== targetFile.size) {
            operations.toUpdate.push({
              source: sourceFile,
              target: targetFile,
            });
          } else {
            operations.unchanged.push(sourceFile);
          }
        } else {
          // Default: compare by modification time
          if (sourceFile.modifiedAt > targetFile.modifiedAt) {
            operations.toUpdate.push({
              source: sourceFile,
              target: targetFile,
            });
          } else {
            operations.unchanged.push(sourceFile);
          }
        }
      } else {
        operations.unchanged.push(sourceFile);
      }
    }

    // Check files in target that don't exist in source
    if (options.deleteOrphaned) {
      for (const [fileName, targetFile] of targetMap) {
        if (!sourceMap.has(fileName)) {
          operations.toDelete.push(targetFile);
        }
      }
    }

    const results = {
      added: [],
      updated: [],
      deleted: [],
      errors: [],
    };

    if (!options.dryRun) {
      // Add new files using cross-provider copy
      for (const file of operations.toAdd) {
        try {
          if (file.isFile) {
            await manager.copyBetweenProviders(
              file.name,
              sourceProvider,
              targetProvider,
              {
                destinationFileName: file.name,
                overwrite: true,
                ...options,
              },
            );
          }
          // TODO: Handle directory creation across providers

          results.added.push(file.name);
        } catch (error) {
          results.errors.push({
            operation: 'add',
            fileName: file.name,
            error: error.message,
          });
        }
      }

      // Update existing files using cross-provider copy
      for (const { source } of operations.toUpdate) {
        try {
          await manager.copyBetweenProviders(
            source.name,
            sourceProvider,
            targetProvider,
            {
              destinationFileName: source.name,
              overwrite: true,
              ...options,
            },
          );
          results.updated.push(source.name);
        } catch (error) {
          results.errors.push({
            operation: 'update',
            fileName: source.name,
            error: error.message,
          });
        }
      }

      // Delete orphaned files from target provider
      for (const file of operations.toDelete) {
        try {
          await manager.delete(file.name, { provider: targetProvider });
          results.deleted.push(file.name);
        } catch (error) {
          results.errors.push({
            operation: 'delete',
            fileName: file.name,
            error: error.message,
          });
        }
      }
    }

    return {
      sourceDir,
      targetDir,
      sourceProvider,
      targetProvider,
      dryRun: options.dryRun || false,
      operations: {
        toAdd: operations.toAdd.length,
        toUpdate: operations.toUpdate.length,
        toDelete: operations.toDelete.length,
        unchanged: operations.unchanged.length,
      },
      results,
      summary: {
        totalFiles: sourceFiles.length,
        addedCount: results.added.length,
        updatedCount: results.updated.length,
        deletedCount: results.deleted.length,
        errorCount: results.errors.length,
      },
    };
  } catch (error) {
    return {
      sourceDir,
      targetDir,
      sourceProvider,
      targetProvider,
      error: error.message,
      success: false,
    };
  }
}

/**
 * Synchronize files or directories between providers (single operation)
 * @param {Object} syncOptions - Synchronization options
 * @param {string} syncOptions.source - Source path
 * @param {string} syncOptions.target - Target path
 * @param {string} syncOptions.sourceProvider - Source provider name (e.g., 'local', 's3', 'gcs')
 * @param {string} syncOptions.targetProvider - Target provider name (e.g., 'local', 's3', 'gcs')
 * @param {string} syncOptions.type - Type: 'file' or 'directory' (auto-detect if not specified)
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Synchronization result
 */
export async function synchronizeFile(syncOptions, options = {}) {
  try {
    if (!syncOptions.source || !syncOptions.target) {
      throw new FilesystemError(
        'Source and target are required for synchronization',
        'INVALID_INPUT',
        400,
      );
    }

    if (!syncOptions.sourceProvider || !syncOptions.targetProvider) {
      throw new FilesystemError(
        'Source and target providers are required for cross-provider synchronization',
        'INVALID_INPUT',
        400,
      );
    }

    const manager = new FilesystemManager(options);
    let syncType = syncOptions.type;

    // Auto-detect type if not specified
    if (!syncType) {
      const sourceType = await getPathTypeOnProvider(
        syncOptions.source,
        syncOptions.sourceProvider,
        manager,
      );
      if (!sourceType.exists) {
        throw new FilesystemError(
          `Source not found on ${syncOptions.sourceProvider}: ${syncOptions.source}`,
          'SOURCE_NOT_FOUND',
          404,
        );
      }
      syncType = sourceType.isFile ? 'file' : 'directory';
    }

    let result;

    if (syncType === 'file') {
      // File to file cross-provider synchronization
      const syncResult = await syncFileBetweenProviders(
        syncOptions.source,
        syncOptions.target,
        syncOptions.sourceProvider,
        syncOptions.targetProvider,
        {
          ...options,
          dryRun: syncOptions.dryRun,
          compareBy: syncOptions.compareBy,
        },
      );

      result = {
        type: 'file',
        source: syncOptions.source,
        target: syncOptions.target,
        sourceProvider: syncOptions.sourceProvider,
        targetProvider: syncOptions.targetProvider,
        dryRun: syncOptions.dryRun || false,
        operation: syncResult.operation,
        synced: syncResult.synced,
        error: syncResult.error,
        synchronizedAt: new Date().toISOString(),
      };
    } else {
      // Directory to directory cross-provider synchronization
      const syncResult = await syncDirectoryBetweenProviders(
        syncOptions.source,
        syncOptions.target,
        syncOptions.sourceProvider,
        syncOptions.targetProvider,
        {
          ...options,
          dryRun: syncOptions.dryRun,
          recursive: syncOptions.recursive,
          deleteOrphaned: syncOptions.deleteOrphaned,
          compareBy: syncOptions.compareBy,
        },
      );

      result = {
        type: 'directory',
        ...syncResult,
        synchronizedAt: new Date().toISOString(),
      };
    }

    const success = !result.error;
    const message = success
      ? `${syncType} cross-provider synchronization completed successfully`
      : `${syncType} cross-provider synchronization failed`;

    return createResponse(success, result, message);
  } catch (error) {
    if (error instanceof FilesystemError) {
      return createResponse(false, null, error.message, error);
    }
    return createResponse(
      false,
      null,
      'Cross-provider synchronization failed',
      new FilesystemError(error.message, 'SYNC_FAILED', 500),
    );
  }
}

/**
 * Synchronize multiple files or directories (batch operations)
 * @param {Array} syncOperations - Array of sync operations
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Synchronization results
 */
export async function synchronizeFiles(syncOperations, options = {}) {
  try {
    if (!Array.isArray(syncOperations) || syncOperations.length === 0) {
      throw new FilesystemError(
        'Sync operations array is required',
        'INVALID_INPUT',
        400,
      );
    }

    const results = await Promise.allSettled(
      syncOperations.map(async operation => {
        try {
          return await synchronizeFile(operation, options);
        } catch (error) {
          return {
            success: false,
            data: {
              source: operation.source,
              target: operation.target,
            },
            message: `Failed to sync: ${operation.source} → ${operation.target}`,
            error,
          };
        }
      }),
    );

    const successful = [];
    const failed = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.success) {
        successful.push(result.value);
      } else {
        failed.push({
          operation: syncOperations[index],
          error: result.reason || result.value.error,
          message:
            (result.reason && result.reason.message) ||
            (result.value && result.value.message) ||
            'Unknown error',
        });
      }
    });

    return createResponse(
      true,
      {
        successful,
        failed,
        totalOperations: syncOperations.length,
        successCount: successful.length,
        failCount: failed.length,
      },
      `Synchronized ${successful.length} of ${syncOperations.length} operations successfully`,
    );
  } catch (error) {
    if (error instanceof FilesystemError) {
      return createResponse(false, null, error.message, error);
    }
    return createResponse(
      false,
      null,
      'Batch synchronization failed',
      new FilesystemError(error.message, 'BATCH_SYNC_FAILED', 500),
    );
  }
}
