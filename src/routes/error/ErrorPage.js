/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import PropTypes from 'prop-types';
import s from './ErrorPage.css';

function ErrorPage({ error = null }) {
  if (__DEV__ && error) {
    return (
      <div className={s.root}>
        <div className={s.container}>
          <h1 className={s.title}>{error.name}</h1>
          <pre className={s.details}>{error.stack}</pre>
        </div>
      </div>
    );
  }

  return (
    <div className={s.root}>
      <div className={s.container}>
        <h1 className={s.title}>Error</h1>
        <p>Sorry, a critical error occurred on this page.</p>
      </div>
    </div>
  );
}

ErrorPage.propTypes = {
  error: PropTypes.shape({
    name: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    stack: PropTypes.string.isRequired,
  }),
};

export default ErrorPage;
