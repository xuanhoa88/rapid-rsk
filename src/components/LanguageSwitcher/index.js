import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setLocale } from '../../redux';
import s from './LanguageSwitcher.css';

/**
 * LanguageSwitcher Component
 * Allows users to switch between available locales
 */
function LanguageSwitcher() {
  // Redux hooks
  const dispatch = useDispatch();
  const currentLocale = useSelector(state => state.intl.locale);

  // Get appLocales from runtime variables
  const appLocales = useSelector(state => state.runtime.appLocales || {});

  /**
   * Handle locale change
   * @param {string} locale - The locale to switch to
   * @param {Event} e - Click event
   */
  const handleLocaleChange = useCallback(
    (locale, e) => {
      e.preventDefault();
      dispatch(setLocale(locale));
    },
    [dispatch],
  );

  /**
   * Check if locale is currently selected
   * @param {string} locale - Locale to check
   * @returns {boolean}
   */
  const isSelected = useCallback(
    locale => locale === currentLocale,
    [currentLocale],
  );

  return (
    <div className={s.root}>
      {Object.entries(appLocales).map(([code, { name }]) => (
        <span key={code}>
          {isSelected(code) ? (
            <span>{name}</span>
          ) : (
            <a
              href={`?lang=${code}`}
              onClick={e => handleLocaleChange(code, e)}
            >
              {name}
            </a>
          )}
        </span>
      ))}
    </div>
  );
}

// PropTypes for development-time type checking
LanguageSwitcher.propTypes = {
  // Note: Props are now obtained via hooks, but we keep PropTypes for documentation
};

export default LanguageSwitcher;
