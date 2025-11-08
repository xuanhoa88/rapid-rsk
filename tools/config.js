/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import path from 'path';

// Root directory - can be overridden via CWD environment variable
// If CWD is set and absolute, use it; otherwise resolve relative to cwd
const CWD = (() => {
  const rootEnv = process.env.CWD;
  if (!rootEnv) return process.cwd();
  return path.isAbsolute(rootEnv)
    ? rootEnv
    : path.resolve(process.cwd(), rootEnv);
})();

// Helper function to resolve paths from root
const resolvePath = (...args) => path.resolve(CWD, ...args);

// Directory paths - resolve environment variables to absolute paths
// If env var is absolute path, use it; otherwise resolve relative to CWD
const resolveDir = (envVar, defaultRelative) => {
  const envValue = process.env[envVar];
  if (!envValue) return resolvePath(defaultRelative);
  return path.isAbsolute(envValue) ? envValue : resolvePath(envValue);
};

const BUILD_DIR = resolveDir('BUILD_DIR', 'build');
const APP_DIR = resolveDir('APP_DIR', 'src');
const PUBLIC_DIR = resolveDir('PUBLIC_DIR', 'public');
const NODE_MODULES_DIR = resolveDir('NODE_MODULES_DIR', 'node_modules');

// ============================================================================
// Configuration Object
// ============================================================================

export default {
  // Path resolver
  resolvePath,

  // Root directory
  CWD,

  // Directory paths (absolute, resolved from root or env vars)
  BUILD_DIR,
  APP_DIR,
  PUBLIC_DIR,
  NODE_MODULES_DIR,

  // Clean configuration (clean.js)
  cleanEnableDeepClean: process.env.CLEAN_DEEP === 'true',
  cleanPreserveGit: process.env.CLEAN_PRESERVE_GIT !== 'false',
  cleanPreserveNodeModules: process.env.CLEAN_PRESERVE_NODE_MODULES !== 'false',
  cleanDryRun: process.env.CLEAN_DRY_RUN === 'true',
  cleanMaxAge:
    parseInt(process.env.CLEAN_MAX_AGE, 10) || 7 * 24 * 60 * 60 * 1000, // 7 days

  // Bundle configuration - Analysis and reporting
  bundleAnalyze: process.env.BUNDLE_ANALYZE === 'true',
  bundleProfile: process.env.BUNDLE_PROFILE === 'true',
  bundleOptimize: process.env.BUNDLE_OPTIMIZE !== 'false',
  bundleSourceMaps: process.env.BUNDLE_SOURCE_MAPS !== 'false',
  bundleCompression: process.env.BUNDLE_COMPRESSION !== 'false',

  // Bundle configuration - Performance limits
  bundleMaxAssetSize: parseInt(process.env.BUNDLE_MAX_ASSET_SIZE, 10) || 250000, // 250KB
  bundleMaxEntrypointSize:
    parseInt(process.env.BUNDLE_MAX_ENTRYPOINT_SIZE, 10) || 250000, // 250KB
  bundleMaxChunkSize:
    parseInt(process.env.BUNDLE_MAX_CHUNK_SIZE, 10) || 1000000, // 1MB

  // Bundle configuration - Paths and directories
  bundleReportPath:
    process.env.BUNDLE_REPORT_PATH ||
    path.join(BUILD_DIR, 'bundle-report.json'),
  bundleStatsPath:
    process.env.BUNDLE_STATS_PATH || path.join(BUILD_DIR, 'bundle-stats.json'),

  // Bundle configuration - Advanced features
  bundleTreeShaking: process.env.BUNDLE_TREE_SHAKING !== 'false',
  bundleSplitChunks: process.env.BUNDLE_SPLIT_CHUNKS !== 'false',
  bundleMinification: process.env.BUNDLE_MINIFICATION !== 'false',

  // Bundle configuration - Monitoring and alerts
  bundlePerformanceHints: process.env.BUNDLE_PERFORMANCE_HINTS !== 'false',
  bundleSizeTracking: process.env.BUNDLE_SIZE_TRACKING !== 'false',
  bundleAlertThreshold: parseFloat(process.env.BUNDLE_ALERT_THRESHOLD) || 0.1, // 10% size increase

  // Bundle configuration - Build optimization
  bundleProgressReporting: process.env.BUNDLE_PROGRESS !== 'false',

  // Build configuration - Analysis and profiling
  buildAnalyze: process.env.BUILD_ANALYZE === 'true',
  buildProfile: process.env.BUILD_PROFILE === 'true',
  buildValidate: process.env.BUILD_VALIDATE !== 'false',
  buildParallel: process.env.BUILD_PARALLEL === 'true',

  // Build configuration - Reporting
  buildGenerateReport: process.env.BUILD_REPORT !== 'false',
  buildReportPath:
    process.env.BUILD_REPORT_PATH || path.join(BUILD_DIR, 'build-report.json'),
  buildStatsPath:
    process.env.BUILD_STATS_PATH || path.join(BUILD_DIR, 'build-stats.json'),

  // Build configuration - Error handling and retry
  buildMaxRetries: parseInt(process.env.BUILD_MAX_RETRIES, 10) || 1,
  buildTimeout: parseInt(process.env.BUILD_TIMEOUT, 10) || 600000, // 10 minutes
  buildContinueOnError: process.env.BUILD_CONTINUE_ON_ERROR === 'true',
  buildContinueOnDockerError:
    process.env.BUILD_CONTINUE_ON_DOCKER_ERROR === 'true',

  // i18n configuration (react-i18next)
  i18nTranslationsDir: path.join(APP_DIR, 'i18n', 'translations'),
  i18nSourceExtensions:
    process.env.I18N_SOURCE_EXTENSIONS || '.js,.jsx,.ts,.tsx',
  i18nWatchDebounce: parseInt(process.env.I18N_WATCH_DEBOUNCE, 10) || 300,
  i18nValidate: process.env.I18N_VALIDATE !== 'false',
  i18nBackup: process.env.I18N_BACKUP !== 'false',
};
