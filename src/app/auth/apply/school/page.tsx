"use client"

import { useState } from "react"
import Link from "next/link"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import LanguageToggle from "@/components/LanguageToggle"

export default function ApplySchool() {
  const { t } = useLanguage()
  const [form, setForm] = useState({
    schoolName: "",
    schoolEmail: "",
    schoolAddress: "",
    schoolPhone: "",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/apply/school", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const body = await res.json()
      if (!res.ok) {
        setError(body.error || t.signInError)
      } else {
        setSubmitted(true)
      }
    } catch {
      setError(t.signInError)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="flex justify-end">
          <LanguageToggle />
        </div>
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <div className="h-8 w-8 rounded bg-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">{t.applySchoolTitle}</h2>
          <p className="mt-2 text-center text-sm text-gray-600">{t.applySchoolSubtitle}</p>
        </div>

        {submitted ? (
          <div className="rounded-md bg-green-50 p-4">
            <p className="text-sm text-green-800">{t.schoolApplicationSubmitted}</p>
            <Link href="/auth/signin" className="mt-4 inline-block font-medium text-blue-600 hover:text-blue-500 text-sm">
              {t.backToSignIn}
            </Link>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-800">{error}</div>
              </div>
            )}

            <div className="space-y-3">
              <input
                type="text" required placeholder={t.schoolNamePlaceholder}
                value={form.schoolName} onChange={update("schoolName")}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <input
                type="email" required placeholder={t.emailPlaceholder}
                value={form.schoolEmail} onChange={update("schoolEmail")}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <input
                type="text" placeholder={t.schoolAddressPlaceholder}
                value={form.schoolAddress} onChange={update("schoolAddress")}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <input
                type="text" placeholder={t.schoolPhonePlaceholder}
                value={form.schoolPhone} onChange={update("schoolPhone")}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <hr className="border-gray-200" />

            <div className="space-y-3">
              <input
                type="text" required placeholder={t.adminNamePlaceholder}
                value={form.adminName} onChange={update("adminName")}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <input
                type="email" required placeholder={t.emailPlaceholder}
                value={form.adminEmail} onChange={update("adminEmail")}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <input
                type="password" required minLength={8} placeholder={t.passwordPlaceholder}
                value={form.adminPassword} onChange={update("adminPassword")}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <button
              type="submit" disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? t.submittingApplication : t.submitApplication}
            </button>

            <div className="text-sm">
              <Link href="/auth/signin" className="font-medium text-blue-600 hover:text-blue-500">
                {t.backToSignIn}
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
