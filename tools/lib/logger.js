/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * Copyright © 2014-present. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

// ============================================================================
// Log Level Management
// ============================================================================

const LOG_LEVELS = {
  silent: 0,
  error: 1,
  warn: 2,
  info: 3,
  verbose: 4,
  debug: 5,
};

/**
 * Get the current logging level
 * Priority: CLI flags > Environment variables > Default (info)
 */
export function getLogLevel() {
  // Check CLI flags first
  if (process.argv.includes('--silent')) return 'silent';
  if (process.argv.includes('--verbose')) return 'verbose';
  if (process.argv.includes('--debug')) return 'debug';

  // Check environment variables
  const envLevel = process.env.LOG_LEVEL?.toLowerCase();
  if (envLevel && LOG_LEVELS[envLevel] !== undefined) {
    return envLevel;
  }

  // Legacy environment variables
  if (process.env.SILENT === 'true') return 'silent';
  if (process.env.VERBOSE === 'true') return 'verbose';

  return 'info';
}

/**
 * Check if a log level should be shown
 */
function shouldLog(level) {
  const currentLevel = getLogLevel();
  return LOG_LEVELS[level] <= LOG_LEVELS[currentLevel];
}

// ============================================================================
// Convenience Functions
// ============================================================================

export function isSilent() {
  return getLogLevel() === 'silent';
}

export function isVerbose() {
  const level = getLogLevel();
  return level === 'verbose' || level === 'debug';
}

export function isDebug() {
  return getLogLevel() === 'debug';
}

/**
 * Get verbose configuration object
 * Returns flags for different types of verbose output
 */
export function getVerboseConfig() {
  const verbose = isVerbose();
  const debug = isDebug();

  return {
    isVerbose: verbose,
    isDebug: debug,
    showPerformance: verbose,
    showMemory: debug,
    showTiming: verbose,
    showStats: verbose,
    showDebugInfo: debug,
    showStackTrace: debug,
    showContext: verbose,
    showAssets: verbose,
    showModules: debug,
    showChunks: debug,
  };
}

// ============================================================================
// Core Logging Functions
// ============================================================================

/**
 * Log error messages (always shown unless silent)
 */
export function logError(message, ...args) {
  if (shouldLog('error')) {
    console.error(`❌ ${message}`, ...args);
  }
}

/**
 * Log warning messages
 */
export function logWarn(message, ...args) {
  if (shouldLog('warn')) {
    console.warn(`⚠️  ${message}`, ...args);
  }
}

/**
 * Log info messages
 */
export function logInfo(message, ...args) {
  if (shouldLog('info')) {
    console.info(`ℹ️  ${message}`, ...args);
  }
}

/**
 * Log verbose messages
 */
export function logVerbose(message, ...args) {
  if (shouldLog('verbose')) {
    console.info(`📝 ${message}`, ...args);
  }
}

/**
 * Log debug messages
 */
export function logDebug(message, ...args) {
  if (shouldLog('debug')) {
    console.info(`🔍 ${message}`, ...args);
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format bytes to human-readable format
 */
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(ms) {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.round((ms % 60000) / 1000);
  return `${minutes}m ${seconds}s`;
}

/**
 * Format timestamp to HH:MM:SS
 */
export function formatTimestamp(time = new Date()) {
  return time.toTimeString().replace(/.*(\d{2}:\d{2}:\d{2}).*/, '$1');
}

/**
 * Get current memory usage
 */
export function getMemoryUsage() {
  const usage = process.memoryUsage();
  return {
    rss: usage.rss,
    heapUsed: usage.heapUsed,
    heapTotal: usage.heapTotal,
    external: usage.external,
    formatted: {
      rss: formatBytes(usage.rss),
      heapUsed: formatBytes(usage.heapUsed),
      heapTotal: formatBytes(usage.heapTotal),
      external: formatBytes(usage.external),
    },
  };
}
