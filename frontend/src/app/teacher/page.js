"use client";
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TeacherDashboard;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("next-auth/react");
const navigation_1 = require("next/navigation");
const react_2 = require("react");
const outline_1 = require("@heroicons/react/24/outline");
const LanguageToggle_1 = __importDefault(require("@/components/LanguageToggle"));
// Test and exam are each marked out of 50 (total 100).
const TEST_MAX = 50;
const EXAM_MAX = 50;
// ─── API helpers & normalizers ─────────────────────────────────────────────
async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
    }
    return res.json();
}
// Mongoose docs arrive with `_id` and populated relations; flatten them into
// the flat shapes the UI renders.
function normalizeStudent(s) {
    const cls = typeof s.classId === "object" && s.classId !== null ? s.classId.name : undefined;
    return {
        id: String(s._id),
        firstName: s.firstName,
        lastName: s.lastName,
        email: s.email ?? "",
        className: cls,
    };
}
function normalizeSubject(s) {
    return { id: String(s._id), name: s.name, code: s.code };
}
function normalizeDiscipline(d) {
    const s = typeof d.studentId === "object" && d.studentId !== null ? d.studentId : null;
    return {
        id: String(d._id),
        studentName: s ? `${s.firstName ?? ""} ${s.lastName ?? ""}`.trim() : "—",
        date: typeof d.date === "string" ? d.date.slice(0, 10) : String(d.date),
        type: d.type,
        category: d.category,
        points: d.points,
        note: d.note ?? "",
        actionTaken: d.actionTaken ?? "",
    };
}
function normalizeMark(m) {
    const student = m.studentId;
    const subject = m.subjectId;
    const studentObj = typeof student === "object" && student !== null ? student : null;
    const subjectObj = typeof subject === "object" && subject !== null ? subject : null;
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
    };
}
// ─── Excel Validation Logic ───────────────────────────────────────────────────
const VALID_TERMS = ["Term 1", "Term 2", "Term 3"];
function validateAndParseCSV(text, validStudentNames, validSubjects) {
    const globalErrors = [];
    const lines = text.trim().split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) {
        globalErrors.push("File is empty or missing data rows.");
        return { rows: [], globalErrors };
    }
    // Validate headers
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const required = ["student name", "subject", "test", "exam", "term", "year"];
    const missing = required.filter((r) => !headers.includes(r));
    if (missing.length > 0) {
        globalErrors.push(`Missing required columns: ${missing.join(", ")}`);
        return { rows: [], globalErrors };
    }
    const idx = (col) => headers.indexOf(col);
    const rows = [];
    const seen = new Set();
    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",").map((c) => c.trim());
        const errors = [];
        const studentName = cols[idx("student name")] || "";
        const subject = cols[idx("subject")] || "";
        const testRaw = cols[idx("test")] || "";
        const examRaw = cols[idx("exam")] || "";
        const term = cols[idx("term")] || "";
        const year = cols[idx("year")] || "";
        // Student must exist in class
        if (!studentName) {
            errors.push("Student name is required");
        }
        else if (!validStudentNames.includes(studentName)) {
            errors.push(`"${studentName}" is not enrolled in this class`);
        }
        // Subject must be valid
        if (!subject) {
            errors.push("Subject is required");
        }
        else if (!validSubjects.includes(subject)) {
            errors.push(`"${subject}" is not a recognised subject`);
        }
        // Test must be a number within 0–TEST_MAX
        const test = parseFloat(testRaw);
        if (testRaw === "" || isNaN(test)) {
            errors.push("Test must be a number");
        }
        else if (test < 0 || test > TEST_MAX) {
            errors.push(`Test must be between 0 and ${TEST_MAX}`);
        }
        // Exam must be a number within 0–EXAM_MAX
        const exam = parseFloat(examRaw);
        if (examRaw === "" || isNaN(exam)) {
            errors.push("Exam must be a number");
        }
        else if (exam < 0 || exam > EXAM_MAX) {
            errors.push(`Exam must be between 0 and ${EXAM_MAX}`);
        }
        // Term must be valid
        if (!term) {
            errors.push("Term is required");
        }
        else if (!VALID_TERMS.includes(term)) {
            errors.push(`Term must be one of: ${VALID_TERMS.join(", ")}`);
        }
        // Year must be a 4-digit year
        if (!year || !/^\d{4}$/.test(year)) {
            errors.push("Year must be a 4-digit number (e.g. 2025)");
        }
        // Duplicate check: same student + subject + term + year
        const key = `${studentName}|${subject}|${term}|${year}`;
        if (seen.has(key)) {
            errors.push(`Duplicate entry for ${studentName} - ${subject} (${term} ${year})`);
        }
        else {
            seen.add(key);
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
        });
    }
    return { rows, globalErrors };
}
// ─── Component ────────────────────────────────────────────────────────────────
function TeacherDashboard() {
    const { data: session, status } = (0, react_1.useSession)();
    const router = (0, navigation_1.useRouter)();
    const [activeSection, setActiveSection] = (0, react_2.useState)("overview");
    const [search, setSearch] = (0, react_2.useState)("");
    const [selectedStudent, setSelectedStudent] = (0, react_2.useState)(null);
    const [showStudentModal, setShowStudentModal] = (0, react_2.useState)(false);
    // Upload state
    const [uploadStep, setUploadStep] = (0, react_2.useState)("idle");
    const [parsedRows, setParsedRows] = (0, react_2.useState)([]);
    const [globalErrors, setGlobalErrors] = (0, react_2.useState)([]);
    const [fileName, setFileName] = (0, react_2.useState)("");
    const [isSubmitting, setIsSubmitting] = (0, react_2.useState)(false);
    const [submitError, setSubmitError] = (0, react_2.useState)(null);
    const [savedCount, setSavedCount] = (0, react_2.useState)(0);
    const fileInputRef = (0, react_2.useRef)(null);
    // Data loaded from the API
    const [students, setStudents] = (0, react_2.useState)([]);
    const [subjects, setSubjects] = (0, react_2.useState)([]);
    const [marks, setMarks] = (0, react_2.useState)([]);
    const [discRecords, setDiscRecords] = (0, react_2.useState)([]);
    const [dataLoading, setDataLoading] = (0, react_2.useState)(true);
    const [loadError, setLoadError] = (0, react_2.useState)(null);
    // Discipline entry form
    const [discForm, setDiscForm] = (0, react_2.useState)({ studentId: "", type: "Merit", category: "", points: "3", note: "", date: "", actionTaken: "" });
    const [discSubmitting, setDiscSubmitting] = (0, react_2.useState)(false);
    const [discError, setDiscError] = (0, react_2.useState)(null);
    const [discSaved, setDiscSaved] = (0, react_2.useState)(false);
    (0, react_2.useEffect)(() => {
        if (status === "loading")
            return;
        if (!session) {
            router.push("/auth/signin");
            return;
        }
        if (session.user.role !== "TEACHER") {
            router.push("/");
            return;
        }
    }, [session, status, router]);
    const loadData = (0, react_2.useCallback)(async () => {
        setDataLoading(true);
        setLoadError(null);
        try {
            const [st, su, mk, dr] = await Promise.all([
                fetchJson("/api/students"),
                fetchJson("/api/subjects"),
                fetchJson("/api/marks"),
                fetchJson("/api/discipline"),
            ]);
            setStudents(st.map(normalizeStudent));
            setSubjects(su.map(normalizeSubject));
            setMarks(mk.map(normalizeMark));
            setDiscRecords(dr.map(normalizeDiscipline));
        }
        catch (e) {
            setLoadError(e instanceof Error ? e.message : "Failed to load data");
        }
        finally {
            setDataLoading(false);
        }
    }, []);
    (0, react_2.useEffect)(() => {
        if (status === "authenticated" && session?.user.role === "TEACHER")
            loadData();
    }, [status, session?.user.role, loadData]);
    const menuItems = [
        { id: "overview", label: "Overview", icon: outline_1.ChartBarIcon },
        { id: "students", label: "My Students", icon: outline_1.UserGroupIcon },
        { id: "marks", label: "Marks", icon: outline_1.BookOpenIcon },
        { id: "upload", label: "Upload Marks", icon: outline_1.ArrowUpTrayIcon },
        { id: "discipline", label: "Discipline", icon: outline_1.ShieldExclamationIcon },
    ];
    const submitDiscipline = async (e) => {
        e.preventDefault();
        const points = parseFloat(discForm.points);
        if (!discForm.studentId) {
            setDiscError("Please select a student");
            return;
        }
        if (!discForm.category.trim()) {
            setDiscError("Category is required");
            return;
        }
        if (isNaN(points) || points <= 0) {
            setDiscError("Points must be a positive number");
            return;
        }
        setDiscSubmitting(true);
        setDiscError(null);
        setDiscSaved(false);
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
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || "Failed to save record");
            }
            const created = await res.json();
            setDiscRecords((prev) => [normalizeDiscipline(created), ...prev]);
            setDiscForm({ studentId: "", type: "Merit", category: "", points: "3", note: "", date: "", actionTaken: "" });
            setDiscSaved(true);
        }
        catch (err) {
            setDiscError(err instanceof Error ? err.message : "Failed to save record");
        }
        finally {
            setDiscSubmitting(false);
        }
    };
    // A teacher's account is scoped to a school, not a single class, so derive a
    // sensible label from the students actually returned.
    const classNames = [...new Set(students.map((s) => s.className).filter((c) => Boolean(c)))];
    const classLabel = classNames.length === 1 ? classNames[0] : classNames.length > 1 ? "All Classes" : "My Class";
    const exampleStudent = students[0] ? `${students[0].firstName} ${students[0].lastName}` : "Student Name";
    const exampleSubject = subjects[0]?.name ?? "Subject";
    const templateHref = `data:text/csv;charset=utf-8,${encodeURIComponent(`Student Name,Subject,Test,Exam,Term,Year\n${exampleStudent},${exampleSubject},35,48,Term 1,2025`)}`;
    const filteredStudents = students.filter((s) => {
        const q = search.toLowerCase();
        return `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
    });
    const filteredMarks = marks.filter((m) => {
        const q = search.toLowerCase();
        return m.studentName.toLowerCase().includes(q) || m.subject.toLowerCase().includes(q);
    });
    // Grade helper
    const grade = (score, max) => {
        const pct = (score / max) * 100;
        if (pct >= 90)
            return { label: "A+", color: "text-green-700 bg-green-100" };
        if (pct >= 80)
            return { label: "A", color: "text-green-600 bg-green-50" };
        if (pct >= 70)
            return { label: "B", color: "text-blue-600 bg-blue-100" };
        if (pct >= 60)
            return { label: "C", color: "text-yellow-600 bg-yellow-100" };
        if (pct >= 50)
            return { label: "D", color: "text-orange-600 bg-orange-100" };
        return { label: "F", color: "text-red-600 bg-red-100" };
    };
    // File handler — reads CSV/Excel-exported-as-CSV
    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        // Accept .csv or .xlsx (we parse as text; xlsx support note shown to user)
        if (!file.name.endsWith(".csv") && !file.name.endsWith(".xlsx")) {
            setGlobalErrors(["Only .csv or .xlsx files are accepted."]);
            setUploadStep("preview");
            setParsedRows([]);
            return;
        }
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target?.result;
            const validStudentNames = students.map((s) => `${s.firstName} ${s.lastName}`);
            const validSubjectNames = subjects.map((s) => s.name);
            const { rows, globalErrors: gErr } = validateAndParseCSV(text, validStudentNames, validSubjectNames);
            setGlobalErrors(gErr);
            setParsedRows(rows);
            setUploadStep("preview");
        };
        reader.readAsText(file);
    };
    const validRows = parsedRows.filter((r) => r.valid);
    const invalidRows = parsedRows.filter((r) => !r.valid);
    const handleSubmit = async () => {
        if (validRows.length === 0)
            return;
        setIsSubmitting(true);
        setSubmitError(null);
        try {
            const studentIdByName = new Map(students.map((s) => [`${s.firstName} ${s.lastName}`, s.id]));
            const subjectIdByName = new Map(subjects.map((s) => [s.name, s.id]));
            const records = validRows.map((r) => ({
                studentId: studentIdByName.get(r.studentName),
                subjectId: subjectIdByName.get(r.subject),
                test: r.test,
                exam: r.exam,
                term: r.term,
                year: r.year,
            }));
            const res = await fetch("/api/marks", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ records }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || "Failed to save marks");
            }
            const result = await res.json();
            setSavedCount(typeof result.saved === "number" ? result.saved : validRows.length);
            // Refresh the marks table with what's now persisted
            const mk = await fetchJson("/api/marks");
            setMarks(mk.map(normalizeMark));
            setUploadStep("success");
        }
        catch (e) {
            setSubmitError(e instanceof Error ? e.message : "Failed to save marks");
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const resetUpload = () => {
        setUploadStep("idle");
        setParsedRows([]);
        setGlobalErrors([]);
        setFileName("");
        setSubmitError(null);
        if (fileInputRef.current)
            fileInputRef.current.value = "";
    };
    if (status === "loading") {
        return ((0, jsx_runtime_1.jsx)("div", { className: "min-h-screen flex items-center justify-center", children: (0, jsx_runtime_1.jsx)("div", { className: "animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600" }) }));
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "min-h-screen bg-gray-50", children: [(0, jsx_runtime_1.jsx)("header", { className: "bg-white shadow-sm border-b", children: (0, jsx_runtime_1.jsx)("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-center h-16", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center", children: [(0, jsx_runtime_1.jsx)("div", { className: "h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center", children: (0, jsx_runtime_1.jsx)(outline_1.AcademicCapIcon, { className: "h-5 w-5 text-white" }) }), (0, jsx_runtime_1.jsxs)("div", { className: "ml-4", children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-xl font-semibold text-gray-900", children: "Teacher Portal" }), (0, jsx_runtime_1.jsxs)("p", { className: "text-sm text-gray-500", children: [classLabel, " \u2014 Class Teacher"] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-3", children: [(0, jsx_runtime_1.jsx)(LanguageToggle_1.default, {}), (0, jsx_runtime_1.jsx)("div", { className: "h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center", children: (0, jsx_runtime_1.jsx)("span", { className: "text-white text-sm font-medium", children: session?.user?.name?.charAt(0) || "T" }) })] })] }) }) }), (0, jsx_runtime_1.jsxs)("div", { className: "flex", children: [(0, jsx_runtime_1.jsx)("div", { className: "fixed top-16 left-0 z-50 w-64 bg-indigo-600 shadow-lg h-[calc(100vh-4rem)]", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex h-full flex-col", children: [(0, jsx_runtime_1.jsx)("div", { className: "px-4 py-4 border-b border-indigo-700", children: (0, jsx_runtime_1.jsxs)("div", { className: "bg-indigo-700 rounded-lg px-3 py-2", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs text-indigo-300", children: "My Class" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold text-white", children: classLabel }), (0, jsx_runtime_1.jsxs)("p", { className: "text-xs text-indigo-300", children: [students.length, " students \u00B7 ", subjects.length, " subjects"] })] }) }), (0, jsx_runtime_1.jsx)("nav", { className: "flex-1 px-4 py-4 space-y-2", children: menuItems.map((item) => {
                                        const Icon = item.icon;
                                        return ((0, jsx_runtime_1.jsxs)("button", { onClick: () => { setActiveSection(item.id); setSearch(""); }, className: `group flex w-full items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeSection === item.id
                                                ? "bg-white text-indigo-600"
                                                : "text-white hover:bg-indigo-700"}`, children: [(0, jsx_runtime_1.jsx)(Icon, { className: "mr-3 h-5 w-5" }), item.label] }, item.id));
                                    }) }), (0, jsx_runtime_1.jsx)("div", { className: "p-4 border-t border-indigo-700", children: (0, jsx_runtime_1.jsxs)("button", { onClick: () => (0, react_1.signOut)({ callbackUrl: "/" }), className: "flex w-full items-center px-3 py-2 text-sm font-medium text-white rounded-lg hover:bg-red-500 transition-colors", children: [(0, jsx_runtime_1.jsx)(outline_1.ArrowRightOnRectangleIcon, { className: "mr-3 h-5 w-5" }), "Sign Out"] }) })] }) }), (0, jsx_runtime_1.jsx)("div", { className: "pl-64 flex-1", children: (0, jsx_runtime_1.jsx)("main", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: dataLoading ? ((0, jsx_runtime_1.jsx)("div", { className: "flex items-center justify-center py-32", children: (0, jsx_runtime_1.jsx)("div", { className: "animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" }) })) : loadError ? ((0, jsx_runtime_1.jsxs)("div", { className: "bg-red-50 border border-red-200 rounded-lg p-8 text-center", children: [(0, jsx_runtime_1.jsx)(outline_1.ExclamationTriangleIcon, { className: "h-10 w-10 text-red-500 mx-auto mb-3" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm font-medium text-red-800 mb-4", children: loadError }), (0, jsx_runtime_1.jsx)("button", { onClick: loadData, className: "px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors", children: "Retry" })] })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [activeSection === "overview" && ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-2xl font-bold text-gray-900", children: "Overview" }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: [
                                                    { label: "My Students", value: students.length, icon: outline_1.UserGroupIcon, color: "text-indigo-600" },
                                                    { label: "Subjects", value: subjects.length, icon: outline_1.BookOpenIcon, color: "text-purple-600" },
                                                    { label: "Marks Recorded", value: marks.length, icon: outline_1.ChartBarIcon, color: "text-green-600" },
                                                    { label: "Pending Upload", value: students.length * subjects.length - marks.length, icon: outline_1.ArrowUpTrayIcon, color: "text-orange-600" },
                                                ].map((card) => {
                                                    const Icon = card.icon;
                                                    return ((0, jsx_runtime_1.jsx)("div", { className: "bg-white rounded-lg shadow p-6", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center", children: [(0, jsx_runtime_1.jsx)(Icon, { className: `h-8 w-8 ${card.color}` }), (0, jsx_runtime_1.jsxs)("div", { className: "ml-4", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-medium text-gray-600", children: card.label }), (0, jsx_runtime_1.jsx)("p", { className: "text-2xl font-semibold text-gray-900", children: card.value })] })] }) }, card.label));
                                                }) }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "bg-white rounded-lg shadow p-6", children: [(0, jsx_runtime_1.jsx)("h4", { className: "text-lg font-medium text-gray-900 mb-4", children: "Subjects I Teach" }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-2", children: subjects.map((s) => ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between py-2 border-b border-gray-100 last:border-0", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-medium text-gray-900", children: s.name }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-gray-500", children: s.code })] }), (0, jsx_runtime_1.jsxs)("span", { className: "text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full", children: [marks.filter((m) => m.subject === s.name).length, " marks"] })] }, s.id))) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-white rounded-lg shadow p-6", children: [(0, jsx_runtime_1.jsx)("h4", { className: "text-lg font-medium text-gray-900 mb-4", children: "Recent Marks" }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-2", children: marks.slice(0, 6).map((m, i) => {
                                                                    const g = grade(m.score, m.maxScore);
                                                                    return ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between py-2 border-b border-gray-100 last:border-0", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-medium text-gray-900", children: m.studentName }), (0, jsx_runtime_1.jsxs)("p", { className: "text-xs text-gray-500", children: [m.subject, " \u00B7 ", m.term] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-2", children: [(0, jsx_runtime_1.jsxs)("span", { className: "text-sm text-gray-700", children: [m.score, "/", m.maxScore] }), (0, jsx_runtime_1.jsx)("span", { className: `text-xs font-semibold px-2 py-0.5 rounded-full ${g.color}`, children: g.label })] })] }, i));
                                                                }) })] })] })] })), activeSection === "students" && ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("h3", { className: "text-2xl font-bold text-gray-900", children: ["My Students \u2014 ", classLabel] }), (0, jsx_runtime_1.jsx)("div", { className: "bg-white rounded-lg shadow p-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "relative", children: [(0, jsx_runtime_1.jsx)(outline_1.MagnifyingGlassIcon, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" }), (0, jsx_runtime_1.jsx)("input", { type: "text", placeholder: "Search students...", value: search, onChange: (e) => setSearch(e.target.value), className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" })] }) }), (0, jsx_runtime_1.jsx)("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden", children: (0, jsx_runtime_1.jsx)("div", { className: "overflow-x-auto", children: (0, jsx_runtime_1.jsxs)("table", { className: "min-w-full", children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { className: "border-b border-gray-200 bg-gray-50", children: [(0, jsx_runtime_1.jsx)("th", { className: "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider", children: "Student" }), (0, jsx_runtime_1.jsx)("th", { className: "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider", children: "Marks Recorded" }), (0, jsx_runtime_1.jsx)("th", { className: "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider", children: "Avg Score" }), (0, jsx_runtime_1.jsx)("th", { className: "px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider", children: "Actions" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { className: "divide-y divide-gray-100", children: filteredStudents.map((s) => {
                                                                    const studentMarks = marks.filter((m) => m.studentId === s.id);
                                                                    const avg = studentMarks.length
                                                                        ? Math.round(studentMarks.reduce((a, m) => a + (m.score / m.maxScore) * 100, 0) / studentMarks.length)
                                                                        : null;
                                                                    const g = avg !== null ? grade(avg, 100) : null;
                                                                    return ((0, jsx_runtime_1.jsxs)("tr", { className: "hover:bg-gray-50 transition-colors", children: [(0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center", children: [(0, jsx_runtime_1.jsx)("div", { className: "h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center", children: (0, jsx_runtime_1.jsx)("span", { className: "text-sm font-medium text-indigo-600", children: s.firstName.charAt(0) }) }), (0, jsx_runtime_1.jsxs)("div", { className: "ml-3", children: [(0, jsx_runtime_1.jsxs)("p", { className: "text-sm font-medium text-gray-900", children: [s.firstName, " ", s.lastName] }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-gray-500", children: s.email })] })] }) }), (0, jsx_runtime_1.jsxs)("td", { className: "px-6 py-4 text-sm text-gray-700", children: [studentMarks.length, " / ", subjects.length] }), (0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4", children: avg !== null && g ? ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-2", children: [(0, jsx_runtime_1.jsxs)("span", { className: "text-sm text-gray-700", children: [avg, "%"] }), (0, jsx_runtime_1.jsx)("span", { className: `text-xs font-semibold px-2 py-0.5 rounded-full ${g.color}`, children: g.label })] })) : ((0, jsx_runtime_1.jsx)("span", { className: "text-xs text-gray-400", children: "No marks yet" })) }), (0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4 text-right", children: (0, jsx_runtime_1.jsx)("button", { onClick: () => { setSelectedStudent(s); setShowStudentModal(true); }, className: "px-3 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors", children: "View Report" }) })] }, s.id));
                                                                }) })] }) }) })] })), activeSection === "marks" && ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("h3", { className: "text-2xl font-bold text-gray-900", children: ["Marks \u2014 ", classLabel] }), (0, jsx_runtime_1.jsx)("div", { className: "bg-white rounded-lg shadow p-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "relative", children: [(0, jsx_runtime_1.jsx)(outline_1.MagnifyingGlassIcon, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" }), (0, jsx_runtime_1.jsx)("input", { type: "text", placeholder: "Search by student or subject...", value: search, onChange: (e) => setSearch(e.target.value), className: "w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" })] }) }), (0, jsx_runtime_1.jsx)("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden", children: (0, jsx_runtime_1.jsx)("div", { className: "overflow-x-auto", children: (0, jsx_runtime_1.jsxs)("table", { className: "min-w-full", children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { className: "border-b border-gray-200 bg-gray-50", children: [(0, jsx_runtime_1.jsx)("th", { className: "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider", children: "Student" }), (0, jsx_runtime_1.jsx)("th", { className: "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider", children: "Subject" }), (0, jsx_runtime_1.jsx)("th", { className: "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider", children: "Score" }), (0, jsx_runtime_1.jsx)("th", { className: "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider", children: "Grade" }), (0, jsx_runtime_1.jsx)("th", { className: "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider", children: "Term" }), (0, jsx_runtime_1.jsx)("th", { className: "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider", children: "Year" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { className: "divide-y divide-gray-100", children: filteredMarks.map((m, i) => {
                                                                    const g = grade(m.score, m.maxScore);
                                                                    return ((0, jsx_runtime_1.jsxs)("tr", { className: "hover:bg-gray-50 transition-colors", children: [(0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center", children: [(0, jsx_runtime_1.jsx)("div", { className: "h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center", children: (0, jsx_runtime_1.jsx)("span", { className: "text-xs font-medium text-indigo-600", children: m.studentName.charAt(0) }) }), (0, jsx_runtime_1.jsx)("p", { className: "ml-3 text-sm font-medium text-gray-900", children: m.studentName })] }) }), (0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4 text-sm text-gray-700", children: m.subject }), (0, jsx_runtime_1.jsxs)("td", { className: "px-6 py-4 text-sm text-gray-700", children: [m.score, " / ", m.maxScore] }), (0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4", children: (0, jsx_runtime_1.jsx)("span", { className: `text-xs font-semibold px-2 py-0.5 rounded-full ${g.color}`, children: g.label }) }), (0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4 text-sm text-gray-500", children: m.term }), (0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4 text-sm text-gray-500", children: m.year })] }, i));
                                                                }) })] }) }) })] })), activeSection === "upload" && ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-2xl font-bold text-gray-900", children: "Upload Marks" }), (0, jsx_runtime_1.jsx)("div", { className: "bg-indigo-50 border border-indigo-200 rounded-lg p-6", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-start justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h4", { className: "text-sm font-semibold text-indigo-900 mb-1", children: "Before you upload" }), (0, jsx_runtime_1.jsxs)("ul", { className: "text-sm text-indigo-800 space-y-1 list-disc list-inside", children: [(0, jsx_runtime_1.jsxs)("li", { children: ["File must be ", (0, jsx_runtime_1.jsx)("span", { className: "font-medium", children: ".csv" }), " format (export from Excel as CSV)"] }), (0, jsx_runtime_1.jsxs)("li", { children: ["Required columns: ", (0, jsx_runtime_1.jsx)("span", { className: "font-mono text-xs bg-indigo-100 px-1 rounded", children: "Student Name, Subject, Test, Exam, Term, Year" })] }), (0, jsx_runtime_1.jsx)("li", { children: "Student names must exactly match enrolled students" }), (0, jsx_runtime_1.jsx)("li", { children: "Subject names must match registered subjects" }), (0, jsx_runtime_1.jsxs)("li", { children: ["Term must be: ", (0, jsx_runtime_1.jsx)("span", { className: "font-medium", children: "Term 1, Term 2" }), " or ", (0, jsx_runtime_1.jsx)("span", { className: "font-medium", children: "Term 3" })] }), (0, jsx_runtime_1.jsxs)("li", { children: [(0, jsx_runtime_1.jsx)("span", { className: "font-medium", children: "Test" }), " is out of ", TEST_MAX, " and ", (0, jsx_runtime_1.jsx)("span", { className: "font-medium", children: "Exam" }), " is out of ", EXAM_MAX, " (total ", TEST_MAX + EXAM_MAX, ")"] }), (0, jsx_runtime_1.jsx)("li", { children: "No duplicate entries (same student + subject + term + year)" })] })] }), (0, jsx_runtime_1.jsxs)("a", { href: templateHref, download: "marks_template.csv", className: "ml-4 flex-shrink-0 inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors", children: [(0, jsx_runtime_1.jsx)(outline_1.DocumentArrowDownIcon, { className: "h-4 w-4 mr-2" }), "Download Template"] })] }) }), uploadStep === "idle" && ((0, jsx_runtime_1.jsxs)("div", { onClick: () => fileInputRef.current?.click(), className: "bg-white border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors", children: [(0, jsx_runtime_1.jsx)(outline_1.ArrowUpTrayIcon, { className: "h-12 w-12 text-gray-400 mx-auto mb-4" }), (0, jsx_runtime_1.jsx)("p", { className: "text-lg font-medium text-gray-700", children: "Click to upload your marks file" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-500 mt-1", children: "Supports .csv files (Excel export)" }), (0, jsx_runtime_1.jsx)("input", { ref: fileInputRef, type: "file", accept: ".csv,.xlsx", className: "hidden", onChange: handleFileChange })] })), uploadStep === "preview" && ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between bg-white rounded-lg shadow px-6 py-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-3", children: [(0, jsx_runtime_1.jsx)(outline_1.ArrowUpTrayIcon, { className: "h-5 w-5 text-indigo-600" }), (0, jsx_runtime_1.jsx)("span", { className: "text-sm font-medium text-gray-900", children: fileName }), (0, jsx_runtime_1.jsxs)("span", { className: "text-xs text-gray-500", children: [parsedRows.length, " rows"] })] }), (0, jsx_runtime_1.jsx)("button", { onClick: resetUpload, className: "text-sm text-gray-500 hover:text-red-600 transition-colors", children: "Change file" })] }), globalErrors.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center mb-2", children: [(0, jsx_runtime_1.jsx)(outline_1.ExclamationTriangleIcon, { className: "h-5 w-5 text-red-600 mr-2" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold text-red-800", children: "File cannot be processed" })] }), (0, jsx_runtime_1.jsx)("ul", { className: "text-sm text-red-700 list-disc list-inside space-y-1", children: globalErrors.map((e, i) => (0, jsx_runtime_1.jsx)("li", { children: e }, i)) })] })), globalErrors.length === 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-3 gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "bg-white rounded-lg shadow p-4 text-center", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-2xl font-bold text-gray-900", children: parsedRows.length }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-500", children: "Total Rows" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-white rounded-lg shadow p-4 text-center", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-2xl font-bold text-green-600", children: validRows.length }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-500", children: "Valid" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-white rounded-lg shadow p-4 text-center", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-2xl font-bold text-red-600", children: invalidRows.length }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-500", children: "Errors" })] })] })), parsedRows.length > 0 && globalErrors.length === 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden", children: [(0, jsx_runtime_1.jsx)("div", { className: "px-6 py-3 bg-gray-50 border-b border-gray-200", children: (0, jsx_runtime_1.jsx)("p", { className: "text-sm font-medium text-gray-700", children: "Preview \u2014 all rows must be valid before submitting" }) }), (0, jsx_runtime_1.jsx)("div", { className: "overflow-x-auto", children: (0, jsx_runtime_1.jsxs)("table", { className: "min-w-full", children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { className: "border-b border-gray-200 bg-gray-50", children: [(0, jsx_runtime_1.jsx)("th", { className: "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase", children: "Row" }), (0, jsx_runtime_1.jsx)("th", { className: "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase", children: "Student" }), (0, jsx_runtime_1.jsx)("th", { className: "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase", children: "Subject" }), (0, jsx_runtime_1.jsx)("th", { className: "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase", children: "Test" }), (0, jsx_runtime_1.jsx)("th", { className: "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase", children: "Exam" }), (0, jsx_runtime_1.jsx)("th", { className: "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase", children: "Total" }), (0, jsx_runtime_1.jsx)("th", { className: "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase", children: "Term" }), (0, jsx_runtime_1.jsx)("th", { className: "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase", children: "Year" }), (0, jsx_runtime_1.jsx)("th", { className: "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase", children: "Status" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { className: "divide-y divide-gray-100", children: parsedRows.map((row, i) => ((0, jsx_runtime_1.jsxs)("tr", { className: row.valid ? "hover:bg-gray-50" : "bg-red-50", children: [(0, jsx_runtime_1.jsx)("td", { className: "px-4 py-3 text-xs text-gray-500", children: i + 2 }), (0, jsx_runtime_1.jsx)("td", { className: "px-4 py-3 text-sm text-gray-900", children: row.studentName || "—" }), (0, jsx_runtime_1.jsx)("td", { className: "px-4 py-3 text-sm text-gray-700", children: row.subject || "—" }), (0, jsx_runtime_1.jsxs)("td", { className: "px-4 py-3 text-sm text-gray-700", children: [row.test, "/", TEST_MAX] }), (0, jsx_runtime_1.jsxs)("td", { className: "px-4 py-3 text-sm text-gray-700", children: [row.exam, "/", EXAM_MAX] }), (0, jsx_runtime_1.jsxs)("td", { className: "px-4 py-3 text-sm font-medium text-gray-900", children: [row.test + row.exam, "/", TEST_MAX + EXAM_MAX] }), (0, jsx_runtime_1.jsx)("td", { className: "px-4 py-3 text-sm text-gray-500", children: row.term || "—" }), (0, jsx_runtime_1.jsx)("td", { className: "px-4 py-3 text-sm text-gray-500", children: row.year || "—" }), (0, jsx_runtime_1.jsx)("td", { className: "px-4 py-3", children: row.valid ? ((0, jsx_runtime_1.jsxs)("span", { className: "inline-flex items-center text-xs text-green-700 bg-green-100 px-2 py-0.5 rounded-full", children: [(0, jsx_runtime_1.jsx)(outline_1.CheckCircleIcon, { className: "h-3 w-3 mr-1" }), " Valid"] })) : ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("span", { className: "inline-flex items-center text-xs text-red-700 bg-red-100 px-2 py-0.5 rounded-full mb-1", children: [(0, jsx_runtime_1.jsx)(outline_1.ExclamationTriangleIcon, { className: "h-3 w-3 mr-1" }), " Error"] }), (0, jsx_runtime_1.jsx)("ul", { className: "text-xs text-red-600 list-disc list-inside", children: row.errors.map((e, j) => (0, jsx_runtime_1.jsx)("li", { children: e }, j)) })] })) })] }, i))) })] }) })] })), submitError && ((0, jsx_runtime_1.jsxs)("div", { className: "bg-red-50 border border-red-200 rounded-lg p-4 flex items-center", children: [(0, jsx_runtime_1.jsx)(outline_1.ExclamationTriangleIcon, { className: "h-5 w-5 text-red-600 mr-2 flex-shrink-0" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-red-700", children: submitError })] })), globalErrors.length === 0 && parsedRows.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between bg-white rounded-lg shadow px-6 py-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-sm text-gray-600", children: invalidRows.length > 0
                                                                    ? (0, jsx_runtime_1.jsxs)("span", { className: "text-red-600 font-medium", children: ["Fix ", invalidRows.length, " error(s) in your file before submitting."] })
                                                                    : (0, jsx_runtime_1.jsxs)("span", { className: "text-green-600 font-medium", children: ["All ", validRows.length, " rows are valid and ready to submit."] }) }), (0, jsx_runtime_1.jsxs)("div", { className: "flex space-x-3", children: [(0, jsx_runtime_1.jsx)("button", { onClick: resetUpload, className: "px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm", children: "Cancel" }), (0, jsx_runtime_1.jsx)("button", { onClick: handleSubmit, disabled: invalidRows.length > 0 || isSubmitting, className: "px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed", children: isSubmitting ? "Saving..." : `Submit ${validRows.length} Marks` })] })] }))] })), uploadStep === "success" && ((0, jsx_runtime_1.jsxs)("div", { className: "bg-white rounded-xl shadow p-12 text-center", children: [(0, jsx_runtime_1.jsx)(outline_1.CheckCircleIcon, { className: "h-16 w-16 text-green-500 mx-auto mb-4" }), (0, jsx_runtime_1.jsx)("h4", { className: "text-xl font-semibold text-gray-900 mb-2", children: "Marks Submitted Successfully" }), (0, jsx_runtime_1.jsxs)("p", { className: "text-gray-500 mb-6", children: [savedCount, " mark records have been saved to the database. Parents can now view their child's report."] }), (0, jsx_runtime_1.jsx)("button", { onClick: () => { resetUpload(); setActiveSection("marks"); }, className: "px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors", children: "View Marks" })] }))] })), activeSection === "discipline" && ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("h3", { className: "text-2xl font-bold text-gray-900", children: ["Discipline \u2014 ", classLabel] }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 p-6", children: [(0, jsx_runtime_1.jsx)("h4", { className: "text-base font-semibold text-gray-900 mb-1", children: "Record a merit or demerit" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-500 mb-4", children: "Logged records appear on the student's report card for their parent." }), (0, jsx_runtime_1.jsxs)("form", { onSubmit: submitDiscipline, className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Student" }), (0, jsx_runtime_1.jsxs)("select", { value: discForm.studentId, onChange: (e) => { setDiscForm((f) => ({ ...f, studentId: e.target.value })); setDiscSaved(false); }, className: "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500", children: [(0, jsx_runtime_1.jsx)("option", { value: "", children: "Select a student\u2026" }), students.map((s) => ((0, jsx_runtime_1.jsxs)("option", { value: s.id, children: [s.firstName, " ", s.lastName] }, s.id)))] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Type" }), (0, jsx_runtime_1.jsxs)("select", { value: discForm.type, onChange: (e) => setDiscForm((f) => ({ ...f, type: e.target.value })), className: "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500", children: [(0, jsx_runtime_1.jsx)("option", { value: "Merit", children: "Merit" }), (0, jsx_runtime_1.jsx)("option", { value: "Demerit", children: "Demerit" })] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Category" }), (0, jsx_runtime_1.jsx)("input", { type: "text", value: discForm.category, onChange: (e) => setDiscForm((f) => ({ ...f, category: e.target.value })), placeholder: "e.g. Academic Excellence, Late Arrival", className: "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-2 gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Points" }), (0, jsx_runtime_1.jsx)("input", { type: "number", min: "1", value: discForm.points, onChange: (e) => setDiscForm((f) => ({ ...f, points: e.target.value })), className: "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Date" }), (0, jsx_runtime_1.jsx)("input", { type: "date", value: discForm.date, onChange: (e) => setDiscForm((f) => ({ ...f, date: e.target.value })), className: "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: ["Note ", (0, jsx_runtime_1.jsx)("span", { className: "text-gray-400", children: "(optional)" })] }), (0, jsx_runtime_1.jsx)("textarea", { value: discForm.note, onChange: (e) => setDiscForm((f) => ({ ...f, note: e.target.value })), rows: 2, placeholder: "Brief context for this record\u2026", className: "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: ["Action Taken ", (0, jsx_runtime_1.jsx)("span", { className: "text-gray-400", children: "(optional)" })] }), (0, jsx_runtime_1.jsx)("input", { type: "text", value: discForm.actionTaken, onChange: (e) => setDiscForm((f) => ({ ...f, actionTaken: e.target.value })), placeholder: "e.g. Verbal warning, Certificate awarded, Parent notified", className: "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { className: "text-sm", children: [discSaved && (0, jsx_runtime_1.jsx)("span", { className: "text-green-600", children: "Record saved \u2713" }), discError && (0, jsx_runtime_1.jsx)("span", { className: "text-red-600", children: discError })] }), (0, jsx_runtime_1.jsx)("button", { type: "submit", disabled: discSubmitting, className: "inline-flex items-center px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed", children: discSubmitting ? "Saving…" : "Save Record" })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden", children: [(0, jsx_runtime_1.jsx)("div", { className: "px-6 py-4 bg-gray-50 border-b border-gray-200", children: (0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold text-gray-700", children: "Recent Records" }) }), discRecords.length === 0 ? ((0, jsx_runtime_1.jsxs)("div", { className: "text-center py-12", children: [(0, jsx_runtime_1.jsx)(outline_1.ShieldExclamationIcon, { className: "h-12 w-12 text-gray-300 mx-auto mb-3" }), (0, jsx_runtime_1.jsx)("p", { className: "text-gray-500", children: "No discipline records yet." })] })) : ((0, jsx_runtime_1.jsx)("div", { className: "overflow-x-auto", children: (0, jsx_runtime_1.jsxs)("table", { className: "min-w-full", children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { className: "border-b border-gray-200 bg-gray-50", children: [(0, jsx_runtime_1.jsx)("th", { className: "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider", children: "Date" }), (0, jsx_runtime_1.jsx)("th", { className: "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider", children: "Student" }), (0, jsx_runtime_1.jsx)("th", { className: "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider", children: "Type" }), (0, jsx_runtime_1.jsx)("th", { className: "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider", children: "Category" }), (0, jsx_runtime_1.jsx)("th", { className: "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider", children: "Points" }), (0, jsx_runtime_1.jsx)("th", { className: "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider", children: "Note" }), (0, jsx_runtime_1.jsx)("th", { className: "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider", children: "Action Taken" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { className: "divide-y divide-gray-100", children: discRecords.map((d) => ((0, jsx_runtime_1.jsxs)("tr", { className: "hover:bg-gray-50 transition-colors", children: [(0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4 text-sm text-gray-700 whitespace-nowrap", children: d.date }), (0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4 text-sm font-medium text-gray-900", children: d.studentName }), (0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4", children: (0, jsx_runtime_1.jsx)("span", { className: `text-xs font-semibold px-2.5 py-1 rounded-full ${d.type === "Merit" ? "text-green-700 bg-green-100" : "text-red-700 bg-red-100"}`, children: d.type }) }), (0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4 text-sm text-gray-900", children: d.category }), (0, jsx_runtime_1.jsx)("td", { className: `px-6 py-4 text-sm font-semibold ${d.points >= 0 ? "text-green-700" : "text-red-700"}`, children: d.points > 0 ? `+${d.points}` : d.points }), (0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4 text-sm text-gray-500", children: d.note || "—" }), (0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4 text-sm text-gray-500", children: d.actionTaken || "—" })] }, d.id))) })] }) }))] })] }))] })) }) })] }), showStudentModal && selectedStudent && ((0, jsx_runtime_1.jsx)("div", { className: "fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50", children: (0, jsx_runtime_1.jsxs)("div", { className: "relative top-10 mx-auto p-6 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-lg bg-white", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-center mb-6", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-lg font-semibold text-gray-900", children: "Student Report" }), (0, jsx_runtime_1.jsx)("button", { onClick: () => setShowStudentModal(false), className: "text-gray-400 hover:text-gray-600", children: (0, jsx_runtime_1.jsx)(outline_1.XMarkIcon, { className: "h-6 w-6" }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-4 pb-4 border-b mb-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "h-14 w-14 rounded-full bg-indigo-100 flex items-center justify-center", children: (0, jsx_runtime_1.jsx)("span", { className: "text-xl font-bold text-indigo-600", children: selectedStudent.firstName.charAt(0) }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("h4", { className: "text-lg font-semibold text-gray-900", children: [selectedStudent.firstName, " ", selectedStudent.lastName] }), (0, jsx_runtime_1.jsxs)("p", { className: "text-sm text-gray-500", children: [selectedStudent.email, " \u00B7 ", classLabel] })] })] }), (() => {
                            const studentMarks = marks.filter((m) => m.studentId === selectedStudent.id);
                            if (studentMarks.length === 0) {
                                return (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-500 text-center py-8", children: "No marks recorded yet." });
                            }
                            const avg = Math.round(studentMarks.reduce((a, m) => a + (m.score / m.maxScore) * 100, 0) / studentMarks.length);
                            const g = grade(avg, 100);
                            return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("table", { className: "min-w-full mb-4", children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { className: "border-b border-gray-200 bg-gray-50", children: [(0, jsx_runtime_1.jsx)("th", { className: "px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase", children: "Subject" }), (0, jsx_runtime_1.jsx)("th", { className: "px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase", children: "Score" }), (0, jsx_runtime_1.jsx)("th", { className: "px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase", children: "%" }), (0, jsx_runtime_1.jsx)("th", { className: "px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase", children: "Grade" }), (0, jsx_runtime_1.jsx)("th", { className: "px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase", children: "Term" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { className: "divide-y divide-gray-100", children: studentMarks.map((m, i) => {
                                                    const pct = Math.round((m.score / m.maxScore) * 100);
                                                    const gr = grade(m.score, m.maxScore);
                                                    return ((0, jsx_runtime_1.jsxs)("tr", { className: "hover:bg-gray-50", children: [(0, jsx_runtime_1.jsx)("td", { className: "px-4 py-3 text-sm text-gray-900", children: m.subject }), (0, jsx_runtime_1.jsxs)("td", { className: "px-4 py-3 text-sm text-gray-700", children: [m.score, "/", m.maxScore] }), (0, jsx_runtime_1.jsxs)("td", { className: "px-4 py-3 text-sm text-gray-700", children: [pct, "%"] }), (0, jsx_runtime_1.jsx)("td", { className: "px-4 py-3", children: (0, jsx_runtime_1.jsx)("span", { className: `text-xs font-semibold px-2 py-0.5 rounded-full ${gr.color}`, children: gr.label }) }), (0, jsx_runtime_1.jsxs)("td", { className: "px-4 py-3 text-sm text-gray-500", children: [m.term, " ", m.year] })] }, i));
                                                }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-sm font-medium text-gray-700", children: "Overall Average" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-2", children: [(0, jsx_runtime_1.jsxs)("span", { className: "text-sm font-semibold text-gray-900", children: [avg, "%"] }), (0, jsx_runtime_1.jsx)("span", { className: `text-xs font-semibold px-2 py-0.5 rounded-full ${g.color}`, children: g.label })] })] })] }));
                        })(), (0, jsx_runtime_1.jsx)("div", { className: "mt-6 flex justify-end", children: (0, jsx_runtime_1.jsx)("button", { onClick: () => setShowStudentModal(false), className: "px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors", children: "Close" }) })] }) }))] }));
}
//# sourceMappingURL=page.js.map