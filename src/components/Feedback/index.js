/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */
import withStyles from 'isomorphic-style-loader/withStyles';
import s from './Feedback.css';

function Feedback() {
  return (
    <div className={s.root}>
      <div className={s.container}>
        <a
          className={s.link}
          href='https://gitter.im/kriasoft/react-starter-kit'
        >
          Ask a question
        </a>
        <span className={s.spacer}>|</span>
        <a
          className={s.link}
          href='https://github.com/kriasoft/react-starter-kit/issues/new'
        >
          Report an issue
        </a>
      </div>
    </div>
  );
}

export default withStyles(s)(Feedback);
