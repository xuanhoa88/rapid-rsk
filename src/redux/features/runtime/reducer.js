/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import { SET_RUNTIME_VARIABLE } from './constants';

// Initial state for runtime feature
// Empty object - runtime variables are added dynamically via setRuntimeVariable
const initialState = {};

export default function runtime(state = initialState, action) {
  switch (action.type) {
    case SET_RUNTIME_VARIABLE:
      return {
        ...state,
        ...action.payload,
      };

    default:
      return state;
  }
}
