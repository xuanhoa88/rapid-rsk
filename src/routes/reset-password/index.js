/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import Layout from '../../components/Layout';
import ResetPassword from './ResetPassword';

function action({ fetch }) {
  const title = 'Reset Password';
  return {
    chunks: ['reset-password'],
    title,
    component: (
      <Layout>
        <ResetPassword title={title} fetch={fetch} />
      </Layout>
    ),
  };
}

export default action;
