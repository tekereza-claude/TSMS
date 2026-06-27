"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback, type ChangeEvent } from "react"
import {
  AcademicCapIcon,
  UserGroupIcon,
  BookOpenIcon,
  RectangleGroupIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  PlusIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  BanknotesIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  HomeModernIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeOpenIcon,
} from "@heroicons/react/24/outline"
import LanguageToggle from "@/components/LanguageToggle"

// ─── UI Types (flat shapes the components render) ──────────────────────────────

interface Teacher {
  id: string
  name: string
  email: string
  classes: string[]
  joinedDate: string
}

interface Student {
  id: string
  firstName: string
  lastName: string
  email?: string
  classId: string
  className: string
  joinedDate: string
  profilePicture?: string   // base64 data URL
}

interface Class {
  id: string
  name: string
  grade: string
  teacherId: string
  teacher: string
  students: number
}

interface Subject {
  id: string
  name: string
  code: string
  teacherId: string
  teacher: string
}

// ─── Raw API shapes (Mongoose lean docs) ───────────────────────────────────────

interface RawUser { _id: string; name: string; email: string; createdAt?: string }
interface RawTeacher {
  _id: string
  userId: RawUser | null
  classes?: { _id: string; name: string; grade: string }[]
  createdAt?: string
}
interface RawStudent {
  _id: string
  firstName: string
  lastName: string
  email?: string
  classId?: { _id: string; name?: string } | string | null
  profilePicture?: string
  createdAt?: string
}
interface RawClass {
  _id: string
  name: string
  grade: string
  teacherId?: { _id: string } | string | null
  studentCount?: number
}
interface RawSubject {
  _id: string
  name: string
  code: string
  teacherId?: { _id: string; userId?: { name?: string } } | string | null
}

interface FeeStudent { id: string; name: string }
interface FeeItemInput { item: string; amount: string; term: string }
interface RawFeeDoc {
  currency?: string
  dueDate?: string
  items?: { item: string; amount: number; term: string }[]
  paid?: number
}

// ─── Helpers & normalizers ─────────────────────────────────────────────────────

async function fetchJson(url: string) {
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed (${res.status})`)
  }
  return res.json()
}

const shortDate = (d?: string) => (d ? String(d).slice(0, 10) : "—")

function normalizeTeacher(t: RawTeacher): Teacher {
  return {
    id: String(t._id),
    name: t.userId?.name ?? "Unknown",
    email: t.userId?.email ?? "",
    classes: (t.classes ?? []).map((c) => c.name),
    joinedDate: shortDate(t.userId?.createdAt ?? t.createdAt),
  }
}

function normalizeStudent(s: RawStudent): Student {
  const cls = typeof s.classId === "object" && s.classId !== null ? s.classId : null
  return {
    id: String(s._id),
    firstName: s.firstName,
    lastName: s.lastName,
    email: s.email ?? "",
    classId: cls ? String(cls._id) : "",
    className: cls?.name ?? "Unassigned",
    joinedDate: shortDate(s.createdAt),
    profilePicture: s.profilePicture,
  }
}

function normalizeClass(c: RawClass, teacherName: (id: string) => string): Class {
  const tid = typeof c.teacherId === "object" && c.teacherId !== null ? String(c.teacherId._id) : (c.teacherId ? String(c.teacherId) : "")
  return {
    id: String(c._id),
    name: c.name,
    grade: c.grade,
    teacherId: tid,
    teacher: tid ? teacherName(tid) : "Unassigned",
    students: c.studentCount ?? 0,
  }
}

function normalizeSubject(s: RawSubject): Subject {
  const t = typeof s.teacherId === "object" && s.teacherId !== null ? s.teacherId : null
  return {
    id: String(s._id),
    name: s.name,
    code: s.code,
    teacherId: t ? String(t._id) : "",
    teacher: t?.userId?.name ?? "Unassigned",
  }
}

interface Parent {
  id: string
  name: string
  email: string
  students: { id: string; firstName: string; lastName: string }[]
  joinedDate: string
}

interface RawParent {
  _id: string
  userId: RawUser | null
  studentIds: { _id: string; firstName: string; lastName: string }[]
  createdAt?: string
}

function normalizeParent(p: RawParent): Parent {
  return {
    id: String(p._id),
    name: p.userId?.name ?? "Unknown",
    email: p.userId?.email ?? "",
    students: (p.studentIds ?? []).map((s) => ({ id: String(s._id), firstName: s.firstName, lastName: s.lastName })),
    joinedDate: shortDate(p.userId?.createdAt ?? p.createdAt),
  }
}

type Section = "overview" | "teachers" | "students" | "classes" | "subjects" | "fees" | "parents" | "messages"

// ─── Component ────────────────────────────────────────────────────────────────

export default function SchoolAdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<Section>("overview")
  const [search, setSearch] = useState("")

  // Modals
  const [showAddModal, setShowAddModal] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedItem, setSelectedItem] = useState<any>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)

  // Form state (shared add/edit) — flat string map plus avatar
  const [form, setForm] = useState<Record<string, string>>({})
  const [studentAvatar, setStudentAvatar] = useState("")
  const [editAvatar, setEditAvatar] = useState("")
  const [formSaving, setFormSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Data
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [classes, setClasses] = useState<Class[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  interface MessageItem {
    _id: string
    message: string
    regarding?: string
    status: "SENT" | "READ"
    reply?: string
    repliedAt?: string
    createdAt: string
    parentId?: { userId?: { name?: string; email?: string } }
  }
  const [parents, setParents] = useState<Parent[]>([])
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [replyText, setReplyText] = useState<Record<string, string>>({})
  const [replySending, setReplySending] = useState<Record<string, boolean>>({})
  const [dataLoading, setDataLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>, setter: (v: string) => void) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setter(typeof reader.result === "string" ? reader.result : "")
    reader.readAsDataURL(file)
  }

  useEffect(() => {
    if (status === "loading") return
    if (!session) { router.push("/auth/signin"); return }
    if (session.user.role !== "SCHOOL_ADMIN") { router.push("/"); return }
  }, [session, status, router])

  const loadData = useCallback(async () => {
    setDataLoading(true)
    setLoadError(null)
    try {
      const [tt, ss, cc, su, pp] = await Promise.all([
        fetchJson("/api/teachers"),
        fetchJson("/api/students"),
        fetchJson("/api/classes"),
        fetchJson("/api/subjects"),
        fetchJson("/api/parents"),
      ])
      const teacherDocs = (tt as RawTeacher[]).map(normalizeTeacher)
      const nameById = new Map(teacherDocs.map((t) => [t.id, t.name]))
      const teacherName = (id: string) => nameById.get(id) ?? "Unassigned"
      setTeachers(teacherDocs)
      setStudents((ss as RawStudent[]).map(normalizeStudent))
      setClasses((cc as RawClass[]).map((c) => normalizeClass(c, teacherName)))
      setSubjects((su as RawSubject[]).map(normalizeSubject))
      setParents((pp as RawParent[]).map(normalizeParent))
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load data")
    } finally {
      setDataLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === "authenticated" && session?.user.role === "SCHOOL_ADMIN") loadData()
  }, [status, session?.user.role, loadData])

  const stats = {
    totalTeachers: teachers.length,
    totalStudents: students.length,
    totalClasses: classes.length,
    totalSubjects: subjects.length,
  }

  // ── Fees (real API) ──
  const [feeStudents, setFeeStudents] = useState<FeeStudent[]>([])
  const [feeStudentId, setFeeStudentId] = useState("")
  const [feeForm, setFeeForm] = useState<{ currency: string; dueDate: string; items: FeeItemInput[]; paid: string }>({
    currency: "RWF", dueDate: "", items: [], paid: "0",
  })
  const [feeLoading, setFeeLoading] = useState(false)
  const [feeSaving, setFeeSaving] = useState(false)
  const [feeError, setFeeError] = useState<string | null>(null)
  const [feeSaved, setFeeSaved] = useState(false)
  const emptyFeeForm = { currency: "RWF", dueDate: "", items: [] as FeeItemInput[], paid: "0" }

  // Reuse the already-loaded students for the fee picker
  useEffect(() => {
    setFeeStudents(students.map((s) => ({ id: s.id, name: `${s.firstName} ${s.lastName}` })))
  }, [students])

  const selectFeeStudent = async (sid: string) => {
    setFeeStudentId(sid)
    setFeeSaved(false)
    setFeeError(null)
    if (!sid) { setFeeForm(emptyFeeForm); return }
    setFeeLoading(true)
    try {
      const res = await fetch(`/api/fees?studentId=${sid}`)
      const fee = res.ok ? ((await res.json()) as RawFeeDoc | null) : null
      setFeeForm(
        fee
          ? {
              currency: fee.currency ?? "RWF",
              dueDate: fee.dueDate ?? "",
              items: (fee.items ?? []).map((it) => ({ item: it.item, amount: String(it.amount), term: it.term })),
              paid: String(fee.paid ?? 0),
            }
          : emptyFeeForm
      )
    } catch {
      setFeeForm(emptyFeeForm)
    } finally {
      setFeeLoading(false)
    }
  }

  const saveFee = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!feeStudentId) { setFeeError("Select a student first"); return }
    setFeeSaving(true)
    setFeeError(null)
    setFeeSaved(false)
    try {
      const items = feeForm.items
        .filter((it) => it.item.trim())
        .map((it) => ({ item: it.item.trim(), amount: Number(it.amount) || 0, term: it.term.trim() }))
      const res = await fetch("/api/fees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: feeStudentId,
          currency: feeForm.currency.trim() || "RWF",
          dueDate: feeForm.dueDate || undefined,
          items,
          paid: Number(feeForm.paid) || 0,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Failed to save fees")
      }
      setFeeSaved(true)
    } catch (err) {
      setFeeError(err instanceof Error ? err.message : "Failed to save fees")
    } finally {
      setFeeSaving(false)
    }
  }

  const feeFormTotal = feeForm.items.reduce((a, it) => a + (Number(it.amount) || 0), 0)
  const feeFormPaid = Number(feeForm.paid) || 0
  const feeFormBalance = feeFormTotal - feeFormPaid

  // ── CRUD ──

  const openAdd = () => { setForm({}); setStudentAvatar(""); setFormError(null); setShowAddModal(true) }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openEdit = (item: any) => {
    setSelectedItem(item)
    setFormError(null)
    if (activeSection === "teachers") setForm({ name: item.name, email: item.email })
    else if (activeSection === "students") { setForm({ firstName: item.firstName, lastName: item.lastName, email: item.email || "", classId: item.classId || "" }); setEditAvatar(item.profilePicture || "") }
    else if (activeSection === "classes") setForm({ name: item.name, grade: item.grade, teacherId: item.teacherId || "" })
    else if (activeSection === "subjects") setForm({ name: item.name, code: item.code, teacherId: item.teacherId || "" })
    setShowEditModal(true)
  }

  const endpointFor = (s: Section) =>
    s === "teachers" ? "/api/teachers" : s === "students" ? "/api/students" : s === "classes" ? "/api/classes" : s === "parents" ? "/api/parents" : "/api/subjects"

  const buildBody = (s: Section, avatar: string) => {
    if (s === "teachers") return { name: form.name, email: form.email, password: form.password }
    if (s === "students") return { firstName: form.firstName, lastName: form.lastName, email: form.email || undefined, classId: form.classId || undefined, profilePicture: avatar || undefined }
    if (s === "classes") return { name: form.name, grade: form.grade, teacherId: form.teacherId || undefined }
    if (s === "parents") return { name: form.name, email: form.email, password: form.password, studentId: form.studentId || undefined }
    return { name: form.name, code: form.code, teacherId: form.teacherId || undefined }
  }

  const submitAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormSaving(true)
    setFormError(null)
    try {
      const res = await fetch(endpointFor(activeSection), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildBody(activeSection, studentAvatar)),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Failed to save")
      }
      setShowAddModal(false)
      await loadData()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setFormSaving(false)
    }
  }

  const submitEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem) return
    setFormSaving(true)
    setFormError(null)
    try {
      const res = await fetch(`${endpointFor(activeSection)}/${selectedItem.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildBody(activeSection, editAvatar)),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Failed to update")
      }
      setShowEditModal(false)
      await loadData()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to update")
    } finally {
      setFormSaving(false)
    }
  }

  const removeItem = async (section: Section, id: string, label: string) => {
    if (!confirm(`Remove ${label}? This cannot be undone.`)) return
    try {
      const res = await fetch(`${endpointFor(section)}/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Failed to delete")
      }
      await loadData()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete")
    }
  }

  const unreadCount = messages.filter((m) => m.status === "SENT").length

  const loadMessages = useCallback(async () => {
    setMessagesLoading(true)
    try {
      const data = await fetchJson("/api/comments")
      setMessages(Array.isArray(data) ? data : [])
    } catch {
      // silently fail — messages are non-critical
    } finally {
      setMessagesLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeSection === "messages" && status === "authenticated") loadMessages()
  }, [activeSection, status, loadMessages])

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/comments/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) })
      setMessages((prev) => prev.map((m) => m._id === id ? { ...m, status: "READ" } : m))
    } catch { /* ignore */ }
  }

  const sendReply = async (id: string) => {
    const reply = replyText[id]?.trim()
    if (!reply) return
    setReplySending((prev) => ({ ...prev, [id]: true }))
    try {
      const res = await fetch(`/api/comments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply }),
      })
      if (!res.ok) return
      const updated = await res.json()
      setMessages((prev) => prev.map((m) => m._id === id ? { ...m, ...updated } : m))
      setReplyText((prev) => ({ ...prev, [id]: "" }))
    } catch { /* ignore */ } finally {
      setReplySending((prev) => ({ ...prev, [id]: false }))
    }
  }

  const menuItems = [
    { id: "overview", label: "Overview", icon: ChartBarIcon },
    { id: "teachers", label: "Teachers", icon: UserGroupIcon },
    { id: "students", label: "Students", icon: AcademicCapIcon },
    { id: "classes", label: "Classes", icon: RectangleGroupIcon },
    { id: "subjects", label: "Subjects", icon: BookOpenIcon },
    { id: "fees", label: "Fees", icon: BanknotesIcon },
    { id: "parents", label: "Parents", icon: HomeModernIcon },
    { id: "messages", label: "Messages", icon: ChatBubbleLeftRightIcon, badge: unreadCount },
  ] as const

  const q = search.toLowerCase()
  const filteredTeachers = teachers.filter((t) => t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q))
  const filteredStudents = students.filter((s) => `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) || (s.email || "").toLowerCase().includes(q))
  const filteredClasses = classes.filter((c) => c.name.toLowerCase().includes(q) || c.grade.toLowerCase().includes(q))
  const filteredSubjects = subjects.filter((s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q))
  const filteredParents = parents.filter((p) => p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q))

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    )
  }

  const sectionNoun = activeSection === "teachers" ? "Teacher" : activeSection === "students" ? "Student" : activeSection === "classes" ? "Class" : activeSection === "parents" ? "Parent" : "Subject"

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-lg bg-green-600 flex items-center justify-center">
                <AcademicCapIcon className="h-5 w-5 text-white" />
              </div>
              <div className="ml-4">
                <h1 className="text-xl font-semibold text-gray-900">School Admin Portal</h1>
                <p className="text-sm text-gray-500">School Management Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <LanguageToggle />
              <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {session?.user?.name?.charAt(0) || "A"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <div className="fixed top-16 left-0 z-50 w-64 bg-green-600 shadow-lg h-[calc(100vh-4rem)]">
          <div className="flex h-full flex-col">
            <nav className="flex-1 px-4 py-4 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => { setActiveSection(item.id as Section); setSearch("") }}
                    className={`group flex w-full items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                      activeSection === item.id
                        ? "bg-white text-green-600"
                        : "text-white hover:bg-green-700"
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.label}
                    {"badge" in item && item.badge > 0 && (
                      <span className="ml-auto bg-white text-green-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </nav>
            <div className="p-4 border-t border-green-700">
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              </div>
            ) : loadError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
                <ExclamationTriangleIcon className="h-10 w-10 text-red-500 mx-auto mb-3" />
                <p className="text-sm font-medium text-red-800 mb-4">{loadError}</p>
                <button onClick={loadData} className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors">Retry</button>
              </div>
            ) : (
              <>

            {/* ── Overview ── */}
            {activeSection === "overview" && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900">School Overview</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: "Total Teachers", value: stats.totalTeachers, icon: UserGroupIcon, color: "text-blue-600" },
                    { label: "Total Students", value: stats.totalStudents, icon: AcademicCapIcon, color: "text-green-600" },
                    { label: "Total Classes", value: stats.totalClasses, icon: RectangleGroupIcon, color: "text-purple-600" },
                    { label: "Total Subjects", value: stats.totalSubjects, icon: BookOpenIcon, color: "text-orange-600" },
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

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Recent Students */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Recent Students</h4>
                    {students.length === 0 ? (
                      <p className="text-sm text-gray-400">No students yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {students.slice(0, 4).map((s) => (
                          <div key={s.id} className="flex items-center justify-between">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                <span className="text-xs font-medium text-green-600">{s.firstName.charAt(0)}</span>
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">{s.firstName} {s.lastName}</p>
                                <p className="text-xs text-gray-500">{s.className}</p>
                              </div>
                            </div>
                            <span className="text-xs text-gray-400">{s.joinedDate}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Classes Summary */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Classes Summary</h4>
                    {classes.length === 0 ? (
                      <p className="text-sm text-gray-400">No classes yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {classes.slice(0, 4).map((c) => (
                          <div key={c.id} className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{c.name}</p>
                              <p className="text-xs text-gray-500">{c.teacher}</p>
                            </div>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {c.students} students
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Teachers ── */}
            {activeSection === "teachers" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-gray-900">Teachers</h3>
                  <button onClick={openAdd} className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    <PlusIcon className="h-5 w-5 mr-2" /> Add Teacher
                  </button>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input type="text" placeholder="Search teachers..." value={search} onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Teacher</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Classes</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Joined</th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredTeachers.map((t) => (
                          <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                  <span className="text-sm font-medium text-green-600">{t.name.charAt(0)}</span>
                                </div>
                                <div className="ml-3">
                                  <p className="text-sm font-medium text-gray-900">{t.name}</p>
                                  <p className="text-xs text-gray-500">{t.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-1">
                                {t.classes.length ? t.classes.map((c) => (
                                  <span key={c} className="inline-flex px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">{c}</span>
                                )) : <span className="text-xs text-gray-400">None</span>}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">{t.joinedDate}</td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <button onClick={() => { setSelectedItem(t); setShowViewModal(true) }} className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors">View</button>
                                <button onClick={() => openEdit(t)} className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">Edit</button>
                                <button onClick={() => removeItem("teachers", t.id, t.name)} className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors">Remove</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredTeachers.length === 0 && (
                          <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-400">No teachers found.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── Students ── */}
            {activeSection === "students" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-gray-900">Students</h3>
                  <button onClick={openAdd} className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    <PlusIcon className="h-5 w-5 mr-2" /> Add Student
                  </button>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input type="text" placeholder="Search students..." value={search} onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Student</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Class</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Joined</th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredStudents.map((s) => (
                          <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full bg-green-100 bg-cover bg-center flex items-center justify-center overflow-hidden"
                                  style={s.profilePicture ? { backgroundImage: `url(${s.profilePicture})` } : undefined}>
                                  {!s.profilePicture && <span className="text-sm font-medium text-green-600">{s.firstName.charAt(0)}</span>}
                                </div>
                                <div className="ml-3">
                                  <p className="text-sm font-medium text-gray-900">{s.firstName} {s.lastName}</p>
                                  <p className="text-xs text-gray-500">{s.email || "No email"}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">{s.className}</span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">{s.joinedDate}</td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <button onClick={() => { setSelectedItem(s); setShowViewModal(true) }} className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors">View</button>
                                <button onClick={() => openEdit(s)} className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">Edit</button>
                                <button onClick={() => removeItem("students", s.id, `${s.firstName} ${s.lastName}`)} className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors">Remove</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredStudents.length === 0 && (
                          <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-400">No students found.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── Classes ── */}
            {activeSection === "classes" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-gray-900">Classes</h3>
                  <button onClick={openAdd} className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    <PlusIcon className="h-5 w-5 mr-2" /> Add Class
                  </button>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input type="text" placeholder="Search classes..." value={search} onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredClasses.map((c) => (
                    <div key={c.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">{c.name}</h4>
                          <p className="text-sm text-gray-500">Grade {c.grade}</p>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {c.students} students
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 mb-4">
                        <UserGroupIcon className="h-4 w-4 mr-2 text-gray-400" />
                        {c.teacher}
                      </div>
                      <div className="flex space-x-2 pt-4 border-t border-gray-100">
                        <button onClick={() => { setSelectedItem(c); setShowViewModal(true) }} className="flex-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors text-center">View</button>
                        <button onClick={() => openEdit(c)} className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors text-center">Edit</button>
                        <button onClick={() => removeItem("classes", c.id, c.name)} className="flex-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors text-center">Delete</button>
                      </div>
                    </div>
                  ))}
                  {filteredClasses.length === 0 && (
                    <p className="col-span-full text-center text-sm text-gray-400 py-8">No classes found.</p>
                  )}
                </div>
              </div>
            )}

            {/* ── Subjects ── */}
            {activeSection === "subjects" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-gray-900">Subjects</h3>
                  <button onClick={openAdd} className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    <PlusIcon className="h-5 w-5 mr-2" /> Add Subject
                  </button>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input type="text" placeholder="Search subjects..." value={search} onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Subject</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Code</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Teacher</th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredSubjects.map((s) => (
                          <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                                  <BookOpenIcon className="h-5 w-5 text-orange-600" />
                                </div>
                                <p className="ml-3 text-sm font-medium text-gray-900">{s.name}</p>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{s.code}</span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">{s.teacher}</td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <button onClick={() => { setSelectedItem(s); setShowViewModal(true) }} className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors">View</button>
                                <button onClick={() => openEdit(s)} className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">Edit</button>
                                <button onClick={() => removeItem("subjects", s.id, s.name)} className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors">Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredSubjects.length === 0 && (
                          <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-400">No subjects found.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── Parents ── */}
            {activeSection === "parents" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-gray-900">Parents</h3>
                  <button onClick={openAdd} className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    <PlusIcon className="h-5 w-5 mr-2" /> Add Parent
                  </button>
                </div>

                <div className="bg-white rounded-lg shadow p-4">
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input type="text" placeholder="Search parents..." value={search} onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50">
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Parent</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Linked Students</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Joined</th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredParents.map((p) => (
                          <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                  <span className="text-sm font-medium text-purple-600">{p.name.charAt(0)}</span>
                                </div>
                                <div className="ml-3">
                                  <p className="text-sm font-medium text-gray-900">{p.name}</p>
                                  <p className="text-xs text-gray-500">{p.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-wrap gap-1">
                                {p.students.length ? p.students.map((s) => (
                                  <span key={s.id} className="inline-flex px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800">{s.firstName} {s.lastName}</span>
                                )) : <span className="text-xs text-gray-400">None</span>}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">{p.joinedDate}</td>
                            <td className="px-6 py-4 text-right">
                              <button onClick={() => removeItem("parents", p.id, p.name)} className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors">Remove</button>
                            </td>
                          </tr>
                        ))}
                        {filteredParents.length === 0 && (
                          <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-400">No parents found.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── Messages ── */}
            {activeSection === "messages" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">Parent Messages</h3>
                    {unreadCount > 0 && (
                      <p className="text-sm text-gray-500 mt-0.5">{unreadCount} unread message{unreadCount > 1 ? "s" : ""}</p>
                    )}
                  </div>
                  <button onClick={loadMessages} className="text-sm text-green-600 hover:underline">Refresh</button>
                </div>

                {messagesLoading ? (
                  <div className="flex justify-center py-16">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 text-center py-16">
                    <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No messages from parents yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg) => {
                      const isUnread = msg.status === "SENT"
                      const parentName = msg.parentId?.userId?.name ?? "Unknown Parent"
                      const parentEmail = msg.parentId?.userId?.email ?? ""
                      return (
                        <div
                          key={msg._id}
                          className={`bg-white rounded-xl border p-5 transition-colors ${
                            isUnread ? "border-green-300 shadow-sm" : "border-gray-200"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start space-x-3 min-w-0">
                              <div className="h-9 w-9 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-semibold text-purple-600">{parentName.charAt(0)}</span>
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-sm font-semibold text-gray-900">{parentName}</p>
                                  {parentEmail && <p className="text-xs text-gray-400">{parentEmail}</p>}
                                  {isUnread && (
                                    <span className="text-xs font-semibold text-white bg-green-600 px-2 py-0.5 rounded-full">New</span>
                                  )}
                                </div>
                                {msg.regarding && (
                                  <p className="text-xs text-gray-500 mt-0.5">Re: {msg.regarding}</p>
                                )}
                                <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{msg.message}</p>
                                <p className="text-xs text-gray-400 mt-2">{new Date(msg.createdAt).toLocaleString()}</p>
                              </div>
                            </div>
                            {isUnread ? (
                              <button
                                onClick={() => markAsRead(msg._id)}
                                className="flex-shrink-0 inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                              >
                                <EnvelopeOpenIcon className="h-4 w-4 mr-1" />
                                Mark as read
                              </button>
                            ) : (
                              <span className="flex-shrink-0 text-xs text-gray-400 flex items-center gap-1">
                                <EnvelopeOpenIcon className="h-4 w-4" /> Read
                              </span>
                            )}
                          </div>

                          {/* Existing reply */}
                          {msg.reply && (
                            <div className="mt-3 ml-12 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
                              <p className="text-xs font-semibold text-green-700 mb-1">Your reply · {msg.repliedAt ? new Date(msg.repliedAt).toLocaleString() : ""}</p>
                              <p className="text-sm text-green-900 whitespace-pre-wrap">{msg.reply}</p>
                            </div>
                          )}

                          {/* Reply box */}
                          {!msg.reply && (
                            <div className="mt-3 ml-12 flex gap-2 items-end">
                              <textarea
                                rows={2}
                                value={replyText[msg._id] ?? ""}
                                onChange={(e) => setReplyText((prev) => ({ ...prev, [msg._id]: e.target.value }))}
                                placeholder="Write a reply to this parent…"
                                className="flex-1 text-sm rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                              />
                              <button
                                onClick={() => sendReply(msg._id)}
                                disabled={!replyText[msg._id]?.trim() || replySending[msg._id]}
                                className="flex-shrink-0 px-4 py-2 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {replySending[msg._id] ? "Sending…" : "Reply"}
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── Fees ── */}
            {activeSection === "fees" && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900">School Fees</h3>
                <p className="text-sm text-gray-500 -mt-3">Set each student&apos;s fee structure and record how much they have paid. Parents see this on their portal.</p>

                {feeError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">{feeError}</div>
                )}

                <div className="bg-white rounded-lg shadow p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                  <select value={feeStudentId} onChange={(e) => selectFeeStudent(e.target.value)} disabled={feeLoading}
                    className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option value="">{feeLoading ? "Loading…" : "Select a student…"}</option>
                    {feeStudents.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                  </select>
                </div>

                {feeStudentId && (
                  <form onSubmit={saveFee} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                        <input type="text" value={feeForm.currency} onChange={(e) => setFeeForm((f) => ({ ...f, currency: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                        <input type="date" value={feeForm.dueDate} onChange={(e) => setFeeForm((f) => ({ ...f, dueDate: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount Paid</label>
                        <input type="number" min="0" value={feeForm.paid} onChange={(e) => setFeeForm((f) => ({ ...f, paid: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">Fee Items</label>
                        <button type="button" onClick={() => setFeeForm((f) => ({ ...f, items: [...f.items, { item: "", amount: "", term: "" }] }))}
                          className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-md hover:bg-green-100 transition-colors">
                          <PlusIcon className="h-4 w-4 mr-1" /> Add Item
                        </button>
                      </div>
                      {feeForm.items.length === 0 ? (
                        <p className="text-sm text-gray-400 py-4 text-center border border-dashed border-gray-200 rounded-lg">No fee items yet. Add one to start.</p>
                      ) : (
                        <div className="space-y-2">
                          {feeForm.items.map((it, i) => (
                            <div key={i} className="grid grid-cols-12 gap-2 items-center">
                              <input type="text" value={it.item} onChange={(e) => setFeeForm((f) => ({ ...f, items: f.items.map((x, j) => j === i ? { ...x, item: e.target.value } : x) }))}
                                placeholder="Item (e.g. Tuition)" className="col-span-5 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                              <input type="text" value={it.term} onChange={(e) => setFeeForm((f) => ({ ...f, items: f.items.map((x, j) => j === i ? { ...x, term: e.target.value } : x) }))}
                                placeholder="Term" className="col-span-3 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                              <input type="number" min="0" value={it.amount} onChange={(e) => setFeeForm((f) => ({ ...f, items: f.items.map((x, j) => j === i ? { ...x, amount: e.target.value } : x) }))}
                                placeholder="Amount" className="col-span-3 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
                              <button type="button" onClick={() => setFeeForm((f) => ({ ...f, items: f.items.filter((_, j) => j !== i) }))}
                                className="col-span-1 flex justify-center text-gray-400 hover:text-red-600 transition-colors" aria-label="Remove item">
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-4 border-t border-gray-100 pt-4">
                      <div>
                        <p className="text-xs text-gray-500">Total Due</p>
                        <p className="text-lg font-semibold text-gray-900">{feeForm.currency} {feeFormTotal.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Paid</p>
                        <p className="text-lg font-semibold text-gray-900">{feeForm.currency} {feeFormPaid.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Balance</p>
                        <p className={`text-lg font-semibold ${feeFormBalance <= 0 ? "text-green-700" : "text-orange-700"}`}>
                          {feeForm.currency} {feeFormBalance.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                      <div className="text-sm">{feeSaved && <span className="text-green-600">Fees saved ✓</span>}</div>
                      <button type="submit" disabled={feeSaving}
                        className="px-6 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                        {feeSaving ? "Saving…" : "Save Fees"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

              </>
            )}

          </main>
        </div>
      </div>

      {/* ── Add Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-6 border w-11/12 md:w-1/2 shadow-lg rounded-lg bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Add {sectionNoun}</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="h-6 w-6" /></button>
            </div>

            <form className="space-y-4" onSubmit={submitAdd}>
              {(activeSection === "teachers" || activeSection === "parents") && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input type="text" required value={form.name || ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" placeholder={activeSection === "parents" ? "Jane Doe" : "Alice Johnson"} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input type="email" required value={form.email || ""} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" placeholder={activeSection === "parents" ? "parent@email.com" : "teacher@school.edu"} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                    <input type="password" required value={form.password || ""} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="••••••••" />
                  </div>
                  {activeSection === "parents" && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Link to Student <span className="text-gray-400 font-normal">(optional)</span></label>
                      <select value={form.studentId || ""} onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                        <option value="">Select student</option>
                        {students.map((s) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {activeSection === "students" && (
                <>
                  <div className="flex items-center space-x-4">
                    <div className="h-16 w-16 rounded-full bg-green-100 bg-cover bg-center flex items-center justify-center overflow-hidden"
                      style={studentAvatar ? { backgroundImage: `url(${studentAvatar})` } : undefined}>
                      {!studentAvatar && <AcademicCapIcon className="h-7 w-7 text-green-600" />}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture</label>
                      <input type="file" accept="image/*" onChange={(e) => handleAvatarChange(e, setStudentAvatar)} className="text-sm text-gray-600" />
                      {studentAvatar && <button type="button" onClick={() => setStudentAvatar("")} className="ml-2 text-xs text-red-600 hover:underline">Remove</button>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                      <input type="text" required value={form.firstName || ""} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Emma" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                      <input type="text" required value={form.lastName || ""} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Brown" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-gray-400 font-normal">(optional)</span></label>
                      <input type="email" value={form.email || ""} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Leave blank if none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Assign Class</label>
                      <select value={form.classId || ""} onChange={(e) => setForm((f) => ({ ...f, classId: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                        <option value="">Select class</option>
                        {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {activeSection === "classes" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Class Name *</label>
                    <input type="text" required value={form.name || ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Grade 10A" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grade *</label>
                    <input type="text" required value={form.grade || ""} onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="10" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign Teacher</label>
                    <select value={form.teacherId || ""} onChange={(e) => setForm((f) => ({ ...f, teacherId: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                      <option value="">Select teacher</option>
                      {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {activeSection === "subjects" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name *</label>
                    <input type="text" required value={form.name || ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Mathematics" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject Code *</label>
                    <input type="text" required value={form.code || ""} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="MATH101" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign Teacher</label>
                    <select value={form.teacherId || ""} onChange={(e) => setForm((f) => ({ ...f, teacherId: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                      <option value="">Select teacher</option>
                      {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {formError && <p className="text-sm text-red-600">{formError}</p>}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
                <button type="submit" disabled={formSaving} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">{formSaving ? "Saving…" : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── View Modal ── */}
      {showViewModal && selectedItem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-6 border w-11/12 md:w-1/2 shadow-lg rounded-lg bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Details</h3>
              <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="h-6 w-6" /></button>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 pb-4 border-b">
                <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                  <span className="text-2xl font-bold text-green-600">
                    {(selectedItem.name || selectedItem.firstName || selectedItem.code || "?").charAt(0)}
                  </span>
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-900">
                    {selectedItem.name || `${selectedItem.firstName} ${selectedItem.lastName}` || selectedItem.code}
                  </h4>
                  {selectedItem.email && <p className="text-gray-500 text-sm">{selectedItem.email}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {Object.entries(selectedItem)
                  .filter(([k]) => !["id", "profilePicture", "teacherId", "classId"].includes(k))
                  .map(([k, v]) => (
                    <div key={k}>
                      <label className="text-gray-500 capitalize">{k.replace(/([A-Z])/g, " $1")}</label>
                      <p className="text-gray-900 font-medium">{Array.isArray(v) ? (v as string[]).join(", ") || "—" : String(v)}</p>
                    </div>
                  ))}
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button onClick={() => setShowViewModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ── */}
      {showEditModal && selectedItem && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-6 border w-11/12 md:w-1/2 shadow-lg rounded-lg bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Edit {sectionNoun}</h3>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="h-6 w-6" /></button>
            </div>
            <form className="space-y-4" onSubmit={submitEdit}>
              {activeSection === "teachers" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input type="text" required value={form.name || ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                    <input type="email" required value={form.email || ""} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                </div>
              )}

              {activeSection === "subjects" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject Name *</label>
                    <input type="text" required value={form.name || ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject Code *</label>
                    <input type="text" required value={form.code || ""} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign Teacher</label>
                    <select value={form.teacherId || ""} onChange={(e) => setForm((f) => ({ ...f, teacherId: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                      <option value="">Unassigned</option>
                      {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {activeSection === "classes" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Class Name *</label>
                    <input type="text" required value={form.name || ""} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Grade *</label>
                    <input type="text" required value={form.grade || ""} onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign Teacher</label>
                    <select value={form.teacherId || ""} onChange={(e) => setForm((f) => ({ ...f, teacherId: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                      <option value="">Unassigned</option>
                      {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                </div>
              )}

              {activeSection === "students" && (
                <>
                  <div className="flex items-center space-x-4">
                    <div className="h-16 w-16 rounded-full bg-green-100 bg-cover bg-center flex items-center justify-center overflow-hidden"
                      style={editAvatar ? { backgroundImage: `url(${editAvatar})` } : undefined}>
                      {!editAvatar && <span className="text-xl font-bold text-green-600">{(form.firstName || "?").charAt(0)}</span>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture</label>
                      <input type="file" accept="image/*" onChange={(e) => handleAvatarChange(e, setEditAvatar)} className="text-sm text-gray-600" />
                      {editAvatar && <button type="button" onClick={() => setEditAvatar("")} className="ml-2 text-xs text-red-600 hover:underline">Remove</button>}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                      <input type="text" required value={form.firstName || ""} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                      <input type="text" required value={form.lastName || ""} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-gray-400 font-normal">(optional)</span></label>
                      <input type="email" value={form.email || ""} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="Leave blank if none" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Assign Class</label>
                      <select value={form.classId || ""} onChange={(e) => setForm((f) => ({ ...f, classId: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                        <option value="">Unassigned</option>
                        {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {formError && <p className="text-sm text-red-600">{formError}</p>}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setShowEditModal(false)} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
                <button type="submit" disabled={formSaving} className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">{formSaving ? "Saving…" : "Save Changes"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
