/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import 'normalize.css';
import PropTypes from 'prop-types';
import Feedback from '../Feedback';
import Footer from '../Footer';
import Header from '../Header';
import s from './Layout.css';

function Layout({ children, showHero = false }) {
  return (
    <div className={s.root}>
      <Header showHero={showHero} />
      <main className={s.content}>{children}</main>
      <Feedback />
      <Footer />
    </div>
  );
}

Layout.propTypes = {
  children: PropTypes.node.isRequired,
  showHero: PropTypes.bool,
};

export default Layout;
