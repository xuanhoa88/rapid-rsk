/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

/**
 * Info Controller
 *
 * Handles file information retrieval operations.
 */

import * as filesystemActions from '../actions';

/**
 * Get file information
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export async function getFileInfo(req, res) {
  try {
    const { fileName } = req.query;

    if (!fileName) {
      return res.status(400).json({
        success: false,
        error: 'fileName parameter is required',
      });
    }

    const result = await filesystemActions.getFileInfo(fileName);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: 'File not found',
        fileName,
      });
    }

    res.json(result);
  } catch (error) {
    console.error('File info retrieval error:', error);
    return res.status(500).json({
      success: false,
      error: 'File info retrieval failed',
      details: error.message,
    });
  }
}
