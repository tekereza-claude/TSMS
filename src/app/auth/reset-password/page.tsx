"use client"

import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import LanguageToggle from "@/components/LanguageToggle"

function ResetPasswordForm() {
  const { t } = useLanguage()
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""
  const email = searchParams.get("email") ?? ""

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError(t.passwordsDoNotMatch)
      return
    }

    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password }),
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
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">{t.resetPasswordTitle}</h2>
          <p className="mt-2 text-center text-sm text-gray-600">{t.resetPasswordSubtitle}</p>
        </div>

        {submitted ? (
          <div className="rounded-md bg-green-50 p-4">
            <p className="text-sm text-green-800">{t.passwordResetSuccessMessage}</p>
            <Link href="/auth/signin" className="mt-4 inline-block font-medium text-blue-600 hover:text-blue-500 text-sm">
              {t.backToSignIn}
            </Link>
          </div>
        ) : !token || !email ? (
          <div className="rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{t.invalidResetLink}</p>
            <Link href="/auth/forgot-password" className="mt-4 inline-block font-medium text-blue-600 hover:text-blue-500 text-sm">
              {t.forgotPasswordTitle}
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
                type="password" required minLength={8} placeholder={t.newPasswordPlaceholder}
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <input
                type="password" required minLength={8} placeholder={t.confirmPasswordPlaceholder}
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <button
              type="submit" disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? t.submittingApplication : t.resetPasswordSubmit}
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

export default function ResetPassword() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  )
}
