/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

// Load environment variables from .env file
require('dotenv').config();

import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';
import webpack from 'webpack';
import pkg from '../../package.json';
import config from '../config';
import {
  BuildError,
  logErrorWithContext,
  setupGracefulShutdown,
  withBuildRetry,
} from '../lib/errorHandler';
import { copyDir, copyFile, writeFile } from '../lib/fs';
import {
  formatBytes,
  formatDuration,
  isDebug,
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
 */
function generateBuildPackageJson() {
  const buildPackage = {
    private: true,
    engines: pkg.engines,
    dependencies: pkg.dependencies,
    scripts: {
      start: 'node server.js',
    },
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

  if (isDebug()) {
    logDebug('✅ Prerequisites validated');
  }
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
            size: asset.size?.() || 0,
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
  logInfo(`✅ Bundle complete in ${formatDuration(duration)}`);

  if (isVerbose()) {
    logVerbose(`\n📊 Bundle summary:`);
    logVerbose(`   Total size: ${formatBytes(analysis.totalSize)}`);
    logVerbose(`   Assets: ${analysis.assetCount}`);
    logVerbose(`   Duration: ${formatDuration(duration)}`);

    if (analysis.largestAssets.length > 0) {
      logVerbose(`   Largest assets:`);
      analysis.largestAssets.forEach(asset => {
        logVerbose(`      • ${asset.name}: ${formatBytes(asset.size)}`);
      });
    }
  }

  // Warnings
  if (analysis.oversizedAssets.length > 0) {
    logWarn(
      `⚠️  ${
        analysis.oversizedAssets.length
      } asset(s) exceed size limit (${formatBytes(config.bundleMaxAssetSize)})`,
    );
    if (isVerbose()) {
      analysis.oversizedAssets.slice(0, 3).forEach(asset => {
        logWarn(`      • ${asset.name}: ${formatBytes(asset.size)}`);
      });
    }
  }

  if (duration > 30000) {
    logWarn(`⚠️  Slow build detected (${formatDuration(duration)})`);
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
async function executeStep(step, index, total) {
  const start = performance.now();

  if (!isSilent()) {
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

  if (!isSilent()) {
    logInfo('🏗️  Starting production build...');
  }

  try {
    // Validate prerequisites
    validatePrerequisites();

    // Setup graceful shutdown
    setupGracefulShutdown(() => {
      logInfo(`🛑 Build operation interrupted`);
    });

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
            verbose: isVerbose(),
          }),
        description: 'Copying static files',
      },
      {
        name: 'bundle',
        task: () =>
          withBuildRetry(() => createBundle(), {
            operation: 'webpack-bundle',
            verbose: isVerbose(),
          }),
        description: 'Creating webpack bundles',
      },
    ];

    if (isVerbose()) {
      logInfo(`📋 Build pipeline: ${buildSteps.length} steps`);
    }

    // Execute build steps sequentially
    for (const [index, step] of buildSteps.entries()) {
      // eslint-disable-next-line no-await-in-loop
      await executeStep(step, index, buildSteps.length);
    }

    // Success
    const duration = Date.now() - startTime;
    logInfo(`✅ Build completed in ${formatDuration(duration)}`);

    // Show deployment instructions
    if (!isSilent()) {
      logInfo('');
      logInfo('📋 Next steps:');
      logInfo('');
      logInfo('  1️⃣  Install production dependencies (REQUIRED):');
      logInfo('     npm install --production');
      logInfo('');
      logInfo('  2️⃣  Test locally:');
      logInfo('     NODE_ENV=production node build/server.js');
      logInfo('');
      logInfo('  3️⃣  Deploy:');
      logInfo('     • Docker: See Dockerfile in project root');
      logInfo('     • Server: Deploy build/ + node_modules/');
      logInfo('');
      logInfo('⚠️  Important: Server bundle requires node_modules/ at runtime');
      logInfo('   See docs/deployment.md for complete deployment guide');
      logInfo('');
    }

    if (isVerbose()) {
      logInfo('📦 Build Summary:');
      logInfo('   📁 Output: ./build/');
      logInfo(`   📊 Steps: ${buildSteps.length}`);
      logInfo('   📄 Files:');
      logInfo('      • build/server.js (server bundle)');
      logInfo('      • build/vendors.js (server vendors)');
      logInfo('      • build/public/assets/ (client assets)');
      logInfo('      • build/package.json (dependencies list)');
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

    logErrorWithContext(buildError, { operation: 'build' });

    if (!isSilent()) {
      logWarn('');
      logWarn('💡 Troubleshooting tips:');
      logWarn('   1. Try: npm run clean && npm run build');
      logWarn('   2. Check for syntax errors in your code');
      logWarn('   3. Ensure dependencies are installed: npm install');
      logWarn('   4. Run with LOG_LEVEL=verbose for details');
      logWarn('   5. See DEPLOYMENT.md for deployment issues');
      logWarn('');
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
