/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */
import s from './Feedback.css';

function Feedback() {
  return (
    <div className={s.root}>
      <div className={s.container}>
        <a className={s.link} href='https://gitter.im/xuanhoa88/rapid-rsk'>
          Ask a question
        </a>
        <span className={s.spacer}>|</span>
        <a
          className={s.link}
          href='https://github.com/xuanhoa88/rapid-rsk/issues/new'
        >
          Report an issue
        </a>
      </div>
    </div>
  );
}

export default Feedback;
