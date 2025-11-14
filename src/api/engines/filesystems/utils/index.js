/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

/**
 * Filesystem Utilities - Main Export File
 *
 * This file exports all utilities from the separated modules for easy importing.
 * Import from this file to maintain backward compatibility with the original utils.js
 */

// Constants and Configuration
export {
  SIZE_LIMITS,
  DEFAULT_FILE_SIZES,
  MAX_FILE_SIZE,
  MAX_FILENAME_LENGTH,
  UPLOAD_DIR,
  ALLOWED_EXTENSIONS,
  ENABLE_COMPRESSION,
  ORGANIZE_BY_DATE,
  ORGANIZE_BY_CATEGORY,
  ORGANIZE_BY_USER,
  DEFAULT_PROVIDER,
  ERROR_CODES,
} from './constants';

// File Types and MIME Types
export {
  FILE_TYPES,
  getMimeTypesForCategories,
  getFileTypeCategories,
  hasFileTypeCategory,
  getFileTypeInfo,
  getSupportedExtensions,
  getSupportedMimeTypes,
  getAllSupportedExtensions,
  getAllSupportedMimeTypes,
  isSupportedExtension,
  isSupportedMimeType,
  getMimeType,
} from './file-types';

// File Utilities
export {
  generateSecureFileName,
  getFileExtension,
  isAllowedExtension,
  isValidFileSize,
  formatFileSize,
  parseFileSize,
  generateFileHash,
  isImageFile,
  isDocumentFile,
  isArchiveFile,
  isAudioFile,
  isVideoFile,
  getFileCategory,
  createDirectoryPath,
} from './file-utils';

// Upload Presets
export { UPLOAD_PRESETS } from './upload-presets';

// Error Handling
export { FilesystemError, createResponse } from './errors';

// ZIP Utilities
export { createZip, extractZip } from './zip-utils';

// Worker Utilities
export { setupForkMode, createWorker } from './worker-utils';
