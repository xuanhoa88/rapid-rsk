/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import rootReducer from './rootReducer';

describe('[rootReducer] rootReducer.js', () => {
  it('should return a state', () => {
    const extraErrorPrompt =
      "If this is not a creator any more, plz check configureStore's hot reloader";
    expect(typeof rootReducer).toBe('function', extraErrorPrompt);
    expect(typeof rootReducer({}, {})).toBe('object', extraErrorPrompt);
  });
});
