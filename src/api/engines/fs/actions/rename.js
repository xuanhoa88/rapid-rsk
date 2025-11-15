/**
 * Rename Actions - File rename operations
 */

import { FilesystemError, createResponse } from '../utils';
import { FilesystemManager } from '../manager';

/**
 * Rename a single file
 * @param {string} oldFileName - Current file name
 * @param {string} newFileName - New file name
 * @param {Object} options - Options
 * @returns {Promise<Object>} Rename result
 */
export async function renameFile(oldFileName, newFileName, options = {}) {
  try {
    const manager = new FilesystemManager(options);

    // Check if source file exists
    const exists = await manager.exists(oldFileName);
    if (!exists) {
      throw new FilesystemError(
        `File not found: ${oldFileName}`,
        'FILE_NOT_FOUND',
        404,
      );
    }

    // Check if target file already exists
    const targetExists = await manager.exists(newFileName);
    if (targetExists && !options.overwrite) {
      throw new FilesystemError(
        `Target file already exists: ${newFileName}`,
        'FILE_EXISTS',
        409,
      );
    }

    // Rename the file (using move operation)
    const result = await manager.move(oldFileName, newFileName, options);

    return createResponse(
      true,
      {
        oldFileName,
        newFileName: result.fileName || newFileName,
        renamedAt: new Date().toISOString(),
      },
      'File renamed successfully',
    );
  } catch (error) {
    if (error instanceof FilesystemError) {
      return createResponse(false, null, error.message, error);
    }
    return createResponse(
      false,
      null,
      'Rename failed',
      new FilesystemError(error.message, 'RENAME_FAILED', 500),
    );
  }
}

/**
 * Rename multiple files
 * @param {Array} renameOperations - Array of {oldFileName, newFileName} objects
 * @param {Object} options - Options
 * @returns {Promise<Object>} Rename results
 */
export async function renameFiles(renameOperations, options = {}) {
  try {
    if (!Array.isArray(renameOperations) || renameOperations.length === 0) {
      throw new FilesystemError(
        'Rename operations array is required',
        'INVALID_INPUT',
        400,
      );
    }

    // Validate all rename operations
    for (const operation of renameOperations) {
      if (!operation.oldFileName || !operation.newFileName) {
        throw new FilesystemError(
          'Each rename operation must have oldFileName and newFileName',
          'INVALID_INPUT',
          400,
        );
      }
    }

    const results = await Promise.allSettled(
      renameOperations.map(async operation => {
        try {
          const result = await renameFile(
            operation.oldFileName,
            operation.newFileName,
            options,
          );
          return result;
        } catch (error) {
          return createResponse(
            false,
            {
              oldFileName: operation.oldFileName,
              newFileName: operation.newFileName,
            },
            `Failed to rename file: ${operation.oldFileName}`,
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
        totalOperations: renameOperations.length,
        successCount: successful.length,
        failCount: failed.length,
      },
      `Renamed ${successful.length} of ${renameOperations.length} files successfully`,
    );
  } catch (error) {
    return createResponse(
      false,
      null,
      'Batch rename failed',
      new FilesystemError(error.message, 'BATCH_RENAME_FAILED', 500),
    );
  }
}
