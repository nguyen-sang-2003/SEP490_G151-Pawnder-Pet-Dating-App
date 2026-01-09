import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import vi from './vi.json';

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3', // Fix for React Native
    resources: {
      vi: { translation: vi }
    },
    lng: 'vi',
    fallbackLng: 'vi',
    interpolation: {
      escapeValue: false // React already escapes
    },
    // Return key if translation not found
    returnNull: false,
    returnEmptyString: false,
    react: {
      useSuspense: false, // Disable suspense to avoid warning
    },
  });

export default i18n;
