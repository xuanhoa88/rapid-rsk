/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import {
  LOGIN_START,
  LOGIN_SUCCESS,
  LOGIN_ERROR,
  REGISTER_START,
  REGISTER_SUCCESS,
  REGISTER_ERROR,
  LOGOUT,
  UPDATE_USER,
  FETCH_USER_START,
  FETCH_USER_SUCCESS,
  FETCH_USER_ERROR,
  RESET_PASSWORD_START,
  RESET_PASSWORD_SUCCESS,
  RESET_PASSWORD_ERROR,
} from './constants';

/**
 * Login user
 *
 * Authenticates user with email and password
 *
 * @param {Object} credentials - Login credentials
 * @param {string} credentials.email - User email
 * @param {string} credentials.password - User password
 * @returns {Function} Redux thunk action
 */
export function login({ email, password }) {
  return async (dispatch, getState, { fetch, navigator }) => {
    dispatch({ type: LOGIN_START });

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const data = await response.json();

      // Update user state
      dispatch({
        type: LOGIN_SUCCESS,
        payload: data.user,
      });

      // Redirect to home page
      navigator.navigateTo('/');

      return { success: true, user: data.user };
    } catch (error) {
      dispatch({
        type: LOGIN_ERROR,
        payload: error.message,
      });

      return { success: false, error: error.message };
    }
  };
}

/**
 * Register new user
 *
 * Creates a new user account
 *
 * @param {Object} userData - Registration data
 * @param {string} userData.email - User email
 * @param {string} userData.password - User password
 * @param {string} userData.displayName - User display name (optional)
 * @returns {Function} Redux thunk action
 */
export function register({ email, password, displayName }) {
  return async (dispatch, getState, { fetch, navigator }) => {
    dispatch({ type: REGISTER_START });

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
      }

      const data = await response.json();

      // Update user state
      dispatch({
        type: REGISTER_SUCCESS,
        payload: data.user,
      });

      // Redirect to home page
      navigator.navigateTo('/');

      return { success: true, user: data.user };
    } catch (error) {
      dispatch({
        type: REGISTER_ERROR,
        payload: error.message,
      });

      return { success: false, error: error.message };
    }
  };
}

/**
 * Logout user
 *
 * Clears user state and calls logout API endpoint
 *
 * @returns {Function} Redux thunk action
 */
export function logout() {
  return async (dispatch, getState, { fetch, navigator }) => {
    try {
      // Call logout API to clear server-side session/cookie
      await fetch('/api/auth/logout', {
        method: 'POST',
      });

      // Clear user state
      dispatch({
        type: LOGOUT,
      });

      // Redirect to home page
      navigator.navigateTo('/');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear user state even if API call fails
      dispatch({
        type: LOGOUT,
      });
      navigator.navigateTo('/');
    }
  };
}

/**
 * Get current user
 *
 * Fetches current authenticated user from server
 *
 * @returns {Function} Redux thunk action
 */
export function getCurrentUser() {
  return async (dispatch, getState, { fetch }) => {
    dispatch({ type: FETCH_USER_START });

    try {
      const response = await fetch('/api/auth/me');

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get user');
      }

      const data = await response.json();

      // Update user state
      dispatch({
        type: FETCH_USER_SUCCESS,
        payload: data.user,
      });

      return { success: true, user: data.user };
    } catch (error) {
      dispatch({
        type: FETCH_USER_ERROR,
        payload: error.message,
      });

      return { success: false, error: error.message };
    }
  };
}

/**
 * Reset password
 *
 * Sends password reset email to user
 *
 * @param {Object} data - Reset password data
 * @param {string} data.email - User email
 * @returns {Function} Redux thunk action
 */
export function resetPassword({ email }) {
  return async dispatch => {
    dispatch({ type: RESET_PASSWORD_START });

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send reset email');
      }

      const data = await response.json();

      dispatch({
        type: RESET_PASSWORD_SUCCESS,
      });

      return { success: true, message: data.message };
    } catch (error) {
      dispatch({
        type: RESET_PASSWORD_ERROR,
        payload: error.message,
      });

      return { success: false, error: error.message };
    }
  };
}

/**
 * Update user profile
 *
 * @param {Object} userData - User data to update
 * @returns {Object} Redux action
 */
export function updateUser(userData) {
  return {
    type: UPDATE_USER,
    payload: userData,
  };
}
