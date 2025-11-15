/**
 * Delete Actions - File deletion operations
 */

import { FilesystemError, createResponse } from '../utils';
import { FilesystemManager } from '../manager';

/**
 * Delete a single file
 * @param {string} fileName - Name of file to delete
 * @param {Object} options - Options
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteFile(fileName, options = {}) {
  try {
    const manager = new FilesystemManager(options);

    // Check if file exists
    const exists = await manager.exists(fileName);
    if (!exists) {
      throw new FilesystemError(
        `File not found: ${fileName}`,
        'FILE_NOT_FOUND',
        404,
      );
    }

    // Delete the file
    await manager.delete(fileName);

    return createResponse(
      true,
      {
        fileName,
        deletedAt: new Date().toISOString(),
      },
      'File deleted successfully',
    );
  } catch (error) {
    if (error instanceof FilesystemError) {
      return createResponse(false, null, error.message, error);
    }
    return createResponse(
      false,
      null,
      'Delete failed',
      new FilesystemError(error.message, 'DELETE_FAILED', 500),
    );
  }
}

/**
 * Delete multiple files
 * @param {Array} fileNames - Array of file names to delete
 * @param {Object} options - Options
 * @returns {Promise<Object>} Deletion results
 */
export async function deleteFiles(fileNames, options = {}) {
  try {
    if (!Array.isArray(fileNames) || fileNames.length === 0) {
      throw new FilesystemError(
        'File names array is required',
        'INVALID_INPUT',
        400,
      );
    }

    const results = await Promise.allSettled(
      fileNames.map(async fileName => {
        try {
          const result = await deleteFile(fileName, options);
          return result;
        } catch (error) {
          return createResponse(
            false,
            { fileName },
            `Failed to delete file: ${fileName}`,
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
        totalFiles: fileNames.length,
        successCount: successful.length,
        failCount: failed.length,
      },
      `Deleted ${successful.length} of ${fileNames.length} files successfully`,
    );
  } catch (error) {
    return createResponse(
      false,
      null,
      'Batch delete failed',
      new FilesystemError(error.message, 'BATCH_DELETE_FAILED', 500),
    );
  }
}
