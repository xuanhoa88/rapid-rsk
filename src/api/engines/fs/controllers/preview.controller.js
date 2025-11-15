/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

/**
 * Preview Controller
 *
 * Handles file preview operations.
 */

import * as filesystemActions from '../actions';

/**
 * Handle file preview
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function previewFile(req, res) {
  try {
    const { fileName } = req.query;

    if (!fileName) {
      return res.status(400).json({
        success: false,
        error: 'fileName parameter is required',
      });
    }

    const result = await filesystemActions.previewFile(fileName);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: 'File not found',
        fileName,
      });
    }

    // Set headers for preview
    if (result.data.headers) {
      Object.entries(result.data.headers).forEach(([key, value]) =>
        res.set(key, value),
      );
    }

    // Add cache headers for preview
    res.set({
      'Cache-Control': 'public, max-age=3600',
      'Content-Disposition': `inline; filename="${result.data.metadata.name}"`,
    });

    // Stream the file for preview
    const stream = result.data.stream.stream || result.data.stream;
    stream.pipe(res);
  } catch (error) {
    console.error('Preview error:', error);
    return res.status(500).json({
      success: false,
      error: 'Preview failed',
      details: error.message,
    });
  }
}
