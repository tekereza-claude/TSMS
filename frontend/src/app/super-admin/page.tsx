"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState, useCallback } from "react"
import {
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  AcademicCapIcon,
  ArrowRightOnRectangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ChartBarIcon,
  CreditCardIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline"
import Link from "next/link"
import LanguageToggle from "@/components/LanguageToggle"

// ─── Types ─────────────────────────────────────────────────────────────────────

interface DashboardStats {
  totalSchools: number
  approvedSchools: number
  pendingSchools: number
  suspendedSchools: number
  totalStudents: number
  activeSubscriptions: number
  monthlyRevenue: number
  currency: string
}

interface SchoolRow {
  _id: string
  name: string
  email: string
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED"
  createdAt: string
  plan: "FREE" | "PAID"
  students: number
}

interface RevenuePoint { label: string; revenue: number }
interface GrowthPoint { label: string; registering: number }

interface OverviewResponse {
  stats: DashboardStats
  schools: SchoolRow[]
  revenue: { "7days": RevenuePoint[]; "30days": RevenuePoint[]; year: RevenuePoint[] }
  growth: GrowthPoint[]
}

type RangeKey = "7days" | "30days" | "year"

const STATUS_BADGE: Record<SchoolRow["status"], string> = {
  APPROVED: "bg-emerald-100 text-emerald-800",
  PENDING: "bg-amber-100 text-amber-800",
  REJECTED: "bg-gray-200 text-gray-700",
  SUSPENDED: "bg-red-100 text-red-800",
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SuperAdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeSection, setActiveSection] = useState("overview")
  const [revenueFilter, setRevenueFilter] = useState<RangeKey>("7days")

  const [data, setData] = useState<OverviewResponse | null>(null)
  const [dataLoading, setDataLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // School management
  const [showAddSchoolForm, setShowAddSchoolForm] = useState(false)
  const [selectedSchool, setSelectedSchool] = useState<SchoolRow | null>(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [addForm, setAddForm] = useState({ name: "", email: "", address: "", phone: "" })
  const [editForm, setEditForm] = useState({ name: "", email: "", address: "", phone: "", status: "PENDING" })
  const [actionBusy, setActionBusy] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => {
    if (status === "loading") return
    if (!session) { router.push("/auth/signin"); return }
    if (session.user.role !== "SUPER_ADMIN") { router.push("/"); return }
  }, [session, status, router])

  const loadData = useCallback(async () => {
    setDataLoading(true)
    setLoadError(null)
    try {
      const res = await fetch("/api/admin/overview")
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Request failed (${res.status})`)
      }
      setData((await res.json()) as OverviewResponse)
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Failed to load dashboard")
    } finally {
      setDataLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === "authenticated" && session?.user.role === "SUPER_ADMIN") loadData()
  }, [status, session?.user.role, loadData])

  const stats = data?.stats
  const currency = stats?.currency ?? "USD"
  const fmtMoney = (n: number) => `${currency === "USD" ? "$" : currency + " "}${n.toLocaleString()}`

  const currentRevenueData = data?.revenue[revenueFilter] ?? []
  const totalRevenue = currentRevenueData.reduce((sum, item) => sum + item.revenue, 0)
  const averageRevenue = currentRevenueData.length ? totalRevenue / currentRevenueData.length : 0
  const growthData = data?.growth ?? []

  // ── School actions ──
  const submitAddSchool = async (e: React.FormEvent) => {
    e.preventDefault()
    setActionBusy(true)
    setActionError(null)
    try {
      const res = await fetch("/api/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addForm.name,
          email: addForm.email,
          address: addForm.address || undefined,
          phone: addForm.phone || undefined,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Failed to register school")
      }
      setShowAddSchoolForm(false)
      setAddForm({ name: "", email: "", address: "", phone: "" })
      await loadData()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to register school")
    } finally {
      setActionBusy(false)
    }
  }

  const patchSchool = async (id: string, body: Record<string, unknown>) => {
    setActionBusy(true)
    setActionError(null)
    try {
      const res = await fetch(`/api/schools/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const resp = await res.json().catch(() => ({}))
        throw new Error(resp.error || "Update failed")
      }
      setShowEditModal(false)
      await loadData()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Update failed")
    } finally {
      setActionBusy(false)
    }
  }

  const changeStatus = (s: SchoolRow, status: SchoolRow["status"]) => patchSchool(s._id, { status })

  const openEditSchool = (s: SchoolRow) => {
    setSelectedSchool(s)
    setEditForm({ name: s.name, email: s.email, address: "", phone: "", status: s.status })
    setActionError(null)
    setShowEditModal(true)
  }

  const handleSignOut = () => signOut({ callbackUrl: "/" })

  const menuItems = [
    { id: "overview", label: "Main Overview", icon: ChartBarIcon, href: "#overview" },
    { id: "revenue", label: "Revenue Analytics", icon: CurrencyDollarIcon, href: "#revenue" },
    { id: "schools", label: "School Management", icon: BuildingOfficeIcon, href: "#schools" },
  ]

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const RangeButtons = () => (
    <div className="flex items-center space-x-2">
      {(["7days", "30days", "year"] as RangeKey[]).map((r) => (
        <button key={r} onClick={() => setRevenueFilter(r)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${revenueFilter === r ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
          {r === "7days" ? "7 Days" : r === "30days" ? "30 Days" : "Year"}
        </button>
      ))}
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <BuildingOfficeIcon className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-xl font-semibold text-gray-900">TSMS Super Admin</h1>
                <p className="text-sm text-gray-500">Platform Management Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageToggle />
              <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                <span className="text-white text-sm font-medium">{session?.user?.name?.charAt(0) || "A"}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <div className="fixed top-16 left-0 z-50 w-64 bg-blue-600 shadow-lg h-[calc(100vh-4rem)]">
          <div className="flex h-full flex-col">
            <nav className="flex-1 px-4 py-4 space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link key={item.id} href={item.href} onClick={() => setActiveSection(item.id)}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeSection === item.id ? "bg-white text-blue-600" : "text-white hover:bg-blue-700 hover:text-white"}`}>
                    <Icon className="mr-3 h-5 w-5" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
            <div className="p-4 border-t border-blue-700">
              <button onClick={handleSignOut} className="flex w-full items-center px-3 py-2 text-sm font-medium text-white rounded-lg hover:bg-red-500 hover:text-white transition-colors">
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : loadError ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
                <ExclamationTriangleIcon className="h-10 w-10 text-red-500 mx-auto mb-3" />
                <p className="text-sm font-medium text-red-800 mb-4">{loadError}</p>
                <button onClick={loadData} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">Retry</button>
              </div>
            ) : (
            <>

            {/* ── Main Overview ── */}
            {activeSection === "overview" && stats && (
              <div className="space-y-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Platform Overview</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {[
                    { label: "Total Schools", value: stats.totalSchools.toLocaleString(), icon: BuildingOfficeIcon, color: "text-blue-600" },
                    { label: "Approved Schools", value: stats.approvedSchools.toLocaleString(), icon: CheckCircleIcon, color: "text-green-600" },
                    { label: "Pending Approval", value: stats.pendingSchools.toLocaleString(), icon: ClockIcon, color: "text-yellow-600" },
                    { label: "Total Students", value: stats.totalStudents.toLocaleString(), icon: AcademicCapIcon, color: "text-purple-600" },
                    { label: "Active Subscriptions", value: stats.activeSubscriptions.toLocaleString(), icon: CreditCardIcon, color: "text-indigo-600" },
                    { label: "Monthly Revenue", value: fmtMoney(stats.monthlyRevenue), icon: CurrencyDollarIcon, color: "text-green-600" },
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

                {/* New school registrations (this year) */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-6">New School Registrations — This Year</h4>
                  <div className="relative h-80">
                    <div className="absolute bottom-8 left-0 right-0 h-px bg-gray-300"></div>
                    <div className="absolute inset-0 px-2 pb-8">
                      <div className="relative h-full flex items-end justify-between">
                        {growthData.map((item, index) => {
                          const maxValue = Math.max(1, ...growthData.map((d) => d.registering))
                          const h = (item.registering / maxValue) * 240
                          return (
                            <div key={index} className="flex-1 flex flex-col items-center justify-end relative group">
                              <div className="bg-blue-600 hover:bg-blue-700 transition-colors rounded-t w-6" style={{ height: `${h}px` }}>
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                  {item.registering}
                                </div>
                              </div>
                              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-gray-600">{item.label}</div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Revenue Analytics ── */}
            {activeSection === "revenue" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-gray-900">Revenue Analytics</h3>
                  <RangeButtons />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                        <p className="text-2xl font-semibold text-gray-900">{fmtMoney(totalRevenue)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <ChartBarIcon className="h-8 w-8 text-blue-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Average {revenueFilter === "7days" ? "Daily" : revenueFilter === "30days" ? "Weekly" : "Monthly"}</p>
                        <p className="text-2xl font-semibold text-gray-900">{fmtMoney(Math.round(averageRevenue))}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                      <ArrowTrendingUpIcon className="h-8 w-8 text-purple-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
                        <p className="text-2xl font-semibold text-gray-900">{stats?.activeSubscriptions ?? 0}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Revenue Chart */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-6">
                    Revenue {revenueFilter === "7days" ? "Last 7 Days" : revenueFilter === "30days" ? "Last 30 Days" : "This Year"}
                  </h4>
                  <div className="relative h-80">
                    <div className="absolute inset-0 flex items-end justify-between px-2">
                      {currentRevenueData.map((item, index) => {
                        const maxValue = Math.max(1, ...currentRevenueData.map((d) => d.revenue))
                        const h = (item.revenue / maxValue) * 240
                        return (
                          <div key={index} className="flex-1 flex flex-col items-center group">
                            <div className="w-full max-w-[60px] relative">
                              <div className="bg-blue-600 hover:bg-blue-700 transition-colors rounded-t" style={{ height: `${Math.max(h, 4)}px` }}>
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                  {fmtMoney(item.revenue)}
                                </div>
                              </div>
                            </div>
                            <div className="mt-2 text-xs text-gray-600 text-center">{item.label}</div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Revenue Details Table */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h4 className="text-lg font-medium text-gray-900">Revenue Details</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {revenueFilter === "7days" ? "Day" : revenueFilter === "30days" ? "Week" : "Month"}
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Change</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {currentRevenueData.map((item, index) => {
                          const previousRevenue = index > 0 ? currentRevenueData[index - 1].revenue : item.revenue
                          const change = previousRevenue ? ((item.revenue - previousRevenue) / previousRevenue) * 100 : 0
                          return (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.label}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{fmtMoney(item.revenue)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${change > 0 ? "bg-green-100 text-green-800" : change < 0 ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}`}>
                                  {change > 0 ? "+" : ""}{change.toFixed(1)}%
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${item.revenue >= averageRevenue ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                                  {item.revenue >= averageRevenue ? "Above Average" : "Below Average"}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                        {currentRevenueData.length === 0 && (
                          <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-400">No revenue recorded for this period.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ── School Management ── */}
            {activeSection === "schools" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-gray-900">School Management</h3>
                  <button onClick={() => { setShowAddSchoolForm(!showAddSchoolForm); setActionError(null) }}
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add New School
                  </button>
                </div>

                {actionError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">{actionError}</div>
                )}

                {/* Add School Form */}
                {showAddSchoolForm && (
                  <div className="bg-white rounded-lg shadow p-6 border border-blue-200">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="text-lg font-semibold text-gray-900">Register New School</h4>
                      <button onClick={() => setShowAddSchoolForm(false)} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="w-6 h-6" /></button>
                    </div>
                    <form className="space-y-6" onSubmit={submitAddSchool}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">School Name *</label>
                          <input type="text" required value={addForm.name} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Enter school name" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">School Email *</label>
                          <input type="email" required value={addForm.email} onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="admin@school.edu" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                          <input type="tel" value={addForm.phone} onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="+250 7…" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                          <input type="text" value={addForm.address} onChange={(e) => setAddForm((f) => ({ ...f, address: e.target.value }))}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="District, Sector" />
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">New schools are created with <span className="font-medium">PENDING</span> status and can be approved from the table below.</p>
                      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <button type="button" onClick={() => setShowAddSchoolForm(false)} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
                        <button type="submit" disabled={actionBusy} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">{actionBusy ? "Saving…" : "Register School"}</button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Schools Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <h2 className="text-lg font-semibold text-gray-900">All Schools ({data?.schools.length ?? 0})</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50/50">
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">School</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Students</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Plan</th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(data?.schools ?? []).map((school) => (
                          <tr key={school._id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  <span className="text-sm font-medium text-blue-600">{school.name.charAt(0)}</span>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{school.name}</div>
                                  <div className="text-sm text-gray-500">{school.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[school.status]}`}>{school.status}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900 font-medium">{school.students.toLocaleString()}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${school.plan === "PAID" ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"}`}>{school.plan}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex items-center justify-end space-x-2">
                                <button onClick={() => { setSelectedSchool(school); setShowViewModal(true) }} className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors">View</button>
                                <button onClick={() => openEditSchool(school)} className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">Edit</button>
                                {school.status === "PENDING" && (
                                  <>
                                    <button disabled={actionBusy} onClick={() => changeStatus(school, "APPROVED")} className="px-3 py-1 text-xs font-medium text-green-600 bg-green-50 rounded-md hover:bg-green-100 transition-colors disabled:opacity-50">Approve</button>
                                    <button disabled={actionBusy} onClick={() => changeStatus(school, "REJECTED")} className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50">Reject</button>
                                  </>
                                )}
                                {school.status === "APPROVED" && (
                                  <button disabled={actionBusy} onClick={() => changeStatus(school, "SUSPENDED")} className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors disabled:opacity-50">Suspend</button>
                                )}
                                {(school.status === "SUSPENDED" || school.status === "REJECTED") && (
                                  <button disabled={actionBusy} onClick={() => changeStatus(school, "APPROVED")} className="px-3 py-1 text-xs font-medium text-green-600 bg-green-50 rounded-md hover:bg-green-100 transition-colors disabled:opacity-50">Reactivate</button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                        {(data?.schools.length ?? 0) === 0 && (
                          <tr><td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-400">No schools registered yet.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* View School Modal */}
                {showViewModal && selectedSchool && (
                  <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-lg bg-white">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">School Details</h3>
                        <button onClick={() => setShowViewModal(false)} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="w-6 h-6" /></button>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4 pb-4 border-b">
                          <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-2xl font-bold text-blue-600">{selectedSchool.name.charAt(0)}</span>
                          </div>
                          <div>
                            <h4 className="text-xl font-semibold text-gray-900">{selectedSchool.name}</h4>
                            <p className="text-gray-600">{selectedSchool.email}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-500">Status</label>
                            <p className="mt-1"><span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${STATUS_BADGE[selectedSchool.status]}`}>{selectedSchool.status}</span></p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Students</label>
                            <p className="mt-1 text-sm text-gray-900">{selectedSchool.students.toLocaleString()}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Subscription Plan</label>
                            <p className="mt-1"><span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${selectedSchool.plan === "PAID" ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-800"}`}>{selectedSchool.plan}</span></p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Registered</label>
                            <p className="mt-1 text-sm text-gray-900">{String(selectedSchool.createdAt).slice(0, 10)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-6 flex justify-end">
                        <button onClick={() => setShowViewModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">Close</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Edit School Modal */}
                {showEditModal && selectedSchool && (
                  <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-lg bg-white">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Edit School</h3>
                        <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="w-6 h-6" /></button>
                      </div>
                      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); patchSchool(selectedSchool._id, { name: editForm.name, email: editForm.email, address: editForm.address || undefined, phone: editForm.phone || undefined, status: editForm.status }) }}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                            <input type="text" value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input type="email" value={editForm.email} onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select value={editForm.status} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                              <option value="APPROVED">Approved</option>
                              <option value="PENDING">Pending</option>
                              <option value="SUSPENDED">Suspended</option>
                              <option value="REJECTED">Rejected</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <input type="tel" value={editForm.phone} onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))} placeholder="Leave blank to keep" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                            <input type="text" value={editForm.address} onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))} placeholder="Leave blank to keep" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                        </div>
                        {actionError && <p className="text-sm text-red-600">{actionError}</p>}
                        <div className="flex justify-end space-x-3 pt-4 border-t">
                          <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
                          <button type="submit" disabled={actionBusy} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">{actionBusy ? "Saving…" : "Save Changes"}</button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            </>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
