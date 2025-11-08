/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import { Router } from 'express';

const router = Router();

/**
 * GET /news
 * Returns mock news data for the home page
 */
router.get('/', (req, res) => {
  // Mock news data
  const mockNews = {
    payload: [
      {
        id: 1,
        title: 'React 18 Released',
        link: 'https://react.dev/blog/2022/03/29/react-v18',
        contentSnippet:
          'React 18 is now available on npm! In our last post, we shared step-by-step instructions for upgrading your app to React 18.',
      },
      {
        id: 2,
        title: 'Introducing React Server Components',
        link: 'https://react.dev/blog/2023/03/22/react-labs-what-we-have-been-working-on-march-2023',
        contentSnippet:
          'React Server Components allow you to write components that render on the server and stream to the client.',
      },
      {
        id: 3,
        title: 'React Starter Kit',
        link: 'https://github.com/xuanhoa88/rapid-rsk',
        contentSnippet:
          'React Starter Kit — isomorphic web app boilerplate (Node.js, Express, GraphQL, React.js, Babel, PostCSS, Webpack, Browsersync)',
      },
    ],
  };

  res.json(mockNews);
});

export default router;
