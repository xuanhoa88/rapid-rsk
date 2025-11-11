/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';
import webpack from 'webpack';
import pkg from '../../package.json';
import config from '../config';
import {
  BuildError,
  logDetailedError,
  setupGracefulShutdown,
  withBuildRetry,
} from '../lib/errorHandler';
import { copyDir, copyFile, writeFile } from '../lib/fs';
import {
  formatBytes,
  formatDuration,
  isSilent,
  isVerbose,
  logDebug,
  logInfo,
  logVerbose,
  logWarn,
} from '../lib/logger';
import { clientConfig, serverConfig } from '../webpack';
import clean from './clean';
import messages from './i18n';

/**
 * Generate package.json for build directory
 * Contains only engines and dependencies - no scripts needed
 * Users run the server directly with: node server.js
 */
function generateBuildPackageJson() {
  const buildPackage = {
    private: true,
    engines: pkg.engines,
    dependencies: pkg.dependencies,
  };

  return JSON.stringify(buildPackage, null, 2);
}

/**
 * Copy static files to build directory
 * Simple copy since it always runs after clean in the build pipeline
 */
async function copyFiles() {
  logInfo(`📁 Copying static files...`);

  try {
    // 1. Generate package.json
    const packageJson = generateBuildPackageJson();
    await writeFile(path.join(config.BUILD_DIR, 'package.json'), packageJson);
    logDebug('Generated package.json');

    // 2. Copy LICENSE.txt if it exists
    if (fs.existsSync('LICENSE.txt')) {
      await copyFile('LICENSE.txt', path.join(config.BUILD_DIR, 'LICENSE.txt'));
      logDebug('Copied LICENSE.txt');
    }

    // 3. Copy public directory if it exists
    if (fs.existsSync(config.PUBLIC_DIR)) {
      await copyDir(config.PUBLIC_DIR, path.join(config.BUILD_DIR, 'public'));
      logDebug('Copied public directory');
    }

    // 4. Copy i18n translations if they exist
    const i18nSource = path.join(config.APP_DIR, 'i18n', 'translations');
    if (fs.existsSync(i18nSource)) {
      await copyDir(
        i18nSource,
        path.join(config.BUILD_DIR, 'i18n', 'translations'),
      );
      logDebug('Copied i18n translations');
    }

    logInfo('✅ Static files copied');
  } catch (error) {
    throw new BuildError(`Copy failed: ${error.message}`, {
      originalError: error.message,
    });
  }
}

/**
 * Validate build prerequisites
 */
function validatePrerequisites() {
  if (!fs.existsSync(config.APP_DIR)) {
    throw new BuildError('src directory not found');
  }

  if (!fs.existsSync(config.NODE_MODULES_DIR)) {
    throw new BuildError('node_modules not found - run npm install');
  }

  logDebug('✅ Prerequisites validated');
}

/**
 * Analyze webpack compilation stats
 * Simplified to extract only essential metrics
 */
function analyzeStats(stats) {
  // Handle multi-compiler stats (client + server)
  const compilations = stats.stats
    ? stats.stats.map(s => s.compilation)
    : [stats.compilation];

  // Collect all assets (exclude source maps)
  const allAssets = [];
  let totalWarnings = 0;
  let totalErrors = 0;

  compilations.forEach(compilation => {
    if (compilation) {
      // Extract assets
      Object.entries(compilation.assets || {}).forEach(([name, asset]) => {
        if (!name.endsWith('.map')) {
          allAssets.push({
            name,
            size: typeof asset.size === 'function' ? asset.size() : 0,
          });
        }
      });

      totalWarnings += (compilation.warnings || []).length;
      totalErrors += (compilation.errors || []).length;
    }
  });

  // Sort by size and calculate totals
  allAssets.sort((a, b) => b.size - a.size);
  const totalSize = allAssets.reduce((sum, asset) => sum + asset.size, 0);

  return {
    totalSize,
    assetCount: allAssets.length,
    warnings: totalWarnings,
    errors: totalErrors,
    oversizedAssets: allAssets.filter(
      asset => asset.size > config.bundleMaxAssetSize,
    ),
    largestAssets: allAssets.slice(0, 5),
  };
}

/**
 * Generate bundle report
 */
function generateBundleReport(analysis, duration) {
  if (!config.bundleAnalyze && !config.buildGenerateReport) {
    return;
  }

  const report = {
    timestamp: new Date().toISOString(),
    duration,
    webpack: {
      version: webpack.version,
      mode: process.env.NODE_ENV || 'development',
    },
    bundle: {
      totalSize: analysis.totalSize,
      assetCount: analysis.assetCount,
    },
    warnings: analysis.warnings,
    errors: analysis.errors,
  };

  if (analysis.oversizedAssets.length > 0) {
    report.performanceWarnings = {
      oversizedAssets: analysis.oversizedAssets.map(a => ({
        name: a.name,
        size: a.size,
        limit: config.bundleMaxAssetSize,
      })),
    };
  }

  // Save report
  if (config.bundleReportPath) {
    try {
      const reportDir = path.dirname(config.bundleReportPath);
      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
      }
      fs.writeFileSync(
        config.bundleReportPath,
        JSON.stringify(report, null, 2),
      );
      logDebug(`📄 Bundle report saved to ${config.bundleReportPath}`);
    } catch (error) {
      logWarn(`Failed to save bundle report: ${error.message}`);
    }
  }
}

/**
 * Log bundle results
 */
function logBundleResults(analysis, duration) {
  const formattedDuration = formatDuration(duration);
  logInfo(`✅ Bundle complete in ${formattedDuration}`);

  const verbose = isVerbose(); // Cache verbose check

  if (verbose) {
    const bundleSummary = [
      `\n📊 Bundle summary:`,
      `   Total size: ${formatBytes(analysis.totalSize)}`,
      `   Assets: ${analysis.assetCount}`,
      `   Duration: ${formattedDuration}`,
    ];

    if (analysis.largestAssets.length > 0) {
      bundleSummary.push(`   Largest assets:`);
      analysis.largestAssets.forEach(asset => {
        bundleSummary.push(`      • ${asset.name}: ${formatBytes(asset.size)}`);
      });
    }

    logVerbose(bundleSummary.join('\n'));
  }

  // Warnings
  if (analysis.oversizedAssets.length > 0) {
    const warningMessage = [
      `⚠️  ${
        analysis.oversizedAssets.length
      } asset(s) exceed size limit (${formatBytes(config.bundleMaxAssetSize)})`,
    ];

    if (verbose) {
      analysis.oversizedAssets.slice(0, 3).forEach(asset => {
        warningMessage.push(
          `      • ${asset.name}: ${formatBytes(asset.size)}`,
        );
      });
    }

    logWarn(warningMessage.join('\n'));
  }

  if (duration > 30000) {
    logWarn(`⚠️  Slow build detected (${formattedDuration})`);
  }
}

/**
 * Create webpack bundle
 * Simplified to focus on core bundling logic
 */
function createBundle() {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    logInfo(`🔨 Compiling webpack bundles...`);

    const compiler = webpack([clientConfig, serverConfig]);

    compiler.run((err, stats) => {
      const duration = Date.now() - startTime;

      // Handle errors
      if (err) {
        compiler.close(() => {
          reject(
            new BuildError(`Webpack compilation failed: ${err.message}`, {
              originalError: err.message,
              stack: err.stack,
            }),
          );
        });
        return;
      }

      if (stats.hasErrors()) {
        const info = stats.toJson('errors-only');
        compiler.close(() => {
          reject(
            new BuildError('Webpack compilation errors', {
              errors: info.errors.map(e => e.message || e),
              stats: stats.toString('errors-only'),
            }),
          );
        });
        return;
      }

      // Analyze and report
      const analysis = analyzeStats(stats);
      logBundleResults(analysis, duration);
      generateBundleReport(analysis, duration);

      // Close and resolve
      compiler.close(closeErr => {
        if (closeErr) {
          logWarn(`Compiler close error: ${closeErr.message}`);
        }
        resolve({ stats, analysis, duration });
      });
    });
  });
}

/**
 * Execute a build step with timing and error handling
 */
async function executeStep(step, index, total, silent) {
  const start = performance.now();

  if (!silent) {
    logInfo(`[${index + 1}/${total}] ${step.description}...`);
  }

  try {
    // Execute the step's task function
    await step.task();

    const duration = performance.now() - start;

    if (isVerbose()) {
      logInfo(`   ${step.name} completed (${formatDuration(duration)})`);
    }
  } catch (error) {
    const duration = performance.now() - start;
    throw new BuildError(`Step '${step.name}' failed: ${error.message}`, {
      step: step.name,
      duration,
      originalError: error,
    });
  }
}

/**
 * Compiles the project from source files into a distributable
 * format and copies it to the output (build) folder.
 */
export default async function main() {
  const startTime = Date.now();
  const silent = isSilent(); // Cache silent check

  if (!silent) {
    logInfo('🏗️  Starting production build...');
  }

  try {
    // Validate prerequisites
    validatePrerequisites();

    // Setup graceful shutdown
    setupGracefulShutdown(() => {
      logInfo(`🛑 Build operation interrupted`);
    });

    // Cache verbose check for use throughout the build
    const verbose = isVerbose();

    // Define build steps with uniform task functions
    const buildSteps = [
      {
        name: 'clean',
        task: clean,
        description: 'Cleaning build directory',
      },
      {
        name: 'messages',
        task: messages,
        description: 'Extracting i18n messages',
      },
      {
        name: 'copy',
        task: () =>
          withBuildRetry(() => copyFiles(), {
            operation: 'copy-files',
            verbose,
          }),
        description: 'Copying static files',
      },
      {
        name: 'bundle',
        task: () =>
          withBuildRetry(() => createBundle(), {
            operation: 'webpack-bundle',
            verbose,
          }),
        description: 'Creating webpack bundles',
      },
    ];

    if (verbose) {
      logInfo(`📋 Build pipeline: ${buildSteps.length} steps`);
    }

    // Execute build steps sequentially
    for (const [index, step] of buildSteps.entries()) {
      // eslint-disable-next-line no-await-in-loop
      await executeStep(step, index, buildSteps.length, silent);
    }

    // Success
    const duration = Date.now() - startTime;
    logInfo(`✅ Build completed in ${formatDuration(duration)}`);

    // Show deployment instructions
    if (!silent) {
      const deploymentInstructions = [
        '',
        '📋 Next steps:',
        '',
        '  1️⃣  Install production dependencies (REQUIRED):',
        `     cd '${config.BUILD_DIR}' && npm install --production`,
        '',
        '  2️⃣  Test locally:',
        `     cd '${config.BUILD_DIR}'`,
        '     export NODE_ENV=production RSK_JWT_SECRET=$(openssl rand -base64 32)',
        '     node server.js',
        '',
        '  3️⃣  Deploy:',
        '     • Docker: See Dockerfile in project root',
        `     • Server: Deploy '${config.BUILD_DIR}' directory with node_modules/`,
        '',
        `⚠️  Important: Run server from '${config.BUILD_DIR}' directory`,
        '   See docs/deployment.md for complete deployment guide',
        '',
      ].join('\n');

      logInfo(deploymentInstructions);
    }

    if (verbose) {
      const buildSummary = [
        '📦 Build Summary:',
        `   📁 Output: '${config.BUILD_DIR}'`,
        `   📊 Steps: ${buildSteps.length}`,
        '   📄 Files:',
        `      • '${config.BUILD_DIR}/server.js' (server bundle)`,
        `      • '${config.BUILD_DIR}/vendors.js' (server vendors)`,
        `      • '${config.BUILD_DIR}/public/assets/' (client assets)`,
        `      • '${config.BUILD_DIR}/package.json' (dependencies list)`,
      ].join('\n');

      logInfo(buildSummary);
    }
  } catch (error) {
    const duration = Date.now() - startTime;

    const buildError =
      error instanceof BuildError
        ? error
        : new BuildError(`Build failed: ${error.message}`, {
            duration,
            originalError: error,
          });

    logDetailedError(buildError, { operation: 'build' });

    if (!silent) {
      const troubleshootingTips = [
        '',
        '💡 Troubleshooting tips:',
        '   1. Try: npm run clean && npm run build',
        '   2. Check for syntax errors in your code',
        '   3. Ensure dependencies are installed: npm install',
        '   4. Run with LOG_LEVEL=verbose for details',
        '   5. See DEPLOYMENT.md for deployment issues',
        '',
      ].join('\n');

      logWarn(troubleshootingTips);
    }

    throw buildError;
  }
}

// Execute if called directly (as child process)
if (require.main === module) {
  main().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
