/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import UniversalRouter from 'universal-router';
import routes from './routes';

export default new UniversalRouter(routes, {
  resolveRoute(context, params) {
    if (typeof context.route.load === 'function') {
      return context.route
        .load()
        .then(action => {
          if (!action || typeof action.default !== 'function') {
            console.error('Route load failed:', context.route.path, action);
            return undefined;
          }
          return action.default(context, params);
        })
        .catch(error => {
          console.error('Route load error:', context.route.path, error);
          return undefined;
        });
    }
    if (typeof context.route.action === 'function') {
      return context.route.action(context, params);
    }
    return undefined;
  },
});
