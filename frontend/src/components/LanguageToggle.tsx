"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDownIcon, GlobeAltIcon } from "@heroicons/react/24/outline"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import { localeNames, Locale } from "@/lib/i18n/translations"

const locales: Locale[] = ["en", "sw", "rw"]

export default function LanguageToggle() {
  const { locale, setLocale } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <GlobeAltIcon className="h-4 w-4 text-gray-500" />
        {localeNames[locale]}
        <ChevronDownIcon className={`h-3.5 w-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-40 rounded-lg border border-gray-200 bg-white shadow-lg z-50 overflow-hidden">
          {locales.map((l) => (
            <button
              key={l}
              onClick={() => { setLocale(l); setOpen(false) }}
              className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                locale === l
                  ? "bg-blue-50 text-blue-600 font-medium"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              {localeNames[l]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
