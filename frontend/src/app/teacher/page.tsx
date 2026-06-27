"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useRef, useCallback } from "react"
import {
  AcademicCapIcon,
  UserGroupIcon,
  BookOpenIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentArrowDownIcon,
  EyeIcon,
  ShieldExclamationIcon,
} from "@heroicons/react/24/outline"
import LanguageToggle from "@/components/LanguageToggle"

// ─── Types ───────────────────────────────────────────────────────────────────

interface Student {
  id: string
  firstName: string
  lastName: string
  email: string
  className?: string
}

interface Subject {
  id: string
  name: string
  code: string
}

interface Mark {
  studentId: string
  studentName: string
  subject: string
  test: number
  exam: number
  score: number
  maxScore: number
  term: string
  year: string
}

// Raw shapes as returned by the API (Mongoose lean docs with `_id` + populated relations)
interface RawStudent {
  _id: string
  firstName: string
  lastName: string
  email?: string
  classId?: { name?: string } | string | null
}

interface RawSubject {
  _id: string
  name: string
  code: string
}

interface RawMark {
  _id: string
  studentId: { _id: string; firstName: string; lastName: string } | string
  subjectId: { _id: string; name: string; code: string } | string
  test?: number
  exam?: number
  score: number
  maxScore: number
  term: string
  year: string | number
}

// Test and exam are each marked out of 50 (total 100).
const TEST_MAX = 50
const EXAM_MAX = 50

interface UploadError {
  row: number
  field: string
  message: string
}

// Discipline records (merit/demerit) recorded by the teacher
interface RawDisciplineRec {
  _id: string
  studentId: { firstName?: string; lastName?: string } | string
  date: string
  type: "Merit" | "Demerit"
  category: string
  points: number
  note?: string
  actionTaken?: string
}

interface DisciplineItem {
  id: string
  studentName: string
  date: string
  type: "Merit" | "Demerit"
  category: string
  points: number
  note: string
  actionTaken: string
}

interface ParsedRow {
  studentName: string
  subject: string
  test: number
  exam: number
  term: string
  year: string
  valid: boolean
  errors: string[]
}

// ─── API helpers & normalizers ─────────────────────────────────────────────

async function fetchJson(url: string) {
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed (${res.status})`)
  }
  return res.json()
}

// Mongoose docs arrive with `_id` and populated relations; flatten them into
// the flat shapes the UI renders.
function normalizeStudent(s: RawStudent): Student {
  const cls = typeof s.classId === "object" && s.classId !== null ? s.classId.name : undefined
  return {
    id: String(s._id),
    firstName: s.firstName,
    lastName: s.lastName,
    email: s.email ?? "",
    className: cls,
  }
}

function normalizeSubject(s: RawSubject): Subject {
  return { id: String(s._id), name: s.name, code: s.code }
}

function normalizeDiscipline(d: RawDisciplineRec): DisciplineItem {
  const s = typeof d.studentId === "object" && d.studentId !== null ? d.studentId : null
  return {
    id: String(d._id),
    studentName: s ? `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim() : "—",
    date: typeof d.date === "string" ? d.date.slice(0, 10) : String(d.date),
    type: d.type,
    category: d.category,
    points: d.points,
    note: d.note ?? "",
    actionTaken: d.actionTaken ?? "",
  }
}

function normalizeMark(m: RawMark): Mark {
  const student = m.studentId
  const subject = m.subjectId
  const studentObj = typeof student === "object" && student !== null ? student : null
  const subjectObj = typeof subject === "object" && subject !== null ? subject : null
  return {
    studentId: studentObj ? String(studentObj._id) : String(student),
    studentName: studentObj ? `${studentObj.firstName} ${studentObj.lastName}` : "Unknown",
    subject: subjectObj ? subjectObj.name : "",
    test: m.test ?? 0,
    exam: m.exam ?? 0,
    score: m.score,
    maxScore: m.maxScore,
    term: m.term,
    year: String(m.year),
  }
}

// ─── Excel Validation Logic ───────────────────────────────────────────────────

const VALID_TERMS = ["Term 1", "Term 2", "Term 3"]

function validateAndParseCSV(
  text: string,
  validStudentNames: string[],
  validSubjects: string[],
): { rows: ParsedRow[]; globalErrors: string[] } {
  const globalErrors: string[] = []
  const lines = text.trim().split("\n").map((l) => l.trim()).filter(Boolean)

  if (lines.length < 2) {
    globalErrors.push("File is empty or missing data rows.")
    return { rows: [], globalErrors }
  }

  // Validate headers
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase())
  const required = ["student name", "subject", "test", "exam", "term", "year"]
  const missing = required.filter((r) => !headers.includes(r))
  if (missing.length > 0) {
    globalErrors.push(`Missing required columns: ${missing.join(", ")}`)
    return { rows: [], globalErrors }
  }

  const idx = (col: string) => headers.indexOf(col)

  const rows: ParsedRow[] = []
  const seen = new Set<string>()

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim())
    const errors: string[] = []

    const studentName = cols[idx("student name")] || ""
    const subject = cols[idx("subject")] || ""
    const testRaw = cols[idx("test")] || ""
    const examRaw = cols[idx("exam")] || ""
    const term = cols[idx("term")] || ""
    const year = cols[idx("year")] || ""

    // Student must exist in class
    if (!studentName) {
      errors.push("Student name is required")
    } else if (!validStudentNames.includes(studentName)) {
      errors.push(`"${studentName}" is not enrolled in this class`)
    }

    // Subject must be valid
    if (!subject) {
      errors.push("Subject is required")
    } else if (!validSubjects.includes(subject)) {
      errors.push(`"${subject}" is not a recognised subject`)
    }

    // Test must be a number within 0–TEST_MAX
    const test = parseFloat(testRaw)
    if (testRaw === "" || isNaN(test)) {
      errors.push("Test must be a number")
    } else if (test < 0 || test > TEST_MAX) {
      errors.push(`Test must be between 0 and ${TEST_MAX}`)
    }

    // Exam must be a number within 0–EXAM_MAX
    const exam = parseFloat(examRaw)
    if (examRaw === "" || isNaN(exam)) {
      errors.push("Exam must be a number")
    } else if (exam < 0 || exam > EXAM_MAX) {
      errors.push(`Exam must be between 0 and ${EXAM_MAX}`)
    }

    // Term must be valid
    if (!term) {
      errors.push("Term is required")
    } else if (!VALID_TERMS.includes(term)) {
      errors.push(`Term must be one of: ${VALID_TERMS.join(", ")}`)
    }

    // Year must be a 4-digit year
    if (!year || !/^\d{4}$/.test(year)) {
      errors.push("Year must be a 4-digit number (e.g. 2025)")
    }

    // Duplicate check: same student + subject + term + year
    const key = `${studentName}|${subject}|${term}|${year}`
    if (seen.has(key)) {
      errors.push(`Duplicate entry for ${studentName} - ${subject} (${term} ${year})`)
    } else {
      seen.add(key)
    }

    rows.push({
      studentName,
      subject,
      test: isNaN(test) ? 0 : test,
      exam: isNaN(exam) ? 0 : exam,
      term,
      year,
      valid: errors.length === 0,
      errors,
    })
  }

  return { rows, globalErrors }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TeacherDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeSection, setActiveSection] = useState("overview")
  const [search, setSearch] = useState("")
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [showStudentModal, setShowStudentModal] = useState(false)

  // Upload state
  const [uploadStep, setUploadStep] = useState<"idle" | "preview" | "success">("idle")
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
  const [globalErrors, setGlobalErrors] = useState<string[]>([])
  const [fileName, setFileName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [savedCount, setSavedCount] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Data loaded from the API
  const [students, setStudents] = useState<Student[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [marks, setMarks] = useState<Mark[]>([])
  const [discRecords, setDiscRecords] = useState<DisciplineItem[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Discipline entry form
  const [discForm, setDiscForm] = useState({ studentId: "", type: "Merit", category: "", points: "3", note: "", date: "", actionTaken: "" })
  const [discSubmitting, setDiscSubmitting] = useState(false)
  const [discError, setDiscError] = useState<string | null>(null)
  const [discSaved, setDiscSaved] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    if (!session) { router.push("/auth/signin"); return }
    if (session.user.role !== "TEACHER") { router.push("/"); return }
  }, [session, status, router])

  const loadData = useCallback(async () => {
    setDataLoading(true)
    setLoadError(null)
    try {
      const [st, su, mk, dr] = await Promise.all([
        fetchJson("/api/students"),
        fetchJson("/api/subjects"),
        fetchJson("/api/marks"),
        fetchJson("/api/discipline"),
      ])
      setStudents((st as RawStudent[]).map(normalizeStudent))
      setSubjects((su as RawSubject[]).map(normalizeSubject))
      setMarks((mk as RawMark[]).map(normalizeMark))
      setDiscRecords((dr as RawDisciplineRec[]).map(normalizeDiscipline))
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load data")
    } finally {
      setDataLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === "authenticated" && session?.user.role === "TEACHER") loadData()
  }, [status, session?.user.role, loadData])

  const menuItems = [
    { id: "overview", label: "Overview", icon: ChartBarIcon },
    { id: "students", label: "My Students", icon: UserGroupIcon },
    { id: "marks", label: "Marks", icon: BookOpenIcon },
    { id: "upload", label: "Upload Marks", icon: ArrowUpTrayIcon },
    { id: "discipline", label: "Discipline", icon: ShieldExclamationIcon },
  ]

  const submitDiscipline = async (e: React.FormEvent) => {
    e.preventDefault()
    const points = parseFloat(discForm.points)
    if (!discForm.studentId) { setDiscError("Please select a student"); return }
    if (!discForm.category.trim()) { setDiscError("Category is required"); return }
    if (isNaN(points) || points <= 0) { setDiscError("Points must be a positive number"); return }
    setDiscSubmitting(true)
    setDiscError(null)
    setDiscSaved(false)
    try {
      const res = await fetch("/api/discipline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: discForm.studentId,
          type: discForm.type,
          category: discForm.category.trim(),
          points,
          note: discForm.note.trim() || undefined,
          date: discForm.date || undefined,
          actionTaken: discForm.actionTaken.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Failed to save record")
      }
      const created = await res.json()
      setDiscRecords((prev) => [normalizeDiscipline(created), ...prev])
      setDiscForm({ studentId: "", type: "Merit", category: "", points: "3", note: "", date: "", actionTaken: "" })
      setDiscSaved(true)
    } catch (err) {
      setDiscError(err instanceof Error ? err.message : "Failed to save record")
    } finally {
      setDiscSubmitting(false)
    }
  }

  // A teacher's account is scoped to a school, not a single class, so derive a
  // sensible label from the students actually returned.
  const classNames = [...new Set(students.map((s) => s.className).filter((c): c is string => Boolean(c)))]
  const classLabel = classNames.length === 1 ? classNames[0] : classNames.length > 1 ? "All Classes" : "My Class"

  const exampleStudent = students[0] ? `${students[0].firstName} ${students[0].lastName}` : "Student Name"
  const exampleSubject = subjects[0]?.name ?? "Subject"
  const templateHref = `data:text/csv;charset=utf-8,${encodeURIComponent(
    `Student Name,Subject,Test,Exam,Term,Year\n${exampleStudent},${exampleSubject},35,48,Term 1,2025`,
  )}`

  const filteredStudents = students.filter((s) => {
    const q = search.toLowerCase()
    return `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
  })

  const filteredMarks = marks.filter((m) => {
    const q = search.toLowerCase()
    return m.studentName.toLowerCase().includes(q) || m.subject.toLowerCase().includes(q)
  })

  // Grade helper
  const grade = (score: number, max: number) => {
    const pct = (score / max) * 100
    if (pct >= 90) return { label: "A+", color: "text-green-700 bg-green-100" }
    if (pct >= 80) return { label: "A", color: "text-green-600 bg-green-50" }
    if (pct >= 70) return { label: "B", color: "text-blue-600 bg-blue-100" }
    if (pct >= 60) return { label: "C", color: "text-yellow-600 bg-yellow-100" }
    if (pct >= 50) return { label: "D", color: "text-orange-600 bg-orange-100" }
    return { label: "F", color: "text-red-600 bg-red-100" }
  }

  // File handler — reads CSV/Excel-exported-as-CSV
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Accept .csv or .xlsx (we parse as text; xlsx support note shown to user)
    if (!file.name.endsWith(".csv") && !file.name.endsWith(".xlsx")) {
      setGlobalErrors(["Only .csv or .xlsx files are accepted."])
      setUploadStep("preview")
      setParsedRows([])
      return
    }

    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const validStudentNames = students.map((s) => `${s.firstName} ${s.lastName}`)
      const validSubjectNames = subjects.map((s) => s.name)
      const { rows, globalErrors: gErr } = validateAndParseCSV(text, validStudentNames, validSubjectNames)
      setGlobalErrors(gErr)
      setParsedRows(rows)
      setUploadStep("preview")
    }
    reader.readAsText(file)
  }

  const validRows = parsedRows.filter((r) => r.valid)
  const invalidRows = parsedRows.filter((r) => !r.valid)

  const handleSubmit = async () => {
    if (validRows.length === 0) return
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const studentIdByName = new Map(students.map((s) => [`${s.firstName} ${s.lastName}`, s.id]))
      const subjectIdByName = new Map(subjects.map((s) => [s.name, s.id]))
      const records = validRows.map((r) => ({
        studentId: studentIdByName.get(r.studentName)!,
        subjectId: subjectIdByName.get(r.subject)!,
        test: r.test,
        exam: r.exam,
        term: r.term,
        year: r.year,
      }))
      const res = await fetch("/api/marks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Failed to save marks")
      }
      const result = await res.json()
      setSavedCount(typeof result.saved === "number" ? result.saved : validRows.length)
      // Refresh the marks table with what's now persisted
      const mk = await fetchJson("/api/marks")
      setMarks((mk as RawMark[]).map(normalizeMark))
      setUploadStep("success")
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Failed to save marks")
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetUpload = () => {
    setUploadStep("idle")
    setParsedRows([])
    setGlobalErrors([])
    setFileName("")
    setSubmitError(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <AcademicCapIcon className="h-5 w-5 text-white" />
              </div>
              <div className="ml-4">
                <h1 className="text-xl font-semibold text-gray-900">Teacher Portal</h1>
                <p className="text-sm text-gray-500">{classLabel} — Class Teacher</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <LanguageToggle />
              <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {session?.user?.name?.charAt(0) || "T"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <div className="fixed top-16 left-0 z-50 w-64 bg-indigo-600 shadow-lg h-[calc(100vh-4rem)]">
          <div className="flex h-full flex-col">
            {/* Class badge */}
            <div className="px-4 py-4 border-b border-indigo-700">
              <div className="bg-indigo-700 rounded-lg px-3 py-2">
                <p className="text-xs text-indigo-300">My Class</p>
                <p className="text-sm font-semibold text-white">{classLabel}</p>
                <p className="text-xs text-indigo-300">{students.length} students · {subjects.length} subjects</p>
              </div>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => { setActiveSection(item.id); setSearch("") }}
                    className={`group flex w-full items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeSection === item.id
                        ? "bg-white text-indigo-600"
                        : "text-white hover:bg-indigo-700"
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.label}
                  </button>
                )
              })}
            </nav>
            <div className="p-4 border-t border-indigo-700">
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex w-full items-center px-3 py-2 text-sm font-medium text-white rounded-lg hover:bg-red-500 transition-colors"
              >
                <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="pl-64 flex-1">
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

            {dataLoading ? (
              <div className="flex items-center justify-center py-32">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : loadError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
                <ExclamationTriangleIcon className="h-10 w-10 text-red-500 mx-auto mb-3" />
                <p className="text-sm font-medium text-red-800 mb-4">{loadError}</p>
                <button
                  onClick={loadData}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            ) : (
              <>

            {/* ── Overview ── */}
            {activeSection === "overview" && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900">Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: "My Students", value: students.length, icon: UserGroupIcon, color: "text-indigo-600" },
                    { label: "Subjects", value: subjects.length, icon: BookOpenIcon, color: "text-purple-600" },
                    { label: "Marks Recorded", value: marks.length, icon: ChartBarIcon, color: "text-green-600" },
                    { label: "Pending Upload", value: students.length * subjects.length - marks.length, icon: ArrowUpTrayIcon, color: "text-orange-600" },
                  ].map((card) => {
                    const Icon = card.icon
                    return (
                      <div key={card.label} className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                          <Icon className={`h-8 w-8 ${card.color}`} />
                          <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">{card.label}</p>
                            <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Subjects list */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Subjects I Teach</h4>
                    <div className="space-y-2">
                      {subjects.map((s) => (
                        <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{s.name}</p>
                            <p className="text-xs text-gray-500">{s.code}</p>
                          </div>
                          <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                            {marks.filter((m) => m.subject === s.name).length} marks
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Recent Marks</h4>
                    <div className="space-y-2">
                      {marks.slice(0, 6).map((m, i) => {
                        const g = grade(m.score, m.maxScore)
                        return (
                          <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{m.studentName}</p>
                              <p className="text-xs text-gray-500">{m.subject} · {m.term}</p>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-700">{m.score}/{m.maxScore}</span>
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${g.color}`}>{g.label}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Students ── */}
            {activeSection === "students" && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900">My Students — {classLabel}</h3>
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search students..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Student</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Marks Recorded</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Avg Score</th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredStudents.map((s) => {
                          const studentMarks = marks.filter((m) => m.studentId === s.id)
                          const avg = studentMarks.length
                            ? Math.round(studentMarks.reduce((a, m) => a + (m.score / m.maxScore) * 100, 0) / studentMarks.length)
                            : null
                          const g = avg !== null ? grade(avg, 100) : null
                          return (
                            <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center">
                                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                    <span className="text-sm font-medium text-indigo-600">{s.firstName.charAt(0)}</span>
                                  </div>
                                  <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-900">{s.firstName} {s.lastName}</p>
                                    <p className="text-xs text-gray-500">{s.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-700">{studentMarks.length} / {subjects.length}</td>
                              <td className="px-6 py-4">
                                {avg !== null && g ? (
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-700">{avg}%</span>
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${g.color}`}>{g.label}</span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400">No marks yet</span>
                                )}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button
                                  onClick={() => { setSelectedStudent(s); setShowStudentModal(true) }}
                                  className="px-3 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
                                >
                                  View Report
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── Marks ── */}
            {activeSection === "marks" && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900">Marks — {classLabel}</h3>
                <div className="bg-white rounded-lg shadow p-4">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by student or subject..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Student</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Subject</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Score</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Grade</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Term</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Year</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredMarks.map((m, i) => {
                          const g = grade(m.score, m.maxScore)
                          return (
                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center">
                                  <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                    <span className="text-xs font-medium text-indigo-600">{m.studentName.charAt(0)}</span>
                                  </div>
                                  <p className="ml-3 text-sm font-medium text-gray-900">{m.studentName}</p>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-700">{m.subject}</td>
                              <td className="px-6 py-4 text-sm text-gray-700">{m.score} / {m.maxScore}</td>
                              <td className="px-6 py-4">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${g.color}`}>{g.label}</span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">{m.term}</td>
                              <td className="px-6 py-4 text-sm text-gray-500">{m.year}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── Upload Marks ── */}
            {activeSection === "upload" && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900">Upload Marks</h3>

                {/* Template download + instructions */}
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-indigo-900 mb-1">Before you upload</h4>
                      <ul className="text-sm text-indigo-800 space-y-1 list-disc list-inside">
                        <li>File must be <span className="font-medium">.csv</span> format (export from Excel as CSV)</li>
                        <li>Required columns: <span className="font-mono text-xs bg-indigo-100 px-1 rounded">Student Name, Subject, Test, Exam, Term, Year</span></li>
                        <li>Student names must exactly match enrolled students</li>
                        <li>Subject names must match registered subjects</li>
                        <li>Term must be: <span className="font-medium">Term 1, Term 2</span> or <span className="font-medium">Term 3</span></li>
                        <li><span className="font-medium">Test</span> is out of {TEST_MAX} and <span className="font-medium">Exam</span> is out of {EXAM_MAX} (total {TEST_MAX + EXAM_MAX})</li>
                        <li>No duplicate entries (same student + subject + term + year)</li>
                      </ul>
                    </div>
                    <a
                      href={templateHref}
                      download="marks_template.csv"
                      className="ml-4 flex-shrink-0 inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                      Download Template
                    </a>
                  </div>
                </div>

                {/* Step: idle */}
                {uploadStep === "idle" && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
                  >
                    <ArrowUpTrayIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-700">Click to upload your marks file</p>
                    <p className="text-sm text-gray-500 mt-1">Supports .csv files (Excel export)</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.xlsx"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                )}

                {/* Step: preview */}
                {uploadStep === "preview" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between bg-white rounded-lg shadow px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <ArrowUpTrayIcon className="h-5 w-5 text-indigo-600" />
                        <span className="text-sm font-medium text-gray-900">{fileName}</span>
                        <span className="text-xs text-gray-500">{parsedRows.length} rows</span>
                      </div>
                      <button onClick={resetUpload} className="text-sm text-gray-500 hover:text-red-600 transition-colors">
                        Change file
                      </button>
                    </div>

                    {/* Global errors */}
                    {globalErrors.length > 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
                          <p className="text-sm font-semibold text-red-800">File cannot be processed</p>
                        </div>
                        <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                          {globalErrors.map((e, i) => <li key={i}>{e}</li>)}
                        </ul>
                      </div>
                    )}

                    {/* Summary */}
                    {globalErrors.length === 0 && (
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white rounded-lg shadow p-4 text-center">
                          <p className="text-2xl font-bold text-gray-900">{parsedRows.length}</p>
                          <p className="text-sm text-gray-500">Total Rows</p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4 text-center">
                          <p className="text-2xl font-bold text-green-600">{validRows.length}</p>
                          <p className="text-sm text-gray-500">Valid</p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4 text-center">
                          <p className="text-2xl font-bold text-red-600">{invalidRows.length}</p>
                          <p className="text-sm text-gray-500">Errors</p>
                        </div>
                      </div>
                    )}

                    {/* Rows preview table */}
                    {parsedRows.length > 0 && globalErrors.length === 0 && (
                      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                          <p className="text-sm font-medium text-gray-700">Preview — all rows must be valid before submitting</p>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full">
                            <thead>
                              <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Row</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Student</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Subject</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Test</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Exam</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Total</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Term</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Year</th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {parsedRows.map((row, i) => (
                                <tr key={i} className={row.valid ? "hover:bg-gray-50" : "bg-red-50"}>
                                  <td className="px-4 py-3 text-xs text-gray-500">{i + 2}</td>
                                  <td className="px-4 py-3 text-sm text-gray-900">{row.studentName || "—"}</td>
                                  <td className="px-4 py-3 text-sm text-gray-700">{row.subject || "—"}</td>
                                  <td className="px-4 py-3 text-sm text-gray-700">{row.test}/{TEST_MAX}</td>
                                  <td className="px-4 py-3 text-sm text-gray-700">{row.exam}/{EXAM_MAX}</td>
                                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{row.test + row.exam}/{TEST_MAX + EXAM_MAX}</td>
                                  <td className="px-4 py-3 text-sm text-gray-500">{row.term || "—"}</td>
                                  <td className="px-4 py-3 text-sm text-gray-500">{row.year || "—"}</td>
                                  <td className="px-4 py-3">
                                    {row.valid ? (
                                      <span className="inline-flex items-center text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                                        <CheckCircleIcon className="h-3 w-3 mr-1" /> Valid
                                      </span>
                                    ) : (
                                      <div>
                                        <span className="inline-flex items-center text-xs text-red-700 bg-red-100 px-2 py-0.5 rounded-full mb-1">
                                          <ExclamationTriangleIcon className="h-3 w-3 mr-1" /> Error
                                        </span>
                                        <ul className="text-xs text-red-600 list-disc list-inside">
                                          {row.errors.map((e, j) => <li key={j}>{e}</li>)}
                                        </ul>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Submit error */}
                    {submitError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2 flex-shrink-0" />
                        <p className="text-sm text-red-700">{submitError}</p>
                      </div>
                    )}

                    {/* Actions */}
                    {globalErrors.length === 0 && parsedRows.length > 0 && (
                      <div className="flex items-center justify-between bg-white rounded-lg shadow px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {invalidRows.length > 0
                            ? <span className="text-red-600 font-medium">Fix {invalidRows.length} error(s) in your file before submitting.</span>
                            : <span className="text-green-600 font-medium">All {validRows.length} rows are valid and ready to submit.</span>
                          }
                        </div>
                        <div className="flex space-x-3">
                          <button onClick={resetUpload} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm">
                            Cancel
                          </button>
                          <button
                            onClick={handleSubmit}
                            disabled={invalidRows.length > 0 || isSubmitting}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSubmitting ? "Saving..." : `Submit ${validRows.length} Marks`}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step: success */}
                {uploadStep === "success" && (
                  <div className="bg-white rounded-xl shadow p-12 text-center">
                    <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h4 className="text-xl font-semibold text-gray-900 mb-2">Marks Submitted Successfully</h4>
                    <p className="text-gray-500 mb-6">{savedCount} mark records have been saved to the database. Parents can now view their child&apos;s report.</p>
                    <button
                      onClick={() => { resetUpload(); setActiveSection("marks") }}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      View Marks
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── Discipline ── */}
            {activeSection === "discipline" && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900">Discipline — {classLabel}</h3>

                {/* Record form */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h4 className="text-base font-semibold text-gray-900 mb-1">Record a merit or demerit</h4>
                  <p className="text-sm text-gray-500 mb-4">Logged records appear on the student&apos;s report card for their parent.</p>
                  <form onSubmit={submitDiscipline} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                        <select
                          value={discForm.studentId}
                          onChange={(e) => { setDiscForm((f) => ({ ...f, studentId: e.target.value })); setDiscSaved(false) }}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Select a student…</option>
                          {students.map((s) => (
                            <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                        <select
                          value={discForm.type}
                          onChange={(e) => setDiscForm((f) => ({ ...f, type: e.target.value }))}
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="Merit">Merit</option>
                          <option value="Demerit">Demerit</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                        <input
                          type="text"
                          value={discForm.category}
                          onChange={(e) => setDiscForm((f) => ({ ...f, category: e.target.value }))}
                          placeholder="e.g. Academic Excellence, Late Arrival"
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Points</label>
                          <input
                            type="number"
                            min="1"
                            value={discForm.points}
                            onChange={(e) => setDiscForm((f) => ({ ...f, points: e.target.value }))}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                          <input
                            type="date"
                            value={discForm.date}
                            onChange={(e) => setDiscForm((f) => ({ ...f, date: e.target.value }))}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Note <span className="text-gray-400">(optional)</span></label>
                      <textarea
                        value={discForm.note}
                        onChange={(e) => setDiscForm((f) => ({ ...f, note: e.target.value }))}
                        rows={2}
                        placeholder="Brief context for this record…"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Action Taken <span className="text-gray-400">(optional)</span></label>
                      <input
                        type="text"
                        value={discForm.actionTaken}
                        onChange={(e) => setDiscForm((f) => ({ ...f, actionTaken: e.target.value }))}
                        placeholder="e.g. Verbal warning, Certificate awarded, Parent notified"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-sm">
                        {discSaved && <span className="text-green-600">Record saved ✓</span>}
                        {discError && <span className="text-red-600">{discError}</span>}
                      </div>
                      <button
                        type="submit"
                        disabled={discSubmitting}
                        className="inline-flex items-center px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {discSubmitting ? "Saving…" : "Save Record"}
                      </button>
                    </div>
                  </form>
                </div>

                {/* Records list */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-700">Recent Records</p>
                  </div>
                  {discRecords.length === 0 ? (
                    <div className="text-center py-12">
                      <ShieldExclamationIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No discipline records yet.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="border-b border-gray-200 bg-gray-50">
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Student</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Points</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Note</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Action Taken</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {discRecords.map((d) => (
                            <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{d.date}</td>
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">{d.studentName}</td>
                              <td className="px-6 py-4">
                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${d.type === "Merit" ? "text-green-700 bg-green-100" : "text-red-700 bg-red-100"}`}>{d.type}</span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900">{d.category}</td>
                              <td className={`px-6 py-4 text-sm font-semibold ${d.points >= 0 ? "text-green-700" : "text-red-700"}`}>{d.points > 0 ? `+${d.points}` : d.points}</td>
                              <td className="px-6 py-4 text-sm text-gray-500">{d.note || "—"}</td>
                              <td className="px-6 py-4 text-sm text-gray-500">{d.actionTaken || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

              </>
            )}

          </main>
        </div>
      </div>

      {/* ── Student Report Modal ── */}
      {showStudentModal && selectedStudent && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-6 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-lg bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Student Report</h3>
              <button onClick={() => setShowStudentModal(false)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Student header */}
            <div className="flex items-center space-x-4 pb-4 border-b mb-4">
              <div className="h-14 w-14 rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-xl font-bold text-indigo-600">{selectedStudent.firstName.charAt(0)}</span>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900">{selectedStudent.firstName} {selectedStudent.lastName}</h4>
                <p className="text-sm text-gray-500">{selectedStudent.email} · {classLabel}</p>
              </div>
            </div>

            {/* Marks table */}
            {(() => {
              const studentMarks = marks.filter((m) => m.studentId === selectedStudent.id)
              if (studentMarks.length === 0) {
                return <p className="text-sm text-gray-500 text-center py-8">No marks recorded yet.</p>
              }
              const avg = Math.round(studentMarks.reduce((a, m) => a + (m.score / m.maxScore) * 100, 0) / studentMarks.length)
              const g = grade(avg, 100)
              return (
                <>
                  <table className="min-w-full mb-4">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50">
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Subject</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Score</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">%</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Grade</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Term</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {studentMarks.map((m, i) => {
                        const pct = Math.round((m.score / m.maxScore) * 100)
                        const gr = grade(m.score, m.maxScore)
                        return (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">{m.subject}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{m.score}/{m.maxScore}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{pct}%</td>
                            <td className="px-4 py-3"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${gr.color}`}>{gr.label}</span></td>
                            <td className="px-4 py-3 text-sm text-gray-500">{m.term} {m.year}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                    <span className="text-sm font-medium text-gray-700">Overall Average</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-semibold text-gray-900">{avg}%</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${g.color}`}>{g.label}</span>
                    </div>
                  </div>
                </>
              )
            })()}

            <div className="mt-6 flex justify-end">
              <button onClick={() => setShowStudentModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
