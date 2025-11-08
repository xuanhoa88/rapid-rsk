/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import withStyles from 'isomorphic-style-loader/withStyles';
import normalizeCss from 'normalize.css';
import Feedback from '../Feedback';
import Footer from '../Footer';
import Header from '../Header';
import s from './Layout.css';

// eslint-disable-next-line react/prop-types
function Layout({ children }) {
  return (
    <div>
      <Header />
      {children}
      <Feedback />
      <Footer />
    </div>
  );
}

export default withStyles(normalizeCss, s)(Layout);
