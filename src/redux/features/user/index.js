/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

// Public API - Actions
export {
  login,
  register,
  logout,
  getCurrentUser,
  resetPassword,
  updateUser,
} from './actions';

// Public API - Constants
export {
  LOGIN_START,
  LOGIN_SUCCESS,
  LOGIN_ERROR,
  REGISTER_START,
  REGISTER_SUCCESS,
  REGISTER_ERROR,
  LOGOUT,
  FETCH_USER_START,
  FETCH_USER_SUCCESS,
  FETCH_USER_ERROR,
  RESET_PASSWORD_START,
  RESET_PASSWORD_SUCCESS,
  RESET_PASSWORD_ERROR,
  UPDATE_USER,
} from './constants';

// Public API - Selectors
export {
  getUser,
  isAuthenticated,
  isAdmin,
  getUserId,
  getUserEmail,
  getUserDisplayName,
} from './reducer';

// Public API - Reducer
export { default } from './reducer';
