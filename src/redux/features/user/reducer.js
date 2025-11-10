/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import {
  LOGIN_SUCCESS,
  REGISTER_SUCCESS,
  LOGOUT,
  UPDATE_USER,
  FETCH_USER_SUCCESS,
} from './constants';

// Initial state for user feature
// null = not authenticated
// object = authenticated user data from JWT token
const initialState = null;

/**
 * User reducer
 *
 * Manages user authentication state.
 * User state is set during SSR from req.user (JWT token).
 *
 * State shape when authenticated:
 * {
 *   id: string,
 *   email: string,
 *   displayName: string,
 *   role: string,  // 'admin', 'user', etc.
 *   isAdmin: boolean,  // Optional flag
 *   // ... other user properties from JWT
 * }
 *
 * @param {Object|null} state - Current user state (null if not authenticated)
 * @param {Object} action - Redux action
 * @returns {Object|null} New user state
 */
export default function user(state = initialState, action) {
  switch (action.type) {
    case LOGIN_SUCCESS:
    case REGISTER_SUCCESS:
    case FETCH_USER_SUCCESS:
      // Set user data from successful authentication or fetch
      return action.payload;

    case LOGOUT:
      // Clear user state
      return null;

    case UPDATE_USER:
      // Update user properties
      return {
        ...state,
        ...action.payload,
      };

    default:
      return state;
  }
}

// =============================================================================
// SELECTORS
// =============================================================================

/**
 * Get current user
 *
 * @param {Object} state - Redux state
 * @returns {Object|null} User object or null if not authenticated
 */
export const getUser = state => state.user;

/**
 * Check if user is authenticated
 *
 * @param {Object} state - Redux state
 * @returns {boolean} True if user is logged in
 */
export const isAuthenticated = state => !!state.user;

/**
 * Check if user has admin role
 *
 * Checks both user.role === 'admin' and user.isAdmin === true
 * for flexibility with different user object structures.
 *
 * @param {Object} state - Redux state
 * @returns {boolean} True if user is admin
 */
export const isAdmin = state => {
  const { user } = state;
  if (!user) return false;
  return user.role === 'admin' || user.isAdmin === true;
};

/**
 * Get user ID
 *
 * @param {Object} state - Redux state
 * @returns {string|null} User ID or null
 */
export const getUserId = state => (state.user && state.user.id) || null;

/**
 * Get user email
 *
 * @param {Object} state - Redux state
 * @returns {string|null} User email or null
 */
export const getUserEmail = state => (state.user && state.user.email) || null;

/**
 * Get user display name
 *
 * @param {Object} state - Redux state
 * @returns {string|null} User display name or null
 */
export const getUserDisplayName = state =>
  (state.user && state.user.displayName) || null;
