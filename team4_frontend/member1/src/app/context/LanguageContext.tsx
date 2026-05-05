import { createContext, useContext, useState, useMemo, useCallback, useEffect, type ReactNode } from 'react';
import { translations, type Language } from '../utils/translations';

interface LangContextValue {
  lang: Language;
  language: Language;       // alias for LanguageToggle compatibility
  setLang: (lang: Language) => void;
  toggleLang: () => void;   // for LanguageToggle
  t: Record<string, string>;
}

const LangContext = createContext<LangContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>('en');

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    // Update <html lang="..."> so :lang(kn) CSS selector works
    document.documentElement.lang = l;
    // Apply Kannada font class to body
    if (l === 'kn') {
      document.body.classList.add('lang-kn');
    } else {
      document.body.classList.remove('lang-kn');
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLangState(prev => {
      const next = prev === 'en' ? 'kn' : 'en';
      document.documentElement.lang = next;
      if (next === 'kn') {
        document.body.classList.add('lang-kn');
      } else {
        document.body.classList.remove('lang-kn');
      }
      return next;
    });
  }, []);

  // Set initial lang on mount
  useEffect(() => {
    document.documentElement.lang = lang;
  }, []);

  const value = useMemo<LangContextValue>(() => ({
    lang,
    language: lang,
    setLang,
    toggleLang,
    t: translations[lang] as Record<string, string>,
  }), [lang, setLang, toggleLang]);

  return (
    <LangContext.Provider value={value}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used within a LanguageProvider');
  return ctx;
}
