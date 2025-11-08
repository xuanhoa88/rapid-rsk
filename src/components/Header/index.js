/**
 * React Starter Kit (https://github.com/xuanhoa88/rapid-rsk/)
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.txt file in the root directory of this source tree.
 */
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../LanguageSwitcher';
import Link from '../Link';
import Navigation from '../Navigation';
import s from './Header.css';
import logoUrl from './logo-small.png';
import logoUrl2x from './logo-small@2x.png';

function Header() {
  const { t } = useTranslation();
  return (
    <div className={s.root}>
      <div className={s.container}>
        <Navigation />
        <Link className={s.brand} to='/'>
          <img
            src={logoUrl}
            srcSet={`${logoUrl2x} 2x`}
            width='38'
            height='38'
            alt='React'
          />
          <span className={s.brandTxt}>{t('header.brand')}</span>
        </Link>
        <LanguageSwitcher />
        <div className={s.banner}>
          <h1 className={s.bannerTitle}>{t('header.banner.title')}</h1>
          <p>{t('header.banner.desc')}</p>
        </div>
      </div>
    </div>
  );
}

export default Header;
