# How to Use Internationalization (i18n)

This project uses [react-i18next](https://react.i18next.com/) for internationalization.

## Quick Start

### Using Translations in Components

```javascript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('header.brand')}</h1>
      <p>{t('home.welcome')}</p>
    </div>
  );
}
```

### Available Languages

Currently supported languages:
- **English (US)** - `en-US` (default)
- **Czech** - `cs-CZ`

## Translation Files

Translation files are located in `src/i18n/translations/`:

```
src/i18n/translations/
├── en-US.json
└── cs-CZ.json
```

### Translation File Format

Translations use nested JSON format:

```json
{
  "header": {
    "brand": "Your Company Brand",
    "language": "Language"
  },
  "navigation": {
    "about": "About",
    "contact": "Contact",
    "login": "Log in",
    "signup": "Sign up"
  }
}
```

## Common Use Cases

### 1. Simple Translation

```javascript
const { t } = useTranslation();

// Basic translation
<span>{t('navigation.about')}</span>
```

### 2. Translation with Variables

```javascript
// In translation file
{
  "welcome": "Welcome, {{name}}!"
}

// In component
<span>{t('welcome', { name: 'John' })}</span>
// Output: "Welcome, John!"
```

### 3. Pluralization

```javascript
// In translation file
{
  "items": "{{count}} item",
  "items_plural": "{{count}} items"
}

// In component
<span>{t('items', { count: 1 })}</span>  // "1 item"
<span>{t('items', { count: 5 })}</span>  // "5 items"
```

### 4. Changing Language

```javascript
import i18n from 'src/i18n';

// Change language
i18n.changeLanguage('cs-CZ');

// Get current language
const currentLang = i18n.language;
```

### 5. Language Switching Component

```javascript
import { useTranslation } from 'react-i18next';

function LanguageSwitcher() {
  const { i18n } = useTranslation();
  
  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };
  
  return (
    <div>
      <button onClick={() => changeLanguage('en-US')}>English</button>
      <button onClick={() => changeLanguage('cs-CZ')}>Čeština</button>
    </div>
  );
}
```

## Configuration

The i18n configuration is in `src/i18n/index.js`:

```javascript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translations
import enUS from './translations/en-US.json';
import csCZ from './translations/cs-CZ.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      'en-US': { translation: enUS },
      'cs-CZ': { translation: csCZ },
    },
    lng: 'en-US',              // Default language
    fallbackLng: 'en-US',      // Fallback language
    interpolation: {
      escapeValue: false,      // React already escapes
    },
    react: {
      useSuspense: false,      // Important for SSR
    },
  });

export default i18n;
```

## Testing Components with i18n

### Option 1: Using I18nextProvider

```javascript
import { I18nextProvider } from 'react-i18next';
import i18n from 'src/i18n';

test('renders correctly', () => {
  const wrapper = render(
    <I18nextProvider i18n={i18n}>
      <MyComponent />
    </I18nextProvider>
  );
  
  expect(wrapper).toMatchSnapshot();
});
```

### Option 2: Mocking useTranslation

```javascript
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      changeLanguage: jest.fn(),
      language: 'en-US',
    },
  }),
}));
```

## Adding a New Language

1. **Create translation file**
   ```bash
   cp src/i18n/translations/en-US.json src/i18n/translations/de-DE.json
   ```

2. **Translate the content**
   Edit `de-DE.json` with German translations

3. **Import in configuration**
   ```javascript
   // src/i18n/index.js
   import deDE from './translations/de-DE.json';
   
   i18n.init({
     resources: {
       'en-US': { translation: enUS },
       'cs-CZ': { translation: csCZ },
       'de-DE': { translation: deDE }, // Add new language
     },
   });
   ```

4. **Update language selector**
   Add the new language option to your language switcher component

## Best Practices

### 1. Use Nested Keys

```javascript
// ✅ Good - Organized by feature
{
  "header": {
    "brand": "Brand",
    "title": "Title"
  },
  "footer": {
    "copyright": "Copyright"
  }
}

// ❌ Bad - Flat structure
{
  "headerBrand": "Brand",
  "headerTitle": "Title",
  "footerCopyright": "Copyright"
}
```

### 2. Keep Keys Descriptive

```javascript
// ✅ Good
t('navigation.login')
t('form.submit')

// ❌ Bad
t('nav1')
t('btn2')
```

### 3. Use Interpolation for Dynamic Content

```javascript
// ✅ Good
t('welcome', { name: user.name })

// ❌ Bad
`${t('welcome')} ${user.name}`
```

### 4. Handle Missing Translations

```javascript
// Translation will fall back to fallbackLng if key is missing
t('missing.key') // Falls back to English
```

## Native Intl API

For date, number, and currency formatting, use the native `Intl` API (supported in all modern browsers):

### Date Formatting

```javascript
const date = new Date();
const formatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

formatter.format(date); // "January 1, 2025"
```

### Number Formatting

```javascript
const number = 1234567.89;
const formatter = new Intl.NumberFormat('en-US');

formatter.format(number); // "1,234,567.89"
```

### Currency Formatting

```javascript
const amount = 1234.56;
const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

formatter.format(amount); // "$1,234.56"
```

### Relative Time Formatting

```javascript
const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

rtf.format(-1, 'day');    // "yesterday"
rtf.format(2, 'day');     // "in 2 days"
rtf.format(-3, 'month');  // "3 months ago"
```

## Troubleshooting

### Translations Not Showing

**Problem:** Translation keys showing instead of text

**Solution:**
1. Check translation file exists in `src/i18n/translations/`
2. Verify translation key is correct
3. Ensure `I18nextProvider` wraps your app
4. Check browser console for errors

### Language Not Changing

**Problem:** Language doesn't change when switching

**Solution:**
```javascript
// Make sure to use i18n.changeLanguage()
import i18n from 'src/i18n';
i18n.changeLanguage('cs-CZ');

// Components will automatically re-render
```

### SSR Hydration Mismatch

**Problem:** Server and client render different content

**Solution:**
Ensure `useSuspense: false` in i18n config:
```javascript
i18n.init({
  react: {
    useSuspense: false, // Required for SSR
  },
});
```

## Resources

- [react-i18next Documentation](https://react.i18next.com/)
- [i18next Documentation](https://www.i18next.com/)
- [Intl API Documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)
- [Testing Guide](../testing-your-application.md)
