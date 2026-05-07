import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { translations, type Lang, type TranslationKey } from './i18n'

interface LangCtx {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: TranslationKey) => string
}

const LangContext = createContext<LangCtx>({
  lang: 'en',
  setLang: () => {},
  t: (k) => k,
})

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en')

  const setLang = (l: Lang) => {
    setLangState(l)
    // Set data-lang on <html> for CSS font overrides
    document.documentElement.setAttribute('data-lang', l)
    // Also set lang attribute for semantic correctness
    document.documentElement.lang = l
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-lang', 'en')
  }, [])

  const t = (key: TranslationKey): string =>
    translations[lang][key] ?? translations.en[key] ?? key

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)
