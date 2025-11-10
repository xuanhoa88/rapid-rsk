/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */

import Link from '../Link';
import s from './Footer.css';
import { useTranslation } from 'react-i18next';

function Footer() {
  const { t } = useTranslation();
  return (
    <div className={s.root}>
      <div className={s.container}>
        <span className={s.text}>{t('footer.copyright')}</span>
        <span className={s.spacer}>·</span>
        <Link className={s.link} to='/'>
          {t('navigation.home')}
        </Link>
        <span className={s.spacer}>·</span>
        <Link className={s.link} to='/admin'>
          {t('navigation.admin')}
        </Link>
        <span className={s.spacer}>·</span>
        <Link className={s.link} to='/privacy'>
          {t('navigation.privacy')}
        </Link>
        <span className={s.spacer}>·</span>
        <Link className={s.link} to='/not-found'>
          {t('navigation.notFound')}
        </Link>
      </div>
    </div>
  );
}

export default Footer;
