/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import Layout from '../../components/Layout';
import ErrorPage from './ErrorPage';

/**
 * Error route
 */
function action() {
  const title = 'Error';

  return {
    chunks: ['error'],
    title,
    component: (
      <Layout>
        <ErrorPage />
      </Layout>
    ),
  };
}

export default action;
