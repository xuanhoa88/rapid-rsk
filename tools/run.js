/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import { spawn } from 'child_process';
import path from 'path';
import config from './config';
import { BuildError } from './lib/errorHandler';
import {
  formatDuration,
  isSilent,
  isVerbose,
  logDebug,
  logError,
  logInfo,
} from './lib/logger';

/**
 * Simple task runner - executes a task function and handles errors
 */
export default function main(fn, options) {
  const task = typeof fn.default === 'undefined' ? fn : fn.default;
  const taskName = task.name || 'anonymous';
  const startTime = Date.now();

  // Log task start
  if (!isSilent()) {
    logInfo(`🏁 Starting '${taskName}'...`);
  }

  logDebug(`Executing task: ${taskName}`);
  if (options) {
    logDebug(`Options: ${JSON.stringify(options)}`);
  }

  return Promise.resolve()
    .then(() => task(options))
    .then(result => {
      const duration = Date.now() - startTime;

      // Log completion
      if (!isSilent()) {
        const emoji = duration > 10000 ? '🐌' : duration > 5000 ? '⚠️' : '✅';
        logInfo(
          `${emoji} Finished '${taskName}' after ${formatDuration(duration)}`,
        );
      }

      return result;
    })
    .catch(error => {
      const duration = Date.now() - startTime;

      // Wrap error if needed
      const taskError =
        error instanceof BuildError
          ? error
          : new BuildError(`Task '${taskName}' failed: ${error.message}`, {
              task: taskName,
              duration: formatDuration(duration),
              originalError: error.message,
              stack: error.stack,
            });

      // Log failure
      if (!isSilent()) {
        logError(`❌ Failed '${taskName}' after ${formatDuration(duration)}`);
        logError(taskError.message);

        if (isVerbose() && taskError.stack) {
          logError('\nStack trace:');
          logError(taskError.stack);
        }
      }

      throw taskError;
    });
}

// Available tasks configuration
const AVAILABLE_TASKS = [
  {
    name: 'build',
    description: 'Build the project for production',
  },
  {
    name: 'clean',
    description: 'Clean build directory',
  },
  {
    name: 'start',
    description: 'Start the project for development',
  },
  {
    name: 'i18n',
    description: 'Extract i18n messages',
  },
  {
    name: 'prettier',
    description: 'Format code with Prettier',
  },
  {
    name: 'stylelint',
    description: 'Lint CSS files with Stylelint',
  },
];

/**
 * Show help message with available tasks
 */
function showHelp() {
  logInfo('\n📋 Available tasks:\n');
  AVAILABLE_TASKS.forEach(({ name, description }) => {
    logInfo(`   ${name.padEnd(12)} ${description}`);
  });
  logInfo('\n💡 Usage: babel-node tools/run <task> [options]');
  logInfo('   Options:');
  logInfo('     --verbose     Show detailed output');
  logInfo('     --silent      Suppress all output');
  logInfo('');
}

/**
 * Execute a task in a child process
 * Each task runs in isolation with its own NODE_ENV
 */
function executeTask(taskName) {
  return new Promise((resolve, reject) => {
    const toolsDir = path.resolve(__dirname, 'tasks');
    const taskPath = path.join(toolsDir, `${taskName}.js`);

    logDebug(`Spawning task: ${taskName}`);

    // Spawn task in child process using babel-node
    const child = spawn('babel-node', [taskPath], {
      stdio: 'inherit', // Inherit stdin, stdout, stderr
      env: { ...process.env }, // Pass environment with correct NODE_ENV
      cwd: config.ROOT_DIR,
    });

    // Handle child process exit
    child.on('exit', (code, signal) => {
      if (signal) {
        reject(new Error(`Task '${taskName}' killed by signal ${signal}`));
      } else if (code !== 0) {
        reject(new Error(`Task '${taskName}' exited with code ${code}`));
      } else {
        resolve();
      }
    });

    // Handle child process errors
    child.on('error', error => {
      reject(new Error(`Failed to spawn task '${taskName}': ${error.message}`));
    });
  });
}

// CLI handling
if (require.main === module) {
  const taskName = process.argv[2];

  // No task provided
  if (!taskName) {
    logError('\n🚫 Error: No task specified');
    showHelp();
    process.exit(1);
  }

  // Handle help command
  if (taskName === 'help' || taskName === '--help' || taskName === '-h') {
    showHelp();
    process.exit(0);
  }

  // Execute task in child process
  executeTask(taskName).catch(error => {
    // Task file not found or spawn failed
    if (error.message.includes('Failed to spawn')) {
      logError(`\n🚫 Task '${taskName}' not found`);
      const taskList = AVAILABLE_TASKS.map(t => t.name).join(', ');
      logError(`\n📋 Available tasks: ${taskList}`);
      logInfo('\n💡 Run "babel-node tools/run help" for more information');
    } else {
      // Task execution failed
      logError(`\n🚫 ${error.message}`);
      if (isVerbose() && error.stack) {
        logError('\nStack trace:');
        logError(error.stack);
      }
    }
    process.exit(1);
  });
}
