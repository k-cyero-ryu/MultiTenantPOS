import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import i18next from 'i18next';

type Language = 'en' | 'es' | 'fr' | 'pt';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  languageLabels: Record<Language, string>;
}

const defaultLanguageLabels: Record<Language, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  pt: 'Português'
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    // Get the language from localStorage if available, otherwise use browser language or default to 'en'
    const savedLanguage = localStorage.getItem('i18nextLng');
    
    if (savedLanguage && ['en', 'es', 'fr', 'pt'].includes(savedLanguage)) {
      return savedLanguage as Language;
    }
    
    const browserLang = navigator.language.split('-')[0];
    if (['en', 'es', 'fr', 'pt'].includes(browserLang)) {
      return browserLang as Language;
    }
    
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    i18next.changeLanguage(lang);
    setLanguageState(lang);
    localStorage.setItem('i18nextLng', lang);
  };

  useEffect(() => {
    // Ensure i18n language matches state language on component mount
    if (i18next.language !== language) {
      i18next.changeLanguage(language);
    }
  }, [language]);

  const value: LanguageContextType = {
    language,
    setLanguage,
    languageLabels: defaultLanguageLabels
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}