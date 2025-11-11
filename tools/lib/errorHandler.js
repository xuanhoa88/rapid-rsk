/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import { isVerbose, logError, logInfo, logWarn } from './logger';

/**
 * Custom error class with context information
 */
export class BuildError extends Error {
  constructor(message, context = {}) {
    super(message);
    this.name = 'BuildError';
    this.context = context;
  }
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry an operation with exponential backoff
 * @param {Function} operation - Async function to retry
 * @param {Object} options - Retry options
 * @returns {Promise} - Result of the operation
 */
export async function withRetry(operation, options = {}) {
  const maxRetries = options.maxRetries !== undefined ? options.maxRetries : 2;
  const delay = options.delay !== undefined ? options.delay : 1000;
  const backoff = options.backoff !== undefined ? options.backoff : 1.5;
  const context = options.context !== undefined ? options.context : {};

  let lastError;
  let currentDelay = delay;
  const verbose = isVerbose();

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation(context);

      // Log successful retry
      if (attempt > 0) {
        logInfo(
          `✅ Succeeded after ${attempt} ${
            attempt === 1 ? 'retry' : 'retries'
          }`,
        );
      }

      return result;
    } catch (error) {
      lastError = error;

      // Don't retry on last attempt
      if (attempt === maxRetries) break;

      // Log retry attempt
      logWarn(
        `⚠️  Attempt ${attempt + 1}/${maxRetries + 1} failed: ${error.message}`,
      );

      if (verbose) {
        logWarn(`   Retrying in ${currentDelay}ms...`);
      }

      await sleep(currentDelay);
      currentDelay *= backoff;
    }
  }

  // All attempts failed
  throw new BuildError(
    `Operation failed after ${maxRetries + 1} attempts: ${lastError.message}`,
    { ...context, originalError: lastError, attempts: maxRetries + 1 },
  );
}

/**
 * Retry file system operations
 */
export function withFileSystemRetry(operation, context = {}) {
  return withRetry(operation, {
    maxRetries: 2,
    delay: 500,
    backoff: 1.5,
    context: { ...context, type: 'filesystem' },
  });
}

/**
 * Retry build operations
 */
export function withBuildRetry(operation, context = {}) {
  return withRetry(operation, {
    maxRetries: 1,
    delay: 2000,
    backoff: 1,
    context: { ...context, type: 'build' },
  });
}

/**
 * Get suggestion for common error codes
 */
function getErrorSuggestion(errorCode) {
  const suggestions = {
    ENOENT: 'File or directory not found. Check the path.',
    EACCES: 'Permission denied. Check file permissions.',
    EADDRINUSE: 'Port already in use. Try a different port.',
    ECONNREFUSED: 'Connection refused. Check if service is running.',
    ETIMEDOUT: 'Operation timed out. Check network connection.',
    EMFILE: 'Too many open files. Increase file descriptor limit.',
    ENOSPC: 'No space left on device. Free up disk space.',
  };
  return suggestions[errorCode];
}

/**
 * Log detailed error with context, stack trace, and suggestions
 * Use this for comprehensive error reporting with additional context
 */
export function logDetailedError(error, context = {}) {
  const verbose = isVerbose(); // Cache verbose check
  const errorParts = [error.message];

  // Show context in verbose mode
  if (verbose && (error.context || Object.keys(context).length > 0)) {
    errorParts.push(
      `\nContext: ${JSON.stringify({ ...error.context, ...context }, null, 2)}`,
    );
  }

  // Show stack trace in verbose mode
  if (verbose && error.stack) {
    errorParts.push(`\nStack trace:\n${error.stack}`);
  }

  // Show suggestion for common errors
  if (error.code) {
    const suggestion = getErrorSuggestion(error.code);
    if (suggestion) {
      errorParts.push(`\n💡 ${suggestion}`);
    }
  }

  logError(errorParts.join(''));
}

/**
 * Setup graceful shutdown handlers
 */
export function setupGracefulShutdown(cleanupFn) {
  const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];

  signals.forEach(signal => {
    process.on(signal, async () => {
      logInfo(`🛑 Received ${signal}, shutting down...`);

      try {
        if (cleanupFn) await cleanupFn();
        process.exit(0);
      } catch (error) {
        logDetailedError(error, { phase: 'cleanup', signal });
        process.exit(1);
      }
    });
  });

  process.on('uncaughtException', error => {
    logDetailedError(error, { type: 'uncaughtException' });
    process.exit(1);
  });

  process.on('unhandledRejection', reason => {
    logDetailedError(new Error(`Unhandled rejection: ${reason}`), {
      type: 'unhandledRejection',
    });
    process.exit(1);
  });
}
