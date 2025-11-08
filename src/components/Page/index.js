/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import PropTypes from 'prop-types';
import s from './Page.css';

function Page({ title, html }) {
  return (
    <div className={s.root}>
      <div className={s.container}>
        <h1>{title}</h1>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}

Page.propTypes = {
  title: PropTypes.string.isRequired,
  html: PropTypes.string.isRequired,
};

export default Page;
