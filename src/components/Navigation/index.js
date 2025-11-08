/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */
import cx from 'classnames';
import { useTranslation } from 'react-i18next';
import Link from '../Link';
import s from './Navigation.css';

function Navigation() {
  const { t } = useTranslation();
  return (
    <div className={s.root} role='navigation'>
      <Link className={s.link} to='/about'>
        {t('navigation.about')}
      </Link>
      <Link className={s.link} to='/contact'>
        {t('navigation.contact')}
      </Link>
      <span className={s.spacer}> | </span>
      <Link className={s.link} to='/login'>
        {t('navigation.login')}
      </Link>
      <span className={s.spacer}>{t('navigation.separator.or')}</span>
      <Link className={cx(s.link, s.highlight)} to='/register'>
        {t('navigation.register')}
      </Link>
    </div>
  );
}

export default Navigation;
