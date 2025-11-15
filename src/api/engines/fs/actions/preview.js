/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

/**
 * Preview Actions
 *
 * Handles file preview operations for browser and mobile compatibility.
 */

import { FilesystemManager } from '../manager';
import {
  FilesystemError,
  getMimeType,
  getFileCategory,
  getFileExtension,
  formatFileSize,
  isImageFile,
  createResponse,
} from '../utils';

/**
 * Preview a file for browser/mobile display
 * @param {string} fileName - Name of file to preview
 * @param {Object} options - Preview options (width, height, quality)
 * @returns {Promise<Object>} Preview result with stream and metadata
 */
export async function previewFile(fileName, options = {}) {
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

    // Get file metadata
    const metadata = await manager.getMetadata(fileName);
    const mimeType = metadata.mimeType || getMimeType(fileName);
    const category = getFileCategory(fileName);

    // Check file type and determine preview capability
    const isImage = isImageFile(fileName);
    const isText = category === 'document' || category === 'text';
    const isPdf = mimeType === 'application/pdf';
    const isVideo = category === 'video';
    const isAudio = category === 'audio';

    // Determine if file can be previewed directly in browser
    const isDirectlyPreviewable =
      isImage || isText || isPdf || isVideo || isAudio;

    // Get file stream (works for all file types)
    const streamResult = await manager.getStream(fileName);
    const stream = streamResult.stream || streamResult;

    // For images, we might want to resize or optimize
    const previewOptions = {
      width: options.width,
      height: options.height,
      quality: options.quality || 80,
      format: options.format, // e.g., 'webp', 'jpeg'
    };

    // Determine Content-Disposition based on previewability
    const contentDisposition = isDirectlyPreviewable
      ? `inline; filename="${metadata.name || fileName}"`
      : `attachment; filename="${metadata.name || fileName}"`;

    return createResponse(
      true,
      {
        fileName,
        stream,
        metadata: {
          name: metadata.name || fileName,
          size: metadata.size,
          formattedSize: formatFileSize(metadata.size),
          mimeType,
          category,
          extension: getFileExtension(fileName),
          isImage,
          isText,
          isPdf,
          isVideo,
          isAudio,
          isDirectlyPreviewable,
          created: metadata.created,
          modified: metadata.modified,
        },
        previewOptions,
        headers: {
          'Content-Type': mimeType,
          'Content-Length': metadata.size,
          'Cache-Control': 'public, max-age=3600',
          'Content-Disposition': contentDisposition,
        },
      },
      'File preview ready',
    );
  } catch (error) {
    if (error instanceof FilesystemError) {
      return createResponse(false, null, error.message, error);
    }
    return createResponse(
      false,
      null,
      'Preview failed',
      new FilesystemError(error.message, 'PREVIEW_FAILED', 500),
    );
  }
}
