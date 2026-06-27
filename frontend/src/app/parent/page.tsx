"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, type FormEvent } from "react"
import {
  AcademicCapIcon,
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
  BookOpenIcon,
  UserCircleIcon,
  ChevronDownIcon,
  TrophyIcon,
  ClockIcon,
  CheckBadgeIcon,
  LightBulbIcon,
  StarIcon,
  ShieldExclamationIcon,
  BanknotesIcon,
  ChatBubbleLeftRightIcon,
  PrinterIcon,
  PaperAirplaneIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline"
import LanguageToggle from "@/components/LanguageToggle"

// ─── Types ───────────────────────────────────────────────────────────────────

interface Child {
  id: string
  firstName: string
  lastName: string
  class: string
  grade: string
}

interface Mark {
  subject: string
  subjectCode: string
  test: number       // continuous assessment, out of TEST_MAX
  exam: number       // final exam, out of EXAM_MAX
  score: number      // test + exam, out of maxScore
  maxScore: number
  term: string
  year: string
  teacher: string
}

interface DisciplineRecord {
  date: string
  type: "Merit" | "Demerit"
  category: string
  points: number     // positive for merit, negative for demerit
  note: string
  actionTaken?: string
  recordedBy: string
}

interface FeeItem {
  item: string
  amount: number
  term: string
}

interface FeeAccount {
  currency: string
  dueDate: string
  items: FeeItem[]
  paid: number
}

const TEST_MAX = 50
const EXAM_MAX = 50

// ─── API types & normalizers ────────────────────────────────────────────────

// Raw shapes returned by GET /api/parents/me (Mongoose lean docs).
interface RawMark {
  test?: number
  exam?: number
  score: number
  maxScore: number
  term: string
  year: string | number
  subject?: { name?: string; code?: string } | null
  teacher?: { user?: { name?: string } | null } | null
}
interface RawDiscipline {
  date: string
  type: "Merit" | "Demerit"
  category: string
  points: number
  note?: string
  actionTaken?: string
  recordedBy?: string
}
interface RawFee {
  currency?: string
  dueDate?: string
  items?: FeeItem[]
  paid?: number
}
interface RawChild {
  _id: string
  firstName: string
  lastName: string
  email?: string
  class?: { name?: string; grade?: string } | null
  marks?: RawMark[]
  discipline?: RawDiscipline[]
  fee?: RawFee | null
}

async function fetchJson(url: string) {
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed (${res.status})`)
  }
  return res.json()
}

function normalizeChild(c: RawChild): Child {
  return {
    id: String(c._id),
    firstName: c.firstName,
    lastName: c.lastName,
    class: c.class?.name ?? "—",
    grade: c.class?.grade ?? "",
  }
}

function normalizeMark(m: RawMark): Mark {
  return {
    subject: m.subject?.name ?? "",
    subjectCode: m.subject?.code ?? "",
    test: m.test ?? 0,
    exam: m.exam ?? 0,
    score: m.score,
    maxScore: m.maxScore,
    term: m.term,
    year: String(m.year),
    teacher: m.teacher?.user?.name ?? "—",
  }
}

function normalizeDiscipline(d: RawDiscipline): DisciplineRecord {
  return {
    date: typeof d.date === "string" ? d.date.slice(0, 10) : String(d.date),
    type: d.type,
    category: d.category,
    points: d.points,
    note: d.note ?? "",
    actionTaken: d.actionTaken,
    recordedBy: d.recordedBy ?? "School",
  }
}

function normalizeFee(f?: RawFee | null): FeeAccount | undefined {
  if (!f) return undefined
  return {
    currency: f.currency ?? "RWF",
    dueDate: f.dueDate ?? "",
    items: (f.items ?? []).map((it) => ({ item: it.item, amount: it.amount, term: it.term })),
    paid: f.paid ?? 0,
  }
}

// ─── Career Engine ────────────────────────────────────────────────────────────

interface CareerCluster {
  id: string
  title: string
  emoji: string
  description: string
  careers: string[]
  subjects: string[]        // subjects that feed this cluster
  color: string             // tailwind bg color for card accent
  minScore: number          // minimum avg % to surface this cluster
}

// Career clusters are loaded from GET /api/careers. This is the raw API shape.
interface RawCluster {
  clusterId: string
  title: string
  emoji?: string
  description?: string
  careers?: string[]
  subjects?: string[]
  color?: string
  minScore?: number
}

function normalizeCluster(c: RawCluster): CareerCluster {
  return {
    id: c.clusterId,
    title: c.title,
    emoji: c.emoji ?? "",
    description: c.description ?? "",
    careers: c.careers ?? [],
    subjects: c.subjects ?? [],
    color: c.color ?? "border-gray-400 bg-gray-50",
    minScore: c.minScore ?? 60,
  }
}

interface CareerRecommendation {
  cluster: CareerCluster
  matchScore: number      // 0–100, how well subjects align
  topSubjects: string[]   // the matching subjects that drove this
}

function computeCareerRecommendations(marks: Mark[], clusters: CareerCluster[]): CareerRecommendation[] {
  if (marks.length === 0 || clusters.length === 0) return []

  // Build subject → average score map across all terms
  const subjectMap: Record<string, number[]> = {}
  for (const m of marks) {
    if (!subjectMap[m.subject]) subjectMap[m.subject] = []
    subjectMap[m.subject].push((m.score / m.maxScore) * 100)
  }
  const subjectAvg: Record<string, number> = {}
  for (const [subj, scores] of Object.entries(subjectMap)) {
    subjectAvg[subj] = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
  }

  const results: CareerRecommendation[] = []

  for (const cluster of clusters) {
    // Find which of this cluster's subjects the student actually has marks for
    const matched = cluster.subjects.filter((s) => subjectAvg[s] !== undefined)
    if (matched.length === 0) continue

    // Average score across matched subjects
    const clusterAvg = Math.round(
      matched.reduce((sum, s) => sum + subjectAvg[s], 0) / matched.length
    )

    if (clusterAvg < cluster.minScore) continue

    // Match score: weighted by how many cluster subjects are covered + performance
    const coverage = matched.length / cluster.subjects.length
    const matchScore = Math.round(clusterAvg * 0.7 + coverage * 100 * 0.3)

    results.push({
      cluster,
      matchScore,
      topSubjects: matched.sort((a, b) => subjectAvg[b] - subjectAvg[a]),
    })
  }

  // Sort by match score descending, return top 4
  return results.sort((a, b) => b.matchScore - a.matchScore).slice(0, 4)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function gradeInfo(score: number, max: number) {
  const pct = (score / max) * 100
  if (pct >= 90) return { label: "A+", color: "text-emerald-700 bg-emerald-100", bar: "bg-emerald-500" }
  if (pct >= 80) return { label: "A", color: "text-green-700 bg-green-100", bar: "bg-green-500" }
  if (pct >= 70) return { label: "B", color: "text-blue-700 bg-blue-100", bar: "bg-blue-500" }
  if (pct >= 60) return { label: "C", color: "text-yellow-700 bg-yellow-100", bar: "bg-yellow-500" }
  if (pct >= 50) return { label: "D", color: "text-orange-700 bg-orange-100", bar: "bg-orange-500" }
  return { label: "F", color: "text-red-700 bg-red-100", bar: "bg-red-500" }
}

function avg(marks: Mark[]) {
  if (!marks.length) return 0
  return Math.round(marks.reduce((a, m) => a + (m.score / m.maxScore) * 100, 0) / marks.length)
}

const TERMS = ["Term 1", "Term 2", "Term 3"]

// ─── Component ────────────────────────────────────────────────────────────────

export default function ParentDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [activeSection, setActiveSection] = useState("overview")
  const [selectedChild, setSelectedChild] = useState<Child | null>(null)
  const [selectedTerm, setSelectedTerm] = useState("Term 1")
  const [showChildDropdown, setShowChildDropdown] = useState(false)

  // Children + their marks/discipline/fees, loaded from /api/parents/me
  const [children, setChildren] = useState<Child[]>([])
  const [marksByChild, setMarksByChild] = useState<Record<string, Mark[]>>({})
  const [disciplineByChild, setDisciplineByChild] = useState<Record<string, DisciplineRecord[]>>({})
  const [feeByChild, setFeeByChild] = useState<Record<string, FeeAccount | undefined>>({})
  const [careerClusters, setCareerClusters] = useState<CareerCluster[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Comments (real, persisted via /api/comments)
  interface CommentItem { _id: string; message: string; regarding?: string; status: string; createdAt: string }
  const [commentText, setCommentText] = useState("")
  const [commentState, setCommentState] = useState<"idle" | "sending" | "sent" | "error">("idle")
  const [commentError, setCommentError] = useState("")
  const [myComments, setMyComments] = useState<CommentItem[]>([])

  useEffect(() => {
    if (status === "loading") return
    if (!session) { router.push("/auth/signin"); return }
    if (session.user.role !== "PARENT") { router.push("/"); return }
  }, [session, status, router])

  // Load the parent's previously submitted messages
  useEffect(() => {
    if (status !== "authenticated") return
    fetch("/api/comments")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setMyComments(Array.isArray(data) ? data : []))
      .catch(() => { })
  }, [status])

  // Load the parent's children + marks/discipline/fees
  useEffect(() => {
    if (status !== "authenticated" || session?.user.role !== "PARENT") return
    let cancelled = false
      ; (async () => {
        setDataLoading(true)
        setLoadError(null)
        try {
          const [me, clusters] = await Promise.all([
            fetchJson("/api/parents/me"),
            fetchJson("/api/careers").catch(() => []),
          ])
          if (cancelled) return
          setCareerClusters((clusters as RawCluster[]).map(normalizeCluster))
          const raw = (me?.students ?? []) as RawChild[]
          const marksMap: Record<string, Mark[]> = {}
          const discMap: Record<string, DisciplineRecord[]> = {}
          const feeMap: Record<string, FeeAccount | undefined> = {}
          raw.forEach((c) => {
            const id = String(c._id)
            marksMap[id] = (c.marks ?? []).map(normalizeMark)
            discMap[id] = (c.discipline ?? []).map(normalizeDiscipline)
            feeMap[id] = normalizeFee(c.fee)
          })
          const kids = raw.map(normalizeChild)
          setChildren(kids)
          setMarksByChild(marksMap)
          setDisciplineByChild(discMap)
          setFeeByChild(feeMap)
          setSelectedChild((prev) => prev ?? kids[0] ?? null)
        } catch (e) {
          if (!cancelled) setLoadError(e instanceof Error ? e.message : "Failed to load your children's data")
        } finally {
          if (!cancelled) setDataLoading(false)
        }
      })()
    return () => { cancelled = true }
  }, [status, session?.user.role])

  async function submitComment(e: FormEvent) {
    e.preventDefault()
    if (!commentText.trim()) return
    setCommentState("sending")
    setCommentError("")
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: commentText.trim(),
          regarding: selectedChild ? `${selectedChild.firstName} ${selectedChild.lastName}` : undefined,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Failed to send message")
      }
      const created: CommentItem = await res.json()
      setMyComments((prev) => [created, ...prev])
      setCommentText("")
      setCommentState("sent")
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : "Failed to send message")
      setCommentState("error")
    }
  }

  const childId = selectedChild?.id
  const allMarks = childId ? (marksByChild[childId] ?? []) : []
  const termMarks = allMarks.filter((m) => m.term === selectedTerm)
  const childAvg = avg(termMarks)
  const childGrade = gradeInfo(childAvg, 100)
  const selectedYear = termMarks[0]?.year ?? allMarks[0]?.year ?? ""

  // Career recommendations — based on all-term data
  const careerRecs = computeCareerRecommendations(allMarks, careerClusters)
  const hasEnoughData = allMarks.length >= 3

  // Best and weakest subject this term
  const sorted = [...termMarks].sort((a, b) => (b.score / b.maxScore) - (a.score / a.maxScore))
  const best = sorted[0]
  const weakest = sorted[sorted.length - 1]

  // Discipline & financial
  const disciplineRecords = childId ? (disciplineByChild[childId] ?? []) : []
  const merits = disciplineRecords.filter((d) => d.type === "Merit").reduce((a, d) => a + d.points, 0)
  const demerits = disciplineRecords.filter((d) => d.type === "Demerit").reduce((a, d) => a + Math.abs(d.points), 0)
  const conductScore = merits - demerits
  const conductLabel = conductScore >= 5 ? "Excellent" : conductScore >= 0 ? "Good" : "Needs Attention"
  const conductColor = conductScore >= 5 ? "text-green-700 bg-green-100" : conductScore >= 0 ? "text-blue-700 bg-blue-100" : "text-red-700 bg-red-100"

  const feeAccount = childId ? feeByChild[childId] : undefined
  const feeTotal = feeAccount ? feeAccount.items.reduce((a, f) => a + f.amount, 0) : 0
  const feeBalance = feeAccount ? feeTotal - feeAccount.paid : 0
  const feePaidPct = feeTotal > 0 ? Math.min(Math.round((feeAccount!.paid / feeTotal) * 100), 100) : 0
  const fmtMoney = (n: number) => `${feeAccount?.currency ?? ""} ${n.toLocaleString()}`

  const menuItems = [
    { id: "overview", label: "Overview", icon: ChartBarIcon },
    { id: "report", label: "Report Card", icon: BookOpenIcon },
    { id: "discipline_financial", label: "Discipline & Financial", icon: ShieldExclamationIcon },
    { id: "messages", label: "Messages", icon: ChatBubbleLeftRightIcon },
    { id: "careers", label: "Career Insights", icon: LightBulbIcon },
  ]

  if (status === "loading" || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-rose-600"></div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center max-w-md">
          <ExclamationTriangleIcon className="h-10 w-10 text-red-500 mx-auto mb-3" />
          <p className="text-sm font-medium text-red-800 mb-4">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-rose-600 text-white text-sm rounded-lg hover:bg-rose-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!selectedChild) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-10 text-center max-w-md">
          <UserCircleIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No children linked yet</h2>
          <p className="text-sm text-gray-500 mb-6">
            Your account isn&apos;t linked to any students. Please ask your school administrator to link your child to your account.
          </p>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* When printing, show only the report card */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #report-print, #report-print * { visibility: visible !important; }
          #report-print { position: absolute; left: 0; top: 0; width: 100%; padding: 16px; }
          .no-print { display: none !important; }
        }
      `}</style>
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-lg bg-rose-600 flex items-center justify-center">
                <UserCircleIcon className="h-5 w-5 text-white" />
              </div>
              <div className="ml-4">
                <h1 className="text-xl font-semibold text-gray-900">Parent Portal</h1>
                <p className="text-sm text-gray-500">Academic Progress Tracker</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <LanguageToggle />
              <div className="h-10 w-10 rounded-full bg-rose-600 flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {session?.user?.name?.charAt(0) || "P"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <div className="fixed top-16 left-0 z-50 w-64 bg-rose-600 shadow-lg h-[calc(100vh-4rem)]">
          <div className="flex h-full flex-col">

            {/* Child selector */}
            <div className="px-4 py-4 border-b border-rose-700">
              <p className="text-xs text-rose-300 mb-2">Viewing child</p>
              <div className="relative">
                <button
                  onClick={() => setShowChildDropdown(!showChildDropdown)}
                  className="w-full flex items-center justify-between bg-rose-700 rounded-lg px-3 py-2 text-white hover:bg-rose-800 transition-colors"
                >
                  <div className="flex items-center">
                    <div className="h-7 w-7 rounded-full bg-white flex items-center justify-center mr-2">
                      <span className="text-xs font-bold text-rose-600">{selectedChild.firstName.charAt(0)}</span>
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-semibold">{selectedChild.firstName} {selectedChild.lastName}</p>
                      <p className="text-xs text-rose-300">{selectedChild.class}</p>
                    </div>
                  </div>
                  <ChevronDownIcon className={`h-4 w-4 transition-transform ${showChildDropdown ? "rotate-180" : ""}`} />
                </button>

                {showChildDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg z-10 overflow-hidden">
                    {children.map((child) => (
                      <button
                        key={child.id}
                        onClick={() => { setSelectedChild(child); setShowChildDropdown(false); setSelectedTerm("Term 1") }}
                        className={`w-full flex items-center px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${selectedChild.id === child.id ? "bg-rose-50" : ""}`}
                      >
                        <div className="h-7 w-7 rounded-full bg-rose-100 flex items-center justify-center mr-2">
                          <span className="text-xs font-bold text-rose-600">{child.firstName.charAt(0)}</span>
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900">{child.firstName} {child.lastName}</p>
                          <p className="text-xs text-gray-500">{child.class}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`group flex w-full items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeSection === item.id
                      ? "bg-white text-rose-600"
                      : "text-white hover:bg-rose-700"
                      }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.label}
                  </button>
                )
              })}
            </nav>

            <div className="p-4 border-t border-rose-700">
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

            {/* Term selector — shown on all sections */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {activeSection === "overview" && "Overview"}
                  {activeSection === "report" && "Report Card"}
                  {activeSection === "discipline_financial" && "Discipline & Financial"}
                  {activeSection === "messages" && "Messages to School"}
                  {activeSection === "careers" && "Career Insights"}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">{selectedChild.firstName} {selectedChild.lastName} · {selectedChild.class}</p>
              </div>
              <div className="flex items-center space-x-2">
                {TERMS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTerm(t)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedTerm === t
                      ? "bg-rose-600 text-white"
                      : "bg-white text-gray-700 shadow-sm hover:bg-gray-50"
                      }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Overview ── */}
            {activeSection === "overview" && (
              <div className="space-y-6">
                {/* Summary cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <ChartBarIcon className="h-8 w-8 text-rose-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Average Score</p>
                        <p className="text-2xl font-semibold text-gray-900">{termMarks.length ? `${childAvg}%` : "—"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <CheckBadgeIcon className="h-8 w-8 text-indigo-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Overall Grade</p>
                        <p className="text-2xl font-semibold text-gray-900">{termMarks.length ? childGrade.label : "—"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <TrophyIcon className="h-8 w-8 text-yellow-500" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Best Subject</p>
                        <p className="text-lg font-semibold text-gray-900 truncate">{best?.subject ?? "—"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <ClockIcon className="h-8 w-8 text-orange-500" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Needs Attention</p>
                        <p className="text-lg font-semibold text-gray-900 truncate">{weakest?.subject ?? "—"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subject score bars */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-6">{selectedTerm} — Subject Scores</h4>
                  {termMarks.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">No marks available for {selectedTerm}.</p>
                  ) : (
                    <div className="space-y-4">
                      {termMarks.map((m, i) => {
                        const pct = Math.round((m.score / m.maxScore) * 100)
                        const g = gradeInfo(m.score, m.maxScore)
                        return (
                          <div key={i}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700">{m.subject}</span>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">{m.score}/{m.maxScore}</span>
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${g.color}`}>{g.label}</span>
                              </div>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2.5">
                              <div
                                className={`h-2.5 rounded-full transition-all ${g.bar}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Report Card ── */}
            {activeSection === "report" && (
              <div className="space-y-6">
                {/* Print / download toolbar */}
                <div className="no-print flex justify-end">
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center px-4 py-2 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 transition-colors shadow-sm"
                  >
                    <PrinterIcon className="h-5 w-5 mr-2" />
                    Print / Download PDF
                  </button>
                </div>

                {/* Printable report card */}
                <div id="report-print" className="space-y-6">
                  {/* Report card header */}
                  <div className="bg-white rounded-xl shadow p-6 border-t-4 border-rose-600">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="h-16 w-16 rounded-full bg-rose-100 flex items-center justify-center">
                          <span className="text-2xl font-bold text-rose-600">{selectedChild.firstName.charAt(0)}</span>
                        </div>
                        <div>
                          <h4 className="text-xl font-bold text-gray-900">{selectedChild.firstName} {selectedChild.lastName}</h4>
                          <p className="text-sm text-gray-500">{selectedChild.class} · {selectedTerm}{selectedYear ? ` · ${selectedYear}` : ""}</p>
                        </div>
                      </div>
                      {termMarks.length > 0 && (
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Overall Average</p>
                          <p className="text-3xl font-bold text-gray-900">{childAvg}%</p>
                          <span className={`inline-block text-sm font-bold px-3 py-1 rounded-full mt-1 ${childGrade.color}`}>
                            Grade {childGrade.label}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Marks table */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                      <p className="text-sm font-semibold text-gray-700">Subject Results — {selectedTerm}</p>
                    </div>
                    {termMarks.length === 0 ? (
                      <div className="text-center py-16">
                        <AcademicCapIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No marks recorded for {selectedTerm} yet.</p>
                        <p className="text-sm text-gray-400 mt-1">Check back after your child&apos;s teacher uploads results.</p>
                      </div>
                    ) : (
                      <table className="min-w-full">
                        <thead>
                          <tr className="border-b border-gray-200 bg-gray-50">
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Subject</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Code</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Test<span className="block font-normal normal-case text-gray-400">/{TEST_MAX}</span></th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Exam<span className="block font-normal normal-case text-gray-400">/{EXAM_MAX}</span></th>
                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Total<span className="block font-normal normal-case text-gray-400">/100</span></th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">%</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Grade</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Teacher</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {termMarks.map((m, i) => {
                            const pct = Math.round((m.score / m.maxScore) * 100)
                            const g = gradeInfo(m.score, m.maxScore)
                            return (
                              <tr key={i} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{m.subject}</td>
                                <td className="px-4 py-4">
                                  <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{m.subjectCode}</span>
                                </td>
                                <td className="px-4 py-4 text-sm text-center text-gray-700">{m.test}</td>
                                <td className="px-4 py-4 text-sm text-center text-gray-700">{m.exam}</td>
                                <td className="px-4 py-4 text-sm text-center font-semibold text-gray-900">{m.score}</td>
                                <td className="px-4 py-4">
                                  <div className="flex items-center space-x-2">
                                    <div className="w-20 bg-gray-100 rounded-full h-2">
                                      <div className={`h-2 rounded-full ${g.bar}`} style={{ width: `${pct}%` }} />
                                    </div>
                                    <span className="text-sm text-gray-700">{pct}%</span>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${g.color}`}>{g.label}</span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">{m.teacher}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                        {/* Footer row */}
                        <tfoot>
                          <tr className="bg-gray-50 border-t-2 border-gray-200">
                            <td colSpan={4} className="px-6 py-3 text-sm font-semibold text-gray-700">Overall Average</td>
                            <td className="px-4 py-3 text-sm text-center font-bold text-gray-900">{childAvg}</td>
                            <td className="px-4 py-3 text-sm font-bold text-gray-900">{childAvg}%</td>
                            <td className="px-4 py-3">
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${childGrade.color}`}>{childGrade.label}</span>
                            </td>
                            <td />
                          </tr>
                        </tfoot>
                      </table>
                    )}
                  </div>

                  {/* Discipline summary on the report card */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-4">Discipline & Conduct</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center rounded-lg bg-green-50 border border-green-100 p-4">
                        <p className="text-2xl font-bold text-green-700">+{merits}</p>
                        <p className="text-xs text-green-800 mt-1">Merit points</p>
                      </div>
                      <div className="text-center rounded-lg bg-red-50 border border-red-100 p-4">
                        <p className="text-2xl font-bold text-red-700">-{demerits}</p>
                        <p className="text-xs text-red-800 mt-1">Demerit points</p>
                      </div>
                      <div className="text-center rounded-lg bg-gray-50 border border-gray-100 p-4">
                        <p className="text-2xl font-bold text-gray-900">{conductScore}</p>
                        <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-1 ${conductColor}`}>{conductLabel}</span>
                      </div>
                    </div>
                  </div>

                  {/* Remark */}
                  {termMarks.length > 0 && (
                    <div className={`rounded-lg p-4 border ${childAvg >= 70 ? "bg-green-50 border-green-200" : childAvg >= 50 ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200"}`}>
                      <p className={`text-sm font-medium ${childAvg >= 70 ? "text-green-800" : childAvg >= 50 ? "text-yellow-800" : "text-red-800"}`}>
                        {childAvg >= 80
                          ? `Excellent performance! ${selectedChild.firstName} is doing very well this term.`
                          : childAvg >= 70
                            ? `Good performance. ${selectedChild.firstName} is on track — keep it up.`
                            : childAvg >= 50
                              ? `Average performance. ${selectedChild.firstName} may need extra support in some subjects.`
                              : `${selectedChild.firstName} is struggling this term. Consider reaching out to the class teacher.`}
                      </p>
                    </div>
                  )}
                </div>{/* /#report-print */}
              </div>
            )}

            {/* ── Discipline & Financial ── */}
            {activeSection === "discipline_financial" && (
              <div className="space-y-6">
                {/* Conduct summary cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <CheckCircleIcon className="h-8 w-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Merit Points</p>
                        <p className="text-2xl font-semibold text-gray-900">+{merits}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <ExclamationTriangleIcon className="h-8 w-8 text-red-500" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Demerit Points</p>
                        <p className="text-2xl font-semibold text-gray-900">-{demerits}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <ShieldExclamationIcon className="h-8 w-8 text-rose-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Conduct</p>
                        <div className="flex items-center space-x-2">
                          <p className="text-2xl font-semibold text-gray-900">{conductScore}</p>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${conductColor}`}>{conductLabel}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Discipline records */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-700">Disciplinary Record</p>
                  </div>
                  {disciplineRecords.length === 0 ? (
                    <div className="text-center py-12">
                      <ShieldExclamationIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No disciplinary records for {selectedChild.firstName}.</p>
                    </div>
                  ) : (
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Marks Taken</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Disciplinary Marks</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Action Taken</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {disciplineRecords.map((d, i) => (
                          <tr key={i} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">{d.date}</td>
                            <td className={`px-6 py-4 text-sm font-semibold ${d.points >= 0 ? "text-green-700" : "text-red-700"}`}>{d.points > 0 ? `+${d.points}` : d.points}</td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{d.category}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{d.actionTaken || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* School fees structure */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-700">School Fees Structure</p>
                    <BanknotesIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  {!feeAccount ? (
                    <div className="text-center py-12">
                      <BanknotesIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">No fee structure available.</p>
                    </div>
                  ) : (
                    <>
                      <table className="min-w-full">
                        <thead>
                          <tr className="border-b border-gray-200 bg-gray-50">
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Term</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Estimated School Fees</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Paid Amount</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Remaining Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {(() => {
                            // Group fees by term and calculate per-term values
                            const trimesters = ["Term 1", "Term 2", "Term 3"];
                            let remainingPaid = feeAccount.paid;

                            return trimesters.map((term) => {
                              const estimated = feeAccount.items
                                .filter(it => it.term === term)
                                .reduce((sum, it) => sum + it.amount, 0);

                              const paidForTerm = Math.min(estimated, remainingPaid);
                              remainingPaid -= paidForTerm;
                              const remaining = estimated - paidForTerm;

                              return (
                                <tr key={term} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{term.replace("Term", "Trimester")}</td>
                                  <td className="px-6 py-4 text-sm text-right text-gray-700">{fmtMoney(estimated)}</td>
                                  <td className="px-6 py-4 text-sm text-right text-green-700 font-medium">{fmtMoney(paidForTerm)}</td>
                                  <td className="px-6 py-4 text-sm text-right text-red-700 font-semibold">{fmtMoney(remaining)}</td>
                                </tr>
                              );
                            });
                          })()}
                        </tbody>
                        <tfoot>
                          <tr className="bg-gray-50 border-t-2 border-gray-200">
                            <td className="px-6 py-3 text-sm font-semibold text-gray-700">Total Account</td>
                            <td className="px-6 py-3 text-sm text-right font-bold text-gray-900">{fmtMoney(feeTotal)}</td>
                            <td className="px-6 py-3 text-sm text-right font-bold text-green-700">{fmtMoney(feeAccount.paid)}</td>
                            <td className="px-6 py-3 text-sm text-right font-bold text-red-700">{fmtMoney(feeBalance)}</td>
                          </tr>
                        </tfoot>
                      </table>

                      {/* Payment status progress bar */}
                      <div className="px-6 py-5 border-t border-gray-200">
                        <div className="w-full bg-gray-100 rounded-full h-3">
                          <div className={`h-3 rounded-full ${feeBalance <= 0 ? "bg-green-500" : "bg-rose-500"}`} style={{ width: `${feePaidPct}%` }} />
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Overall balance is {fmtMoney(feeBalance)}. Due by {feeAccount.dueDate || "the end of term"}.</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* ── Messages to School ── */}
            {activeSection === "messages" && (
              <div className="space-y-6">
                {/* Composer */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h4 className="text-base font-semibold text-gray-900 mb-1">Send a message to the school</h4>
                  <p className="text-sm text-gray-500 mb-4">
                    Share feedback, raise a concern, or ask a question regarding {selectedChild.firstName} {selectedChild.lastName}.
                  </p>
                  <form onSubmit={submitComment}>
                    <textarea
                      value={commentText}
                      onChange={(e) => { setCommentText(e.target.value); if (commentState !== "idle") setCommentState("idle") }}
                      rows={4}
                      placeholder="Write your message…"
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                    />
                    <div className="mt-3 flex items-center justify-between">
                      <div className="text-sm">
                        {commentState === "sent" && <span className="text-green-600">Message sent to the school ✓</span>}
                        {commentState === "error" && <span className="text-red-600">{commentError}</span>}
                      </div>
                      <button
                        type="submit"
                        disabled={commentState === "sending" || !commentText.trim()}
                        className="inline-flex items-center px-4 py-2 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                        {commentState === "sending" ? "Sending…" : "Send Message"}
                      </button>
                    </div>
                  </form>
                </div>

                {/* History */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <p className="text-sm font-semibold text-gray-700">Your previous messages</p>
                  </div>
                  {myComments.length === 0 ? (
                    <div className="text-center py-12">
                      <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">You haven&apos;t sent any messages yet.</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {myComments.map((c) => (
                        <li key={c._id} className="px-6 py-4">
                          <div className="flex items-start justify-between">
                            <p className="text-sm text-gray-800 whitespace-pre-wrap">{c.message}</p>
                            <span className={`ml-4 flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${c.status === "READ" ? "text-green-700 bg-green-100" : "text-gray-600 bg-gray-100"}`}>
                              {c.status === "READ" ? "Read" : "Sent"}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center space-x-2 text-xs text-gray-400">
                            {c.regarding && <span>Re: {c.regarding}</span>}
                            {c.regarding && <span>·</span>}
                            <span>{new Date(c.createdAt).toLocaleString()}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}

            {/* ── Career Insights ── */}
            {activeSection === "careers" && (
              <div className="space-y-6">

                {/* Not enough data guard */}
                {!hasEnoughData ? (
                  <div className="bg-white rounded-xl shadow p-12 text-center">
                    <LightBulbIcon className="h-14 w-14 text-gray-300 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-gray-700 mb-2">Not enough data yet</h4>
                    <p className="text-sm text-gray-500 max-w-md mx-auto">
                      Career insights will appear once {selectedChild.firstName} has marks recorded across multiple subjects.
                      Check back after the teacher uploads results.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Intro banner */}
                    <div className="bg-gradient-to-r from-rose-600 to-rose-500 rounded-xl p-6 text-white">
                      <div className="flex items-start space-x-4">
                        <LightBulbIcon className="h-10 w-10 flex-shrink-0 opacity-90" />
                        <div>
                          <h4 className="text-lg font-bold mb-1">Career Insights for {selectedChild.firstName}</h4>
                          <p className="text-rose-100 text-sm leading-relaxed">
                            Based on {selectedChild.firstName}&apos;s academic performance across all subjects and terms,
                            here are career paths worth exploring together. These are suggestions to spark conversation —
                            not a prescription.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Subject strength summary */}
                    <div className="bg-white rounded-lg shadow p-6">
                      <h4 className="text-base font-semibold text-gray-900 mb-4">Subject Strengths (All Terms)</h4>
                      <div className="space-y-3">
                        {[...new Set(allMarks.map((m) => m.subject))]
                          .map((subj) => {
                            const subjectMarks = allMarks.filter((m) => m.subject === subj)
                            return { subj, a: avg(subjectMarks) }
                          })
                          .sort((x, y) => y.a - x.a)
                          .map(({ subj, a }) => {
                            const g = gradeInfo(a, 100)
                            return (
                              <div key={subj}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium text-gray-700">{subj}</span>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm text-gray-600">{a}%</span>
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${g.color}`}>{g.label}</span>
                                  </div>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                  <div className={`h-2 rounded-full ${g.bar}`} style={{ width: `${a}%` }} />
                                </div>
                              </div>
                            )
                          })}
                      </div>
                    </div>

                    {/* Career recommendation cards */}
                    {careerRecs.length === 0 ? (
                      <div className="bg-white rounded-xl shadow p-8 text-center">
                        <p className="text-gray-500 text-sm">No strong career matches found yet. Encourage {selectedChild.firstName} to keep improving across subjects.</p>
                      </div>
                    ) : (
                      <>
                        <h4 className="text-base font-semibold text-gray-700">Recommended Career Paths</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {careerRecs.map((rec, i) => (
                            <div
                              key={rec.cluster.id}
                              className={`bg-white rounded-xl shadow border-l-4 p-6 ${rec.cluster.color}`}
                            >
                              {/* Card header */}
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                  <span className="text-3xl">{rec.cluster.emoji}</span>
                                  <div>
                                    <div className="flex items-center space-x-2">
                                      {i === 0 && (
                                        <span className="inline-flex items-center text-xs font-semibold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">
                                          <StarIcon className="h-3 w-3 mr-1" /> Top Match
                                        </span>
                                      )}
                                    </div>
                                    <h5 className="text-base font-bold text-gray-900 mt-0.5">{rec.cluster.title}</h5>
                                  </div>
                                </div>
                                {/* Match score ring */}
                                <div className="text-right flex-shrink-0">
                                  <p className="text-2xl font-bold text-gray-900">{rec.matchScore}%</p>
                                  <p className="text-xs text-gray-500">match</p>
                                </div>
                              </div>

                              {/* Description */}
                              <p className="text-sm text-gray-600 mb-4">{rec.cluster.description}</p>

                              {/* Driven by subjects */}
                              <div className="mb-4">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Driven by</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {rec.topSubjects.map((s) => (
                                    <span key={s} className="text-xs bg-white border border-gray-200 text-gray-700 px-2 py-0.5 rounded-full shadow-sm">
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {/* Career list */}
                              <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Possible careers</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {rec.cluster.careers.map((c) => (
                                    <span key={c} className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                                      {c}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Conversation starter */}
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
                          <div className="flex items-start space-x-3">
                            <span className="text-2xl">💬</span>
                            <div>
                              <h5 className="text-sm font-semibold text-amber-900 mb-1">Conversation starter</h5>
                              <p className="text-sm text-amber-800 leading-relaxed">
                                {careerRecs[0] && (
                                  <>
                                    {selectedChild.firstName} is showing real strength in{" "}
                                    <span className="font-semibold">{careerRecs[0].topSubjects.slice(0, 2).join(" and ")}</span>.
                                    That&apos;s a great foundation for a career in{" "}
                                    <span className="font-semibold">{careerRecs[0].cluster.title}</span>.
                                    Ask {selectedChild.firstName}: <em>&ldquo;What do you find most interesting about {careerRecs[0].topSubjects[0]}? Could you see yourself doing that every day?&rdquo;</em>
                                  </>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Disclaimer */}
                        <p className="text-xs text-gray-400 text-center">
                          Career suggestions are based on academic performance patterns and are meant to guide conversation, not limit choices.
                          Every child&apos;s path is unique.
                        </p>
                      </>
                    )}
                  </>
                )}
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
  )
}
