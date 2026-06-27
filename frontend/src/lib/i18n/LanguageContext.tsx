"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import translations, { Locale, TranslationKeys } from "./translations"

interface LanguageContextType {
  locale: Locale
  setLocale: (l: Locale) => void
  t: TranslationKeys
}

const LanguageContext = createContext<LanguageContextType>({
  locale: "en",
  setLocale: () => {},
  t: translations.en,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en")

  useEffect(() => {
    const saved = localStorage.getItem("tsms-locale") as Locale | null
    if (saved && translations[saved]) setLocaleState(saved)
  }, [])

  const setLocale = (l: Locale) => {
    setLocaleState(l)
    localStorage.setItem("tsms-locale", l)
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t: translations[locale] }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}
