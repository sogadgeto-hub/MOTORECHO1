import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';

import fr from '../locales/fr.json';
import en from '../locales/en.json';
import es from '../locales/es.json';

export type Language = 'fr' | 'en' | 'es';
export type TranslationKeys = typeof fr;

const translations: Record<Language, TranslationKeys> = { fr, en, es: es as unknown as TranslationKeys };

const LANGUAGE_KEY = '@motorecho_language';
const DEFAULT_LANGUAGE: Language = 'fr';

type I18nContextType = {
  language: Language;
  t: TranslationKeys;
  setLanguage: (lang: Language) => Promise<void>;
  availableLanguages: Array<{ code: Language; name: string; flag: string }>;
};

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE);

  useEffect(() => {
    async function loadLanguage() {
      try {
        const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (saved === 'fr' || saved === 'en' || saved === 'es') {
          setLanguageState(saved);
          return;
        }
        // First launch — default to French
        setLanguageState(DEFAULT_LANGUAGE);
        await AsyncStorage.setItem(LANGUAGE_KEY, DEFAULT_LANGUAGE);
      } catch {
        setLanguageState(DEFAULT_LANGUAGE);
      }
    }
    loadLanguage();
  }, []);

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lang);
      // Sync to user profile if authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase
          .from('profiles')
          .update({ language_preference: lang })
          .eq('id', session.user.id);
      }
    } catch {}
  };

  const t = translations[language];

  const availableLanguages: Array<{ code: Language; name: string; flag: string }> = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
  ];

  return (
    <I18nContext.Provider value={{ language, t, setLanguage, availableLanguages }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

export function useTranslation() {
  const { t, language } = useI18n();

  function translate(key: string, params?: Record<string, string | number>): string {
    const keys = key.split('.');
    let value: any = t;
    for (const k of keys) {
      value = value?.[k];
    }
    if (typeof value !== 'string') return key;
    if (params) {
      return Object.entries(params).reduce((str, [k, v]) => {
        return str.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
      }, value);
    }
    return value;
  }

  return { t, language, translate };
}
