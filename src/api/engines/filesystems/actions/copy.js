/**
 * Copy Actions - File copy operations
 */

import { FilesystemError, createResponse } from '../utils';
import { FilesystemManager } from '../manager';

/**
 * Copy a file
 * @param {string} sourceFileName - Source file name
 * @param {string} targetFileName - Target file name
 * @param {Object} options - Options
 * @returns {Promise<Object>} Copy result
 */
export async function copyFile(sourceFileName, targetFileName, options = {}) {
  try {
    const manager = new FilesystemManager(options);

    // Check if source file exists
    const exists = await manager.exists(sourceFileName);
    if (!exists) {
      throw new FilesystemError(
        `Source file not found: ${sourceFileName}`,
        'FILE_NOT_FOUND',
        404,
      );
    }

    // Check if target file already exists
    const targetExists = await manager.exists(targetFileName);
    if (targetExists && !options.overwrite) {
      throw new FilesystemError(
        `Target file already exists: ${targetFileName}`,
        'FILE_EXISTS',
        409,
      );
    }

    // Copy the file
    const result = await manager.copy(sourceFileName, targetFileName, options);

    return createResponse(
      true,
      {
        sourceFileName,
        targetFileName: result.fileName || targetFileName,
        copiedAt: new Date().toISOString(),
      },
      'File copied successfully',
    );
  } catch (error) {
    if (error instanceof FilesystemError) {
      return createResponse(false, null, error.message, error);
    }
    return createResponse(
      false,
      null,
      'Copy failed',
      new FilesystemError(error.message, 'COPY_FAILED', 500),
    );
  }
}

/**
 * Copy multiple files
 * @param {Array} copyOperations - Array of {sourceFileName, targetFileName} objects
 * @param {Object} options - Options
 * @returns {Promise<Object>} Copy results
 */
export async function copyFiles(copyOperations, options = {}) {
  try {
    if (!Array.isArray(copyOperations) || copyOperations.length === 0) {
      throw new FilesystemError(
        'Copy operations array is required',
        'INVALID_INPUT',
        400,
      );
    }

    // Validate all copy operations
    for (const operation of copyOperations) {
      if (!operation.sourceFileName || !operation.targetFileName) {
        throw new FilesystemError(
          'Each copy operation must have sourceFileName and targetFileName',
          'INVALID_INPUT',
          400,
        );
      }
    }

    const results = await Promise.allSettled(
      copyOperations.map(async operation => {
        try {
          const result = await copyFile(
            operation.sourceFileName,
            operation.targetFileName,
            options,
          );
          return result;
        } catch (error) {
          return createResponse(
            false,
            {
              sourceFileName: operation.sourceFileName,
              targetFileName: operation.targetFileName,
            },
            `Failed to copy file: ${operation.sourceFileName}`,
            error,
          );
        }
      }),
    );

    const successful = results
      .filter(r => r.value && r.value.success)
      .map(r => r.value);
    const failed = results
      .filter(r => !r.value || !r.value.success)
      .map(r => r.value || r.reason);

    return createResponse(
      true,
      {
        successful,
        failed,
        totalOperations: copyOperations.length,
        successCount: successful.length,
        failCount: failed.length,
      },
      `Copied ${successful.length} of ${copyOperations.length} files successfully`,
    );
  } catch (error) {
    return createResponse(
      false,
      null,
      'Batch copy failed',
      new FilesystemError(error.message, 'BATCH_COPY_FAILED', 500),
    );
  }
}
