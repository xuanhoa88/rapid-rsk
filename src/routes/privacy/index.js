/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import Layout from '../../components/Layout';
import Page from '../../components/Page';

async function action() {
  // Load markdown file (only English version exists)
  const data = await import(/* webpackChunkName: "privacy" */ './privacy.md');

  return {
    chunks: ['privacy'],
    title: data.attributes.title,
    component: (
      <Layout>
        <Page title={data.attributes.title} html={data.html} />
      </Layout>
    ),
  };
}

export default action;
