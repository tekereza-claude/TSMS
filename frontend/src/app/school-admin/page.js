"use client";
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SchoolAdminDashboard;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("next-auth/react");
const navigation_1 = require("next/navigation");
const react_2 = require("react");
const outline_1 = require("@heroicons/react/24/outline");
const LanguageToggle_1 = __importDefault(require("@/components/LanguageToggle"));
// ─── Helpers & normalizers ─────────────────────────────────────────────────────
async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
    }
    return res.json();
}
const shortDate = (d) => (d ? String(d).slice(0, 10) : "—");
function normalizeTeacher(t) {
    return {
        id: String(t._id),
        name: t.userId?.name ?? "Unknown",
        email: t.userId?.email ?? "",
        classes: (t.classes ?? []).map((c) => c.name),
        joinedDate: shortDate(t.userId?.createdAt ?? t.createdAt),
    };
}
function normalizeStudent(s) {
    const cls = typeof s.classId === "object" && s.classId !== null ? s.classId : null;
    return {
        id: String(s._id),
        firstName: s.firstName,
        lastName: s.lastName,
        email: s.email ?? "",
        classId: cls ? String(cls._id) : "",
        className: cls?.name ?? "Unassigned",
        joinedDate: shortDate(s.createdAt),
        profilePicture: s.profilePicture,
    };
}
function normalizeClass(c, teacherName) {
    const tid = typeof c.teacherId === "object" && c.teacherId !== null ? String(c.teacherId._id) : (c.teacherId ? String(c.teacherId) : "");
    return {
        id: String(c._id),
        name: c.name,
        grade: c.grade,
        teacherId: tid,
        teacher: tid ? teacherName(tid) : "Unassigned",
        students: c.studentCount ?? 0,
    };
}
function normalizeSubject(s) {
    const t = typeof s.teacherId === "object" && s.teacherId !== null ? s.teacherId : null;
    return {
        id: String(s._id),
        name: s.name,
        code: s.code,
        teacherId: t ? String(t._id) : "",
        teacher: t?.userId?.name ?? "Unassigned",
    };
}
// ─── Component ────────────────────────────────────────────────────────────────
function SchoolAdminDashboard() {
    const { data: session, status } = (0, react_1.useSession)();
    const router = (0, navigation_1.useRouter)();
    const [activeSection, setActiveSection] = (0, react_2.useState)("overview");
    const [search, setSearch] = (0, react_2.useState)("");
    // Modals
    const [showAddModal, setShowAddModal] = (0, react_2.useState)(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [selectedItem, setSelectedItem] = (0, react_2.useState)(null);
    const [showViewModal, setShowViewModal] = (0, react_2.useState)(false);
    const [showEditModal, setShowEditModal] = (0, react_2.useState)(false);
    // Form state (shared add/edit) — flat string map plus avatar
    const [form, setForm] = (0, react_2.useState)({});
    const [studentAvatar, setStudentAvatar] = (0, react_2.useState)("");
    const [editAvatar, setEditAvatar] = (0, react_2.useState)("");
    const [formSaving, setFormSaving] = (0, react_2.useState)(false);
    const [formError, setFormError] = (0, react_2.useState)(null);
    // Data
    const [teachers, setTeachers] = (0, react_2.useState)([]);
    const [students, setStudents] = (0, react_2.useState)([]);
    const [classes, setClasses] = (0, react_2.useState)([]);
    const [subjects, setSubjects] = (0, react_2.useState)([]);
    const [dataLoading, setDataLoading] = (0, react_2.useState)(true);
    const [loadError, setLoadError] = (0, react_2.useState)(null);
    const handleAvatarChange = (e, setter) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        const reader = new FileReader();
        reader.onload = () => setter(typeof reader.result === "string" ? reader.result : "");
        reader.readAsDataURL(file);
    };
    (0, react_2.useEffect)(() => {
        if (status === "loading")
            return;
        if (!session) {
            router.push("/auth/signin");
            return;
        }
        if (session.user.role !== "SCHOOL_ADMIN") {
            router.push("/");
            return;
        }
    }, [session, status, router]);
    const loadData = (0, react_2.useCallback)(async () => {
        setDataLoading(true);
        setLoadError(null);
        try {
            const [tt, ss, cc, su] = await Promise.all([
                fetchJson("/api/teachers"),
                fetchJson("/api/students"),
                fetchJson("/api/classes"),
                fetchJson("/api/subjects"),
            ]);
            const teacherDocs = tt.map(normalizeTeacher);
            const nameById = new Map(teacherDocs.map((t) => [t.id, t.name]));
            const teacherName = (id) => nameById.get(id) ?? "Unassigned";
            setTeachers(teacherDocs);
            setStudents(ss.map(normalizeStudent));
            setClasses(cc.map((c) => normalizeClass(c, teacherName)));
            setSubjects(su.map(normalizeSubject));
        }
        catch (e) {
            setLoadError(e instanceof Error ? e.message : "Failed to load data");
        }
        finally {
            setDataLoading(false);
        }
    }, []);
    (0, react_2.useEffect)(() => {
        if (status === "authenticated" && session?.user.role === "SCHOOL_ADMIN")
            loadData();
    }, [status, session?.user.role, loadData]);
    const stats = {
        totalTeachers: teachers.length,
        totalStudents: students.length,
        totalClasses: classes.length,
        totalSubjects: subjects.length,
    };
    // ── Fees (real API) ──
    const [feeStudents, setFeeStudents] = (0, react_2.useState)([]);
    const [feeStudentId, setFeeStudentId] = (0, react_2.useState)("");
    const [feeForm, setFeeForm] = (0, react_2.useState)({
        currency: "RWF", dueDate: "", items: [], paid: "0",
    });
    const [feeLoading, setFeeLoading] = (0, react_2.useState)(false);
    const [feeSaving, setFeeSaving] = (0, react_2.useState)(false);
    const [feeError, setFeeError] = (0, react_2.useState)(null);
    const [feeSaved, setFeeSaved] = (0, react_2.useState)(false);
    const emptyFeeForm = { currency: "RWF", dueDate: "", items: [], paid: "0" };
    // Reuse the already-loaded students for the fee picker
    (0, react_2.useEffect)(() => {
        setFeeStudents(students.map((s) => ({ id: s.id, name: `${s.firstName} ${s.lastName}` })));
    }, [students]);
    const selectFeeStudent = async (sid) => {
        setFeeStudentId(sid);
        setFeeSaved(false);
        setFeeError(null);
        if (!sid) {
            setFeeForm(emptyFeeForm);
            return;
        }
        setFeeLoading(true);
        try {
            const res = await fetch(`/api/fees?studentId=${sid}`);
            const fee = res.ok ? (await res.json()) : null;
            setFeeForm(fee
                ? {
                    currency: fee.currency ?? "RWF",
                    dueDate: fee.dueDate ?? "",
                    items: (fee.items ?? []).map((it) => ({ item: it.item, amount: String(it.amount), term: it.term })),
                    paid: String(fee.paid ?? 0),
                }
                : emptyFeeForm);
        }
        catch {
            setFeeForm(emptyFeeForm);
        }
        finally {
            setFeeLoading(false);
        }
    };
    const saveFee = async (e) => {
        e.preventDefault();
        if (!feeStudentId) {
            setFeeError("Select a student first");
            return;
        }
        setFeeSaving(true);
        setFeeError(null);
        setFeeSaved(false);
        try {
            const items = feeForm.items
                .filter((it) => it.item.trim())
                .map((it) => ({ item: it.item.trim(), amount: Number(it.amount) || 0, term: it.term.trim() }));
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
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || "Failed to save fees");
            }
            setFeeSaved(true);
        }
        catch (err) {
            setFeeError(err instanceof Error ? err.message : "Failed to save fees");
        }
        finally {
            setFeeSaving(false);
        }
    };
    const feeFormTotal = feeForm.items.reduce((a, it) => a + (Number(it.amount) || 0), 0);
    const feeFormPaid = Number(feeForm.paid) || 0;
    const feeFormBalance = feeFormTotal - feeFormPaid;
    // ── CRUD ──
    const openAdd = () => { setForm({}); setStudentAvatar(""); setFormError(null); setShowAddModal(true); };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const openEdit = (item) => {
        setSelectedItem(item);
        setFormError(null);
        if (activeSection === "teachers")
            setForm({ name: item.name, email: item.email });
        else if (activeSection === "students") {
            setForm({ firstName: item.firstName, lastName: item.lastName, email: item.email || "", classId: item.classId || "" });
            setEditAvatar(item.profilePicture || "");
        }
        else if (activeSection === "classes")
            setForm({ name: item.name, grade: item.grade, teacherId: item.teacherId || "" });
        else if (activeSection === "subjects")
            setForm({ name: item.name, code: item.code, teacherId: item.teacherId || "" });
        setShowEditModal(true);
    };
    const endpointFor = (s) => s === "teachers" ? "/api/teachers" : s === "students" ? "/api/students" : s === "classes" ? "/api/classes" : "/api/subjects";
    const buildBody = (s, avatar) => {
        if (s === "teachers")
            return { name: form.name, email: form.email, password: form.password };
        if (s === "students")
            return { firstName: form.firstName, lastName: form.lastName, email: form.email || undefined, classId: form.classId || undefined, profilePicture: avatar || undefined };
        if (s === "classes")
            return { name: form.name, grade: form.grade, teacherId: form.teacherId || undefined };
        return { name: form.name, code: form.code, teacherId: form.teacherId || undefined };
    };
    const submitAdd = async (e) => {
        e.preventDefault();
        setFormSaving(true);
        setFormError(null);
        try {
            const res = await fetch(endpointFor(activeSection), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(buildBody(activeSection, studentAvatar)),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || "Failed to save");
            }
            setShowAddModal(false);
            await loadData();
        }
        catch (err) {
            setFormError(err instanceof Error ? err.message : "Failed to save");
        }
        finally {
            setFormSaving(false);
        }
    };
    const submitEdit = async (e) => {
        e.preventDefault();
        if (!selectedItem)
            return;
        setFormSaving(true);
        setFormError(null);
        try {
            const res = await fetch(`${endpointFor(activeSection)}/${selectedItem.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(buildBody(activeSection, editAvatar)),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || "Failed to update");
            }
            setShowEditModal(false);
            await loadData();
        }
        catch (err) {
            setFormError(err instanceof Error ? err.message : "Failed to update");
        }
        finally {
            setFormSaving(false);
        }
    };
    const removeItem = async (section, id, label) => {
        if (!confirm(`Remove ${label}? This cannot be undone.`))
            return;
        try {
            const res = await fetch(`${endpointFor(section)}/${id}`, { method: "DELETE" });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || "Failed to delete");
            }
            await loadData();
        }
        catch (err) {
            alert(err instanceof Error ? err.message : "Failed to delete");
        }
    };
    const menuItems = [
        { id: "overview", label: "Overview", icon: outline_1.ChartBarIcon },
        { id: "teachers", label: "Teachers", icon: outline_1.UserGroupIcon },
        { id: "students", label: "Students", icon: outline_1.AcademicCapIcon },
        { id: "classes", label: "Classes", icon: outline_1.RectangleGroupIcon },
        { id: "subjects", label: "Subjects", icon: outline_1.BookOpenIcon },
        { id: "fees", label: "Fees", icon: outline_1.BanknotesIcon },
    ];
    const q = search.toLowerCase();
    const filteredTeachers = teachers.filter((t) => t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q));
    const filteredStudents = students.filter((s) => `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) || (s.email || "").toLowerCase().includes(q));
    const filteredClasses = classes.filter((c) => c.name.toLowerCase().includes(q) || c.grade.toLowerCase().includes(q));
    const filteredSubjects = subjects.filter((s) => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q));
    if (status === "loading") {
        return ((0, jsx_runtime_1.jsx)("div", { className: "min-h-screen flex items-center justify-center", children: (0, jsx_runtime_1.jsx)("div", { className: "animate-spin rounded-full h-32 w-32 border-b-2 border-green-600" }) }));
    }
    const sectionNoun = activeSection === "teachers" ? "Teacher" : activeSection === "students" ? "Student" : activeSection === "classes" ? "Class" : "Subject";
    return ((0, jsx_runtime_1.jsxs)("div", { className: "min-h-screen bg-gray-50", children: [(0, jsx_runtime_1.jsx)("header", { className: "bg-white shadow-sm border-b", children: (0, jsx_runtime_1.jsx)("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-center h-16", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center", children: [(0, jsx_runtime_1.jsx)("div", { className: "h-8 w-8 rounded-lg bg-green-600 flex items-center justify-center", children: (0, jsx_runtime_1.jsx)(outline_1.AcademicCapIcon, { className: "h-5 w-5 text-white" }) }), (0, jsx_runtime_1.jsxs)("div", { className: "ml-4", children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-xl font-semibold text-gray-900", children: "School Admin Portal" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-500", children: "School Management Dashboard" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-3", children: [(0, jsx_runtime_1.jsx)(LanguageToggle_1.default, {}), (0, jsx_runtime_1.jsx)("div", { className: "h-10 w-10 rounded-full bg-green-600 flex items-center justify-center", children: (0, jsx_runtime_1.jsx)("span", { className: "text-white text-sm font-medium", children: session?.user?.name?.charAt(0) || "A" }) })] })] }) }) }), (0, jsx_runtime_1.jsxs)("div", { className: "flex", children: [(0, jsx_runtime_1.jsx)("div", { className: "fixed top-16 left-0 z-50 w-64 bg-green-600 shadow-lg h-[calc(100vh-4rem)]", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex h-full flex-col", children: [(0, jsx_runtime_1.jsx)("nav", { className: "flex-1 px-4 py-4 space-y-2", children: menuItems.map((item) => {
                                        const Icon = item.icon;
                                        return ((0, jsx_runtime_1.jsxs)("button", { onClick: () => { setActiveSection(item.id); setSearch(""); }, className: `group flex w-full items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeSection === item.id
                                                ? "bg-white text-green-600"
                                                : "text-white hover:bg-green-700"}`, children: [(0, jsx_runtime_1.jsx)(Icon, { className: "mr-3 h-5 w-5" }), item.label] }, item.id));
                                    }) }), (0, jsx_runtime_1.jsx)("div", { className: "p-4 border-t border-green-700", children: (0, jsx_runtime_1.jsxs)("button", { onClick: () => (0, react_1.signOut)({ callbackUrl: "/" }), className: "flex w-full items-center px-3 py-2 text-sm font-medium text-white rounded-lg hover:bg-red-500 transition-colors", children: [(0, jsx_runtime_1.jsx)(outline_1.ArrowRightOnRectangleIcon, { className: "mr-3 h-5 w-5" }), "Sign Out"] }) })] }) }), (0, jsx_runtime_1.jsx)("div", { className: "pl-64 flex-1", children: (0, jsx_runtime_1.jsx)("main", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: dataLoading ? ((0, jsx_runtime_1.jsx)("div", { className: "flex items-center justify-center py-32", children: (0, jsx_runtime_1.jsx)("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-green-600" }) })) : loadError ? ((0, jsx_runtime_1.jsxs)("div", { className: "bg-red-50 border border-red-200 rounded-lg p-8 text-center", children: [(0, jsx_runtime_1.jsx)(outline_1.ExclamationTriangleIcon, { className: "h-10 w-10 text-red-500 mx-auto mb-3" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm font-medium text-red-800 mb-4", children: loadError }), (0, jsx_runtime_1.jsx)("button", { onClick: loadData, className: "px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors", children: "Retry" })] })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [activeSection === "overview" && ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-2xl font-bold text-gray-900", children: "School Overview" }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: [
                                                    { label: "Total Teachers", value: stats.totalTeachers, icon: outline_1.UserGroupIcon, color: "text-blue-600" },
                                                    { label: "Total Students", value: stats.totalStudents, icon: outline_1.AcademicCapIcon, color: "text-green-600" },
                                                    { label: "Total Classes", value: stats.totalClasses, icon: outline_1.RectangleGroupIcon, color: "text-purple-600" },
                                                    { label: "Total Subjects", value: stats.totalSubjects, icon: outline_1.BookOpenIcon, color: "text-orange-600" },
                                                ].map((card) => {
                                                    const Icon = card.icon;
                                                    return ((0, jsx_runtime_1.jsx)("div", { className: "bg-white rounded-lg shadow p-6", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center", children: [(0, jsx_runtime_1.jsx)(Icon, { className: `h-8 w-8 ${card.color}` }), (0, jsx_runtime_1.jsxs)("div", { className: "ml-4", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-medium text-gray-600", children: card.label }), (0, jsx_runtime_1.jsx)("p", { className: "text-2xl font-semibold text-gray-900", children: card.value })] })] }) }, card.label));
                                                }) }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "bg-white rounded-lg shadow p-6", children: [(0, jsx_runtime_1.jsx)("h4", { className: "text-lg font-medium text-gray-900 mb-4", children: "Recent Students" }), students.length === 0 ? ((0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-400", children: "No students yet." })) : ((0, jsx_runtime_1.jsx)("div", { className: "space-y-3", children: students.slice(0, 4).map((s) => ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center", children: [(0, jsx_runtime_1.jsx)("div", { className: "h-8 w-8 rounded-full bg-green-100 flex items-center justify-center", children: (0, jsx_runtime_1.jsx)("span", { className: "text-xs font-medium text-green-600", children: s.firstName.charAt(0) }) }), (0, jsx_runtime_1.jsxs)("div", { className: "ml-3", children: [(0, jsx_runtime_1.jsxs)("p", { className: "text-sm font-medium text-gray-900", children: [s.firstName, " ", s.lastName] }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-gray-500", children: s.className })] })] }), (0, jsx_runtime_1.jsx)("span", { className: "text-xs text-gray-400", children: s.joinedDate })] }, s.id))) }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-white rounded-lg shadow p-6", children: [(0, jsx_runtime_1.jsx)("h4", { className: "text-lg font-medium text-gray-900 mb-4", children: "Classes Summary" }), classes.length === 0 ? ((0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-400", children: "No classes yet." })) : ((0, jsx_runtime_1.jsx)("div", { className: "space-y-3", children: classes.slice(0, 4).map((c) => ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-medium text-gray-900", children: c.name }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-gray-500", children: c.teacher })] }), (0, jsx_runtime_1.jsxs)("span", { className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800", children: [c.students, " students"] })] }, c.id))) }))] })] })] })), activeSection === "teachers" && ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-center", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-2xl font-bold text-gray-900", children: "Teachers" }), (0, jsx_runtime_1.jsxs)("button", { onClick: openAdd, className: "inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors", children: [(0, jsx_runtime_1.jsx)(outline_1.PlusIcon, { className: "h-5 w-5 mr-2" }), " Add Teacher"] })] }), (0, jsx_runtime_1.jsx)("div", { className: "bg-white rounded-lg shadow p-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "relative", children: [(0, jsx_runtime_1.jsx)(outline_1.MagnifyingGlassIcon, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" }), (0, jsx_runtime_1.jsx)("input", { type: "text", placeholder: "Search teachers...", value: search, onChange: (e) => setSearch(e.target.value), className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" })] }) }), (0, jsx_runtime_1.jsx)("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden", children: (0, jsx_runtime_1.jsx)("div", { className: "overflow-x-auto", children: (0, jsx_runtime_1.jsxs)("table", { className: "min-w-full", children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { className: "border-b border-gray-200 bg-gray-50", children: [(0, jsx_runtime_1.jsx)("th", { className: "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider", children: "Teacher" }), (0, jsx_runtime_1.jsx)("th", { className: "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider", children: "Classes" }), (0, jsx_runtime_1.jsx)("th", { className: "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider", children: "Joined" }), (0, jsx_runtime_1.jsx)("th", { className: "px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider", children: "Actions" })] }) }), (0, jsx_runtime_1.jsxs)("tbody", { className: "divide-y divide-gray-100", children: [filteredTeachers.map((t) => ((0, jsx_runtime_1.jsxs)("tr", { className: "hover:bg-gray-50 transition-colors", children: [(0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center", children: [(0, jsx_runtime_1.jsx)("div", { className: "h-10 w-10 rounded-full bg-green-100 flex items-center justify-center", children: (0, jsx_runtime_1.jsx)("span", { className: "text-sm font-medium text-green-600", children: t.name.charAt(0) }) }), (0, jsx_runtime_1.jsxs)("div", { className: "ml-3", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-medium text-gray-900", children: t.name }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-gray-500", children: t.email })] })] }) }), (0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4", children: (0, jsx_runtime_1.jsx)("div", { className: "flex flex-wrap gap-1", children: t.classes.length ? t.classes.map((c) => ((0, jsx_runtime_1.jsx)("span", { className: "inline-flex px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800", children: c }, c))) : (0, jsx_runtime_1.jsx)("span", { className: "text-xs text-gray-400", children: "None" }) }) }), (0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4 text-sm text-gray-500", children: t.joinedDate }), (0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4 text-right", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-end space-x-2", children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => { setSelectedItem(t); setShowViewModal(true); }, className: "px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors", children: "View" }), (0, jsx_runtime_1.jsx)("button", { onClick: () => openEdit(t), className: "px-3 py-1 text-xs font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors", children: "Edit" }), (0, jsx_runtime_1.jsx)("button", { onClick: () => removeItem("teachers", t.id, t.name), className: "px-3 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors", children: "Remove" })] }) })] }, t.id))), filteredTeachers.length === 0 && ((0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsx)("td", { colSpan: 4, className: "px-6 py-8 text-center text-sm text-gray-400", children: "No teachers found." }) }))] })] }) }) })] })), activeSection === "students" && ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-center", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-2xl font-bold text-gray-900", children: "Students" }), (0, jsx_runtime_1.jsxs)("button", { onClick: openAdd, className: "inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors", children: [(0, jsx_runtime_1.jsx)(outline_1.PlusIcon, { className: "h-5 w-5 mr-2" }), " Add Student"] })] }), (0, jsx_runtime_1.jsx)("div", { className: "bg-white rounded-lg shadow p-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "relative", children: [(0, jsx_runtime_1.jsx)(outline_1.MagnifyingGlassIcon, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" }), (0, jsx_runtime_1.jsx)("input", { type: "text", placeholder: "Search students...", value: search, onChange: (e) => setSearch(e.target.value), className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" })] }) }), (0, jsx_runtime_1.jsx)("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden", children: (0, jsx_runtime_1.jsx)("div", { className: "overflow-x-auto", children: (0, jsx_runtime_1.jsxs)("table", { className: "min-w-full", children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { className: "border-b border-gray-200 bg-gray-50", children: [(0, jsx_runtime_1.jsx)("th", { className: "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider", children: "Student" }), (0, jsx_runtime_1.jsx)("th", { className: "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider", children: "Class" }), (0, jsx_runtime_1.jsx)("th", { className: "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider", children: "Joined" }), (0, jsx_runtime_1.jsx)("th", { className: "px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider", children: "Actions" })] }) }), (0, jsx_runtime_1.jsxs)("tbody", { className: "divide-y divide-gray-100", children: [filteredStudents.map((s) => ((0, jsx_runtime_1.jsxs)("tr", { className: "hover:bg-gray-50 transition-colors", children: [(0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center", children: [(0, jsx_runtime_1.jsx)("div", { className: "h-10 w-10 rounded-full bg-green-100 bg-cover bg-center flex items-center justify-center overflow-hidden", style: s.profilePicture ? { backgroundImage: `url(${s.profilePicture})` } : undefined, children: !s.profilePicture && (0, jsx_runtime_1.jsx)("span", { className: "text-sm font-medium text-green-600", children: s.firstName.charAt(0) }) }), (0, jsx_runtime_1.jsxs)("div", { className: "ml-3", children: [(0, jsx_runtime_1.jsxs)("p", { className: "text-sm font-medium text-gray-900", children: [s.firstName, " ", s.lastName] }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-gray-500", children: s.email || "No email" })] })] }) }), (0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4", children: (0, jsx_runtime_1.jsx)("span", { className: "inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800", children: s.className }) }), (0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4 text-sm text-gray-500", children: s.joinedDate }), (0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4 text-right", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-end space-x-2", children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => { setSelectedItem(s); setShowViewModal(true); }, className: "px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors", children: "View" }), (0, jsx_runtime_1.jsx)("button", { onClick: () => openEdit(s), className: "px-3 py-1 text-xs font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors", children: "Edit" }), (0, jsx_runtime_1.jsx)("button", { onClick: () => removeItem("students", s.id, `${s.firstName} ${s.lastName}`), className: "px-3 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors", children: "Remove" })] }) })] }, s.id))), filteredStudents.length === 0 && ((0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsx)("td", { colSpan: 4, className: "px-6 py-8 text-center text-sm text-gray-400", children: "No students found." }) }))] })] }) }) })] })), activeSection === "classes" && ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-center", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-2xl font-bold text-gray-900", children: "Classes" }), (0, jsx_runtime_1.jsxs)("button", { onClick: openAdd, className: "inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors", children: [(0, jsx_runtime_1.jsx)(outline_1.PlusIcon, { className: "h-5 w-5 mr-2" }), " Add Class"] })] }), (0, jsx_runtime_1.jsx)("div", { className: "bg-white rounded-lg shadow p-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "relative", children: [(0, jsx_runtime_1.jsx)(outline_1.MagnifyingGlassIcon, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" }), (0, jsx_runtime_1.jsx)("input", { type: "text", placeholder: "Search classes...", value: search, onChange: (e) => setSearch(e.target.value), className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" })] }) }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: [filteredClasses.map((c) => ((0, jsx_runtime_1.jsxs)("div", { className: "bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-start justify-between mb-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h4", { className: "text-lg font-semibold text-gray-900", children: c.name }), (0, jsx_runtime_1.jsxs)("p", { className: "text-sm text-gray-500", children: ["Grade ", c.grade] })] }), (0, jsx_runtime_1.jsxs)("span", { className: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800", children: [c.students, " students"] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center text-sm text-gray-600 mb-4", children: [(0, jsx_runtime_1.jsx)(outline_1.UserGroupIcon, { className: "h-4 w-4 mr-2 text-gray-400" }), c.teacher] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex space-x-2 pt-4 border-t border-gray-100", children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => { setSelectedItem(c); setShowViewModal(true); }, className: "flex-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors text-center", children: "View" }), (0, jsx_runtime_1.jsx)("button", { onClick: () => openEdit(c), className: "flex-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors text-center", children: "Edit" }), (0, jsx_runtime_1.jsx)("button", { onClick: () => removeItem("classes", c.id, c.name), className: "flex-1 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors text-center", children: "Delete" })] })] }, c.id))), filteredClasses.length === 0 && ((0, jsx_runtime_1.jsx)("p", { className: "col-span-full text-center text-sm text-gray-400 py-8", children: "No classes found." }))] })] })), activeSection === "subjects" && ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-center", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-2xl font-bold text-gray-900", children: "Subjects" }), (0, jsx_runtime_1.jsxs)("button", { onClick: openAdd, className: "inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors", children: [(0, jsx_runtime_1.jsx)(outline_1.PlusIcon, { className: "h-5 w-5 mr-2" }), " Add Subject"] })] }), (0, jsx_runtime_1.jsx)("div", { className: "bg-white rounded-lg shadow p-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "relative", children: [(0, jsx_runtime_1.jsx)(outline_1.MagnifyingGlassIcon, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" }), (0, jsx_runtime_1.jsx)("input", { type: "text", placeholder: "Search subjects...", value: search, onChange: (e) => setSearch(e.target.value), className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" })] }) }), (0, jsx_runtime_1.jsx)("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden", children: (0, jsx_runtime_1.jsx)("div", { className: "overflow-x-auto", children: (0, jsx_runtime_1.jsxs)("table", { className: "min-w-full", children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { className: "border-b border-gray-200 bg-gray-50", children: [(0, jsx_runtime_1.jsx)("th", { className: "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider", children: "Subject" }), (0, jsx_runtime_1.jsx)("th", { className: "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider", children: "Code" }), (0, jsx_runtime_1.jsx)("th", { className: "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider", children: "Teacher" }), (0, jsx_runtime_1.jsx)("th", { className: "px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider", children: "Actions" })] }) }), (0, jsx_runtime_1.jsxs)("tbody", { className: "divide-y divide-gray-100", children: [filteredSubjects.map((s) => ((0, jsx_runtime_1.jsxs)("tr", { className: "hover:bg-gray-50 transition-colors", children: [(0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center", children: [(0, jsx_runtime_1.jsx)("div", { className: "h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center", children: (0, jsx_runtime_1.jsx)(outline_1.BookOpenIcon, { className: "h-5 w-5 text-orange-600" }) }), (0, jsx_runtime_1.jsx)("p", { className: "ml-3 text-sm font-medium text-gray-900", children: s.name })] }) }), (0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4", children: (0, jsx_runtime_1.jsx)("span", { className: "inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800", children: s.code }) }), (0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4 text-sm text-gray-600", children: s.teacher }), (0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4 text-right", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-end space-x-2", children: [(0, jsx_runtime_1.jsx)("button", { onClick: () => { setSelectedItem(s); setShowViewModal(true); }, className: "px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors", children: "View" }), (0, jsx_runtime_1.jsx)("button", { onClick: () => openEdit(s), className: "px-3 py-1 text-xs font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors", children: "Edit" }), (0, jsx_runtime_1.jsx)("button", { onClick: () => removeItem("subjects", s.id, s.name), className: "px-3 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors", children: "Delete" })] }) })] }, s.id))), filteredSubjects.length === 0 && ((0, jsx_runtime_1.jsx)("tr", { children: (0, jsx_runtime_1.jsx)("td", { colSpan: 4, className: "px-6 py-8 text-center text-sm text-gray-400", children: "No subjects found." }) }))] })] }) }) })] })), activeSection === "fees" && ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-2xl font-bold text-gray-900", children: "School Fees" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-500 -mt-3", children: "Set each student's fee structure and record how much they have paid. Parents see this on their portal." }), feeError && ((0, jsx_runtime_1.jsx)("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700", children: feeError })), (0, jsx_runtime_1.jsxs)("div", { className: "bg-white rounded-lg shadow p-4", children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Student" }), (0, jsx_runtime_1.jsxs)("select", { value: feeStudentId, onChange: (e) => selectFeeStudent(e.target.value), disabled: feeLoading, className: "w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500", children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: feeLoading ? "Loading…" : "Select a student…" }), feeStudents.map((s) => ((0, jsx_runtime_1.jsx)("option", { value: s.id, children: s.name }, s.id)))] })] }), feeStudentId && ((0, jsx_runtime_1.jsxs)("form", { onSubmit: saveFee, className: "bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Currency" }), (0, jsx_runtime_1.jsx)("input", { type: "text", value: feeForm.currency, onChange: (e) => setFeeForm((f) => ({ ...f, currency: e.target.value })), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Due Date" }), (0, jsx_runtime_1.jsx)("input", { type: "date", value: feeForm.dueDate, onChange: (e) => setFeeForm((f) => ({ ...f, dueDate: e.target.value })), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Amount Paid" }), (0, jsx_runtime_1.jsx)("input", { type: "number", min: "0", value: feeForm.paid, onChange: (e) => setFeeForm((f) => ({ ...f, paid: e.target.value })), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" })] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between mb-2", children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-gray-700", children: "Fee Items" }), (0, jsx_runtime_1.jsxs)("button", { type: "button", onClick: () => setFeeForm((f) => ({ ...f, items: [...f.items, { item: "", amount: "", term: "" }] })), className: "inline-flex items-center px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-md hover:bg-green-100 transition-colors", children: [(0, jsx_runtime_1.jsx)(outline_1.PlusIcon, { className: "h-4 w-4 mr-1" }), " Add Item"] })] }), feeForm.items.length === 0 ? ((0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-400 py-4 text-center border border-dashed border-gray-200 rounded-lg", children: "No fee items yet. Add one to start." })) : ((0, jsx_runtime_1.jsx)("div", { className: "space-y-2", children: feeForm.items.map((it, i) => ((0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-12 gap-2 items-center", children: [(0, jsx_runtime_1.jsx)("input", { type: "text", value: it.item, onChange: (e) => setFeeForm((f) => ({ ...f, items: f.items.map((x, j) => j === i ? { ...x, item: e.target.value } : x) })), placeholder: "Item (e.g. Tuition)", className: "col-span-5 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" }), (0, jsx_runtime_1.jsx)("input", { type: "text", value: it.term, onChange: (e) => setFeeForm((f) => ({ ...f, items: f.items.map((x, j) => j === i ? { ...x, term: e.target.value } : x) })), placeholder: "Term", className: "col-span-3 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" }), (0, jsx_runtime_1.jsx)("input", { type: "number", min: "0", value: it.amount, onChange: (e) => setFeeForm((f) => ({ ...f, items: f.items.map((x, j) => j === i ? { ...x, amount: e.target.value } : x) })), placeholder: "Amount", className: "col-span-3 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500" }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setFeeForm((f) => ({ ...f, items: f.items.filter((_, j) => j !== i) })), className: "col-span-1 flex justify-center text-gray-400 hover:text-red-600 transition-colors", "aria-label": "Remove item", children: (0, jsx_runtime_1.jsx)(outline_1.TrashIcon, { className: "h-5 w-5" }) })] }, i))) }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-3 gap-4 border-t border-gray-100 pt-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs text-gray-500", children: "Total Due" }), (0, jsx_runtime_1.jsxs)("p", { className: "text-lg font-semibold text-gray-900", children: [feeForm.currency, " ", feeFormTotal.toLocaleString()] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs text-gray-500", children: "Paid" }), (0, jsx_runtime_1.jsxs)("p", { className: "text-lg font-semibold text-gray-900", children: [feeForm.currency, " ", feeFormPaid.toLocaleString()] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs text-gray-500", children: "Balance" }), (0, jsx_runtime_1.jsxs)("p", { className: `text-lg font-semibold ${feeFormBalance <= 0 ? "text-green-700" : "text-orange-700"}`, children: [feeForm.currency, " ", feeFormBalance.toLocaleString()] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between border-t border-gray-100 pt-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-sm", children: feeSaved && (0, jsx_runtime_1.jsx)("span", { className: "text-green-600", children: "Fees saved \u2713" }) }), (0, jsx_runtime_1.jsx)("button", { type: "submit", disabled: feeSaving, className: "px-6 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed", children: feeSaving ? "Saving…" : "Save Fees" })] })] }))] }))] })) }) })] }), showAddModal && ((0, jsx_runtime_1.jsx)("div", { className: "fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50", children: (0, jsx_runtime_1.jsxs)("div", { className: "relative top-20 mx-auto p-6 border w-11/12 md:w-1/2 shadow-lg rounded-lg bg-white", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-center mb-6", children: [(0, jsx_runtime_1.jsxs)("h3", { className: "text-lg font-semibold text-gray-900", children: ["Add ", sectionNoun] }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setShowAddModal(false), className: "text-gray-400 hover:text-gray-600", children: (0, jsx_runtime_1.jsx)(outline_1.XMarkIcon, { className: "h-6 w-6" }) })] }), (0, jsx_runtime_1.jsxs)("form", { className: "space-y-4", onSubmit: submitAdd, children: [activeSection === "teachers" && ((0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-2 gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Full Name *" }), (0, jsx_runtime_1.jsx)("input", { type: "text", required: true, value: form.name || "", onChange: (e) => setForm((f) => ({ ...f, name: e.target.value })), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500", placeholder: "Alice Johnson" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Email *" }), (0, jsx_runtime_1.jsx)("input", { type: "email", required: true, value: form.email || "", onChange: (e) => setForm((f) => ({ ...f, email: e.target.value })), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500", placeholder: "teacher@school.edu" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "col-span-2", children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Password *" }), (0, jsx_runtime_1.jsx)("input", { type: "password", required: true, value: form.password || "", onChange: (e) => setForm((f) => ({ ...f, password: e.target.value })), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" })] })] })), activeSection === "students" && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "h-16 w-16 rounded-full bg-green-100 bg-cover bg-center flex items-center justify-center overflow-hidden", style: studentAvatar ? { backgroundImage: `url(${studentAvatar})` } : undefined, children: !studentAvatar && (0, jsx_runtime_1.jsx)(outline_1.AcademicCapIcon, { className: "h-7 w-7 text-green-600" }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Profile Picture" }), (0, jsx_runtime_1.jsx)("input", { type: "file", accept: "image/*", onChange: (e) => handleAvatarChange(e, setStudentAvatar), className: "text-sm text-gray-600" }), studentAvatar && (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setStudentAvatar(""), className: "ml-2 text-xs text-red-600 hover:underline", children: "Remove" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-2 gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "First Name *" }), (0, jsx_runtime_1.jsx)("input", { type: "text", required: true, value: form.firstName || "", onChange: (e) => setForm((f) => ({ ...f, firstName: e.target.value })), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500", placeholder: "Emma" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Last Name *" }), (0, jsx_runtime_1.jsx)("input", { type: "text", required: true, value: form.lastName || "", onChange: (e) => setForm((f) => ({ ...f, lastName: e.target.value })), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500", placeholder: "Brown" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: ["Email ", (0, jsx_runtime_1.jsx)("span", { className: "text-gray-400 font-normal", children: "(optional)" })] }), (0, jsx_runtime_1.jsx)("input", { type: "email", value: form.email || "", onChange: (e) => setForm((f) => ({ ...f, email: e.target.value })), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500", placeholder: "Leave blank if none" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Assign Class" }), (0, jsx_runtime_1.jsxs)("select", { value: form.classId || "", onChange: (e) => setForm((f) => ({ ...f, classId: e.target.value })), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500", children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Select class" }), classes.map((c) => (0, jsx_runtime_1.jsx)("option", { value: c.id, children: c.name }, c.id))] })] })] })] })), activeSection === "classes" && ((0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-2 gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Class Name *" }), (0, jsx_runtime_1.jsx)("input", { type: "text", required: true, value: form.name || "", onChange: (e) => setForm((f) => ({ ...f, name: e.target.value })), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500", placeholder: "Grade 10A" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Grade *" }), (0, jsx_runtime_1.jsx)("input", { type: "text", required: true, value: form.grade || "", onChange: (e) => setForm((f) => ({ ...f, grade: e.target.value })), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500", placeholder: "10" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "col-span-2", children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Assign Teacher" }), (0, jsx_runtime_1.jsxs)("select", { value: form.teacherId || "", onChange: (e) => setForm((f) => ({ ...f, teacherId: e.target.value })), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500", children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Select teacher" }), teachers.map((t) => (0, jsx_runtime_1.jsx)("option", { value: t.id, children: t.name }, t.id))] })] })] })), activeSection === "subjects" && ((0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-2 gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Subject Name *" }), (0, jsx_runtime_1.jsx)("input", { type: "text", required: true, value: form.name || "", onChange: (e) => setForm((f) => ({ ...f, name: e.target.value })), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500", placeholder: "Mathematics" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Subject Code *" }), (0, jsx_runtime_1.jsx)("input", { type: "text", required: true, value: form.code || "", onChange: (e) => setForm((f) => ({ ...f, code: e.target.value })), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500", placeholder: "MATH101" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "col-span-2", children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Assign Teacher" }), (0, jsx_runtime_1.jsxs)("select", { value: form.teacherId || "", onChange: (e) => setForm((f) => ({ ...f, teacherId: e.target.value })), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500", children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Select teacher" }), teachers.map((t) => (0, jsx_runtime_1.jsx)("option", { value: t.id, children: t.name }, t.id))] })] })] })), formError && (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-red-600", children: formError }), (0, jsx_runtime_1.jsxs)("div", { className: "flex justify-end space-x-3 pt-4 border-t border-gray-200", children: [(0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setShowAddModal(false), className: "px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors", children: "Cancel" }), (0, jsx_runtime_1.jsx)("button", { type: "submit", disabled: formSaving, className: "px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50", children: formSaving ? "Saving…" : "Save" })] })] })] }) })), showViewModal && selectedItem && ((0, jsx_runtime_1.jsx)("div", { className: "fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50", children: (0, jsx_runtime_1.jsxs)("div", { className: "relative top-20 mx-auto p-6 border w-11/12 md:w-1/2 shadow-lg rounded-lg bg-white", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-center mb-6", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-lg font-semibold text-gray-900", children: "Details" }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setShowViewModal(false), className: "text-gray-400 hover:text-gray-600", children: (0, jsx_runtime_1.jsx)(outline_1.XMarkIcon, { className: "h-6 w-6" }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-4 pb-4 border-b", children: [(0, jsx_runtime_1.jsx)("div", { className: "h-16 w-16 rounded-full bg-green-100 flex items-center justify-center", children: (0, jsx_runtime_1.jsx)("span", { className: "text-2xl font-bold text-green-600", children: (selectedItem.name || selectedItem.firstName || selectedItem.code || "?").charAt(0) }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h4", { className: "text-xl font-semibold text-gray-900", children: selectedItem.name || `${selectedItem.firstName} ${selectedItem.lastName}` || selectedItem.code }), selectedItem.email && (0, jsx_runtime_1.jsx)("p", { className: "text-gray-500 text-sm", children: selectedItem.email })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-2 gap-4 text-sm", children: Object.entries(selectedItem)
                                        .filter(([k]) => !["id", "profilePicture", "teacherId", "classId"].includes(k))
                                        .map(([k, v]) => ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "text-gray-500 capitalize", children: k.replace(/([A-Z])/g, " $1") }), (0, jsx_runtime_1.jsx)("p", { className: "text-gray-900 font-medium", children: Array.isArray(v) ? v.join(", ") || "—" : String(v) })] }, k))) })] }), (0, jsx_runtime_1.jsx)("div", { className: "mt-6 flex justify-end", children: (0, jsx_runtime_1.jsx)("button", { onClick: () => setShowViewModal(false), className: "px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors", children: "Close" }) })] }) })), showEditModal && selectedItem && ((0, jsx_runtime_1.jsx)("div", { className: "fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50", children: (0, jsx_runtime_1.jsxs)("div", { className: "relative top-20 mx-auto p-6 border w-11/12 md:w-1/2 shadow-lg rounded-lg bg-white", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-center mb-6", children: [(0, jsx_runtime_1.jsxs)("h3", { className: "text-lg font-semibold text-gray-900", children: ["Edit ", sectionNoun] }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setShowEditModal(false), className: "text-gray-400 hover:text-gray-600", children: (0, jsx_runtime_1.jsx)(outline_1.XMarkIcon, { className: "h-6 w-6" }) })] }), (0, jsx_runtime_1.jsxs)("form", { className: "space-y-4", onSubmit: submitEdit, children: [activeSection === "teachers" && ((0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-2 gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Full Name *" }), (0, jsx_runtime_1.jsx)("input", { type: "text", required: true, value: form.name || "", onChange: (e) => setForm((f) => ({ ...f, name: e.target.value })), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Email *" }), (0, jsx_runtime_1.jsx)("input", { type: "email", required: true, value: form.email || "", onChange: (e) => setForm((f) => ({ ...f, email: e.target.value })), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" })] })] })), activeSection === "subjects" && ((0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-2 gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Subject Name *" }), (0, jsx_runtime_1.jsx)("input", { type: "text", required: true, value: form.name || "", onChange: (e) => setForm((f) => ({ ...f, name: e.target.value })), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Subject Code *" }), (0, jsx_runtime_1.jsx)("input", { type: "text", required: true, value: form.code || "", onChange: (e) => setForm((f) => ({ ...f, code: e.target.value })), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "col-span-2", children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Assign Teacher" }), (0, jsx_runtime_1.jsxs)("select", { value: form.teacherId || "", onChange: (e) => setForm((f) => ({ ...f, teacherId: e.target.value })), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500", children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Unassigned" }), teachers.map((t) => (0, jsx_runtime_1.jsx)("option", { value: t.id, children: t.name }, t.id))] })] })] })), activeSection === "classes" && ((0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-2 gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Class Name *" }), (0, jsx_runtime_1.jsx)("input", { type: "text", required: true, value: form.name || "", onChange: (e) => setForm((f) => ({ ...f, name: e.target.value })), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Grade *" }), (0, jsx_runtime_1.jsx)("input", { type: "text", required: true, value: form.grade || "", onChange: (e) => setForm((f) => ({ ...f, grade: e.target.value })), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "col-span-2", children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Assign Teacher" }), (0, jsx_runtime_1.jsxs)("select", { value: form.teacherId || "", onChange: (e) => setForm((f) => ({ ...f, teacherId: e.target.value })), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500", children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Unassigned" }), teachers.map((t) => (0, jsx_runtime_1.jsx)("option", { value: t.id, children: t.name }, t.id))] })] })] })), activeSection === "students" && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "h-16 w-16 rounded-full bg-green-100 bg-cover bg-center flex items-center justify-center overflow-hidden", style: editAvatar ? { backgroundImage: `url(${editAvatar})` } : undefined, children: !editAvatar && (0, jsx_runtime_1.jsx)("span", { className: "text-xl font-bold text-green-600", children: (form.firstName || "?").charAt(0) }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Profile Picture" }), (0, jsx_runtime_1.jsx)("input", { type: "file", accept: "image/*", onChange: (e) => handleAvatarChange(e, setEditAvatar), className: "text-sm text-gray-600" }), editAvatar && (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setEditAvatar(""), className: "ml-2 text-xs text-red-600 hover:underline", children: "Remove" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-2 gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "First Name *" }), (0, jsx_runtime_1.jsx)("input", { type: "text", required: true, value: form.firstName || "", onChange: (e) => setForm((f) => ({ ...f, firstName: e.target.value })), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Last Name *" }), (0, jsx_runtime_1.jsx)("input", { type: "text", required: true, value: form.lastName || "", onChange: (e) => setForm((f) => ({ ...f, lastName: e.target.value })), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: ["Email ", (0, jsx_runtime_1.jsx)("span", { className: "text-gray-400 font-normal", children: "(optional)" })] }), (0, jsx_runtime_1.jsx)("input", { type: "email", value: form.email || "", onChange: (e) => setForm((f) => ({ ...f, email: e.target.value })), placeholder: "Leave blank if none", className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Assign Class" }), (0, jsx_runtime_1.jsxs)("select", { value: form.classId || "", onChange: (e) => setForm((f) => ({ ...f, classId: e.target.value })), className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500", children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Unassigned" }), classes.map((c) => (0, jsx_runtime_1.jsx)("option", { value: c.id, children: c.name }, c.id))] })] })] })] })), formError && (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-red-600", children: formError }), (0, jsx_runtime_1.jsxs)("div", { className: "flex justify-end space-x-3 pt-4 border-t border-gray-200", children: [(0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => setShowEditModal(false), className: "px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors", children: "Cancel" }), (0, jsx_runtime_1.jsx)("button", { type: "submit", disabled: formSaving, className: "px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50", children: formSaving ? "Saving…" : "Save Changes" })] })] })] }) }))] }));
}
//# sourceMappingURL=page.js.map