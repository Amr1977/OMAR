import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ar from './ar.json';
import en from './en.json';
import ur from './ur.json';
import fr from './fr.json';

const savedLang = localStorage.getItem('language') || 'ar';

i18n.use(initReactI18next).init({
  resources: {
    ar: { translation: ar },
    en: { translation: en },
    ur: { translation: ur },
    fr: { translation: fr },
  },
  lng: savedLang,
  fallbackLng: 'ar',
  interpolation: {
    escapeValue: false,
  },
});

export const changeLanguage = (lang: string) => {
  i18n.changeLanguage(lang);
  localStorage.setItem('language', lang);
  document.documentElement.dir = lang === 'ar' || lang === 'ur' ? 'rtl' : 'ltr';
  document.documentElement.lang = lang;
};

// Set initial direction
document.documentElement.dir = savedLang === 'ar' || savedLang === 'ur' ? 'rtl' : 'ltr';
document.documentElement.lang = savedLang;

export default i18n;
