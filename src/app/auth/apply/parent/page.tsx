"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useLanguage } from "@/lib/i18n/LanguageContext"
import LanguageToggle from "@/components/LanguageToggle"

interface SchoolOption {
  _id: string
  name: string
}

interface StudentOption {
  _id: string
  firstName: string
  lastName: string
  classId?: { name?: string; grade?: string } | null
}

export default function ApplyParent() {
  const { t } = useLanguage()
  const [schools, setSchools] = useState<SchoolOption[]>([])
  const [form, setForm] = useState({
    schoolId: "",
    parentName: "",
    parentEmail: "",
    parentPassword: "",
    parentPhone: "",
  })
  const [students, setStudents] = useState<StudentOption[]>([])
  const [studentsLoading, setStudentsLoading] = useState(false)
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [submitted, setSubmitted] = useState(false)

  // Toast — pops up when a selected school turns out to have no unlinked students
  const [toast, setToast] = useState<string | null>(null)
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = (message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast(message)
    toastTimerRef.current = setTimeout(() => setToast(null), 5000)
  }

  useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current) }, [])

  useEffect(() => {
    fetch("/api/schools/public")
      .then((res) => res.json())
      .then((data: SchoolOption[]) => setSchools(data))
      .catch(() => setSchools([]))
  }, [])

  useEffect(() => {
    setSelectedStudentIds([])
    setToast(null)
    if (!form.schoolId) {
      setStudents([])
      return
    }
    setStudentsLoading(true)
    fetch(`/api/students/public?schoolId=${form.schoolId}`)
      .then((res) => res.json())
      .then((data: StudentOption[]) => {
        const list = Array.isArray(data) ? data : []
        setStudents(list)
        if (list.length === 0) showToast(t.noStudentsAvailable)
      })
      .catch(() => setStudents([]))
      .finally(() => setStudentsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.schoolId])

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const toggleStudent = (id: string) =>
    setSelectedStudentIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/apply/parent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, studentIds: selectedStudentIds }),
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
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">{t.applyParentTitle}</h2>
          <p className="mt-2 text-center text-sm text-gray-600">{t.applyParentSubtitle}</p>
        </div>

        {submitted ? (
          <div className="rounded-md bg-green-50 p-4">
            <p className="text-sm text-green-800">{t.parentApplicationSubmitted}</p>
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
              <select
                required value={form.schoolId} onChange={update("schoolId")}
                className="block w-full px-3 py-2 border border-gray-300 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">{t.selectSchoolPlaceholder}</option>
                {schools.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
              <input
                type="text" required placeholder={t.parentNamePlaceholder}
                value={form.parentName} onChange={update("parentName")}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <input
                type="email" required placeholder={t.emailPlaceholder}
                value={form.parentEmail} onChange={update("parentEmail")}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <input
                type="tel" required placeholder={t.parentPhonePlaceholder}
                value={form.parentPhone} onChange={update("parentPhone")}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <input
                type="password" required minLength={8} placeholder={t.passwordPlaceholder}
                value={form.parentPassword} onChange={update("parentPassword")}
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <hr className="border-gray-200" />

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">{t.selectChildrenLabel}</p>

              {!form.schoolId ? (
                <p className="text-sm text-gray-400">{t.selectSchoolFirstHint}</p>
              ) : studentsLoading ? (
                <p className="text-sm text-gray-400">{t.loadingStudents}</p>
              ) : students.length === 0 ? (
                <p className="text-sm text-gray-400">{t.noStudentsAvailable}</p>
              ) : (
                <div className="max-h-56 overflow-y-auto border border-gray-200 rounded-md divide-y divide-gray-100">
                  {students.map((s) => {
                    const checked = selectedStudentIds.includes(s._id)
                    const classLabel = s.classId?.name ? ` · ${s.classId.name}` : ""
                    return (
                      <label
                        key={s._id}
                        className={`flex items-center gap-3 px-3 py-2 text-sm cursor-pointer ${checked ? "bg-blue-50" : "hover:bg-gray-50"}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleStudent(s._id)}
                          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-gray-900">{s.firstName} {s.lastName}{classLabel}</span>
                      </label>
                    )
                  })}
                </div>
              )}
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

      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm rounded-lg bg-gray-900 text-white text-sm px-4 py-3 shadow-lg flex items-start gap-3"
        >
          <span className="flex-1">{toast}</span>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="flex-shrink-0 text-gray-300 hover:text-white"
            aria-label={t.close}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
