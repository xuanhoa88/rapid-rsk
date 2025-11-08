/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import sequelize from '../sequelize';
import User from './User';
import UserClaim from './UserClaim';
import UserLogin from './UserLogin';
import UserProfile from './UserProfile';

User.hasMany(UserLogin, {
  foreignKey: 'userId',
  as: 'logins',
  onUpdate: 'cascade',
  onDelete: 'cascade',
});

User.hasMany(UserClaim, {
  foreignKey: 'userId',
  as: 'claims',
  onUpdate: 'cascade',
  onDelete: 'cascade',
});

User.hasOne(UserProfile, {
  foreignKey: 'userId',
  as: 'profile',
  onUpdate: 'cascade',
  onDelete: 'cascade',
});

/**
 * Synchronize all defined models to the database.
 * Creates tables if they don't exist (and does nothing if they already exist).
 *
 * @param {Object} options - Sequelize sync options
 * @param {boolean} options.force - Drop tables before recreating (default: false)
 * @param {boolean} options.alter - Alter tables to fit models (default: false)
 * @param {boolean} options.logging - Enable SQL logging (default: console.log in dev)
 * @returns {Promise} Promise that resolves when sync is complete
 *
 * @example
 * // Basic sync (safe for production)
 * await syncDatabase();
 *
 * @example
 * // Development: alter tables to match models
 * await syncDatabase({ alter: true });
 *
 * @example
 * // Development: drop and recreate all tables (DESTRUCTIVE!)
 * await syncDatabase({ force: true });
 */
export async function syncDatabase(options = {}, isDev = false) {
  // Default options
  const syncOptions = {
    // Enable logging in development, disable in production
    // eslint-disable-line no-console
    logging: isDev ? console.log : false,
    // Never force in production
    force: isDev && options.force === true,
    // Allow alter in development if explicitly requested
    alter: isDev && options.alter === true,
    ...options,
  };

  // Safety check: prevent destructive operations in production
  if (!isDev && (syncOptions.force || syncOptions.alter)) {
    throw new Error(
      'Database sync with force or alter is not allowed in production. ' +
        'Use migrations instead.',
    );
  }

  try {
    // Log sync start
    if (isDev) {
      // eslint-disable-line no-console
      console.info('🔄 Synchronizing database models...');
      if (syncOptions.force) {
        // eslint-disable-line no-console
        console.warn('⚠️  WARNING: force=true will DROP all tables!');
      }
      if (syncOptions.alter) {
        // eslint-disable-line no-console
        console.warn('⚠️  WARNING: alter=true will modify existing tables!');
      }
    }

    // Perform sync
    await sequelize.sync(syncOptions);

    // Log success
    if (isDev) {
      // eslint-disable-line no-console
      console.info('✅ Database models synchronized successfully');
    }

    return true;
  } catch (error) {
    // Enhanced error logging
    // eslint-disable-line no-console
    console.error('❌ Database sync failed:', error.message);

    if (isDev) {
      // eslint-disable-line no-console
      console.error('Stack trace:', error.stack);
      // eslint-disable-line no-console
      console.error('Sync options:', syncOptions);
    }

    // Re-throw to allow caller to handle
    throw error;
  }
}

export { User, UserClaim, UserLogin, UserProfile };
