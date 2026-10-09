import { createContext, useContext, useState, useEffect, useMemo, useCallback, type ReactNode } from 'react';
import { en } from './en';
import { ar } from './ar';
import type { Translations } from './en';

type Lang = 'en' | 'ar';

const PRIMARY_STORAGE_KEY = 'mira.lang';
const LEGACY_STORAGE_KEY = 'invite-studio.lang';
const translations: Record<Lang, Translations> = { en, ar };

interface LanguageContextValue {
  lang: Lang;
  t: Translations;
  setLang: (l: Lang) => void;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const saved = localStorage.getItem(PRIMARY_STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      if (saved === 'en' || saved === 'ar') return saved;
    } catch {}
    return 'ar';
  });

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(PRIMARY_STORAGE_KEY, l);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', '#12363A');
    }
  }, [lang]);

  const value = useMemo(
    () => ({ lang, t: translations[lang], setLang }),
    [lang, setLang]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLang must be used inside LanguageProvider');
  return ctx;
}
