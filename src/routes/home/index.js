/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import Layout from '../../components/Layout';
import Home from './Home';

async function action({ fetch }) {
  // Fetch news data from API
  const data = await fetch('/api/news');

  return {
    title: 'React Starter Kit',
    chunks: ['home'],
    component: (
      <Layout>
        <Home data={{ loading: false, ...data }} />
      </Layout>
    ),
  };
}

export default action;
