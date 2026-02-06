// i18n/index.js - Main i18n configuration and export
import en from './en.json' assert { type: 'json' };
import am from './am.json' assert { type: 'json' };
import or from './or.json' assert { type: 'json' };
import ti from './ti.json' assert { type: 'json' };

// Language metadata
export const languages = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    direction: 'ltr',
    flag: '🇺🇸',
    locale: 'en-US'
  },
  am: {
    code: 'am',
    name: 'Amharic',
    nativeName: 'አማርኛ',
    direction: 'ltr',
    flag: '🇪🇹',
    locale: 'am-ET'
  },
  or: {
    code: 'or',
    name: 'Oromo',
    nativeName: 'Afaan Oromoo',
    direction: 'ltr',
    flag: '🇪🇹',
    locale: 'om-ET'
  },
  ti: {
    code: 'ti',
    name: 'Tigrinya',
    nativeName: 'ትግርኛ',
    direction: 'ltr',
    flag: '🇪🇷',
    locale: 'ti-ER'
  }
};

// Export all translations
export const translations = { en, am, or, ti };

// Default language
export const defaultLanguage = 'en';

// Language detection order
export const languageDetectionOrder = [
  'url',    // Check URL parameter
  'cookie', // Check language cookie
  'localStorage', // Check localStorage
  'navigator', // Browser language
  'default' // Fallback to default
];

// RTL languages (for direction support)
export const rtlLanguages = [];
// Note: Amharic, Oromo, and Tigrinya are LTR despite being Ge'ez script

// Export for specific import
export { en, am, or, ti };

export default translations;
