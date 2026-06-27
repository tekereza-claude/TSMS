"use client";
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ParentDashboard;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("next-auth/react");
const navigation_1 = require("next/navigation");
const react_2 = require("react");
const outline_1 = require("@heroicons/react/24/outline");
const LanguageToggle_1 = __importDefault(require("@/components/LanguageToggle"));
const TEST_MAX = 50;
const EXAM_MAX = 50;
async function fetchJson(url) {
    const res = await fetch(url);
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Request failed (${res.status})`);
    }
    return res.json();
}
function normalizeChild(c) {
    return {
        id: String(c._id),
        firstName: c.firstName,
        lastName: c.lastName,
        class: c.class?.name ?? "—",
        grade: c.class?.grade ?? "",
    };
}
function normalizeMark(m) {
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
    };
}
function normalizeDiscipline(d) {
    return {
        date: typeof d.date === "string" ? d.date.slice(0, 10) : String(d.date),
        type: d.type,
        category: d.category,
        points: d.points,
        note: d.note ?? "",
        actionTaken: d.actionTaken,
        recordedBy: d.recordedBy ?? "School",
    };
}
function normalizeFee(f) {
    if (!f)
        return undefined;
    return {
        currency: f.currency ?? "RWF",
        dueDate: f.dueDate ?? "",
        items: (f.items ?? []).map((it) => ({ item: it.item, amount: it.amount, term: it.term })),
        paid: f.paid ?? 0,
    };
}
function normalizeCluster(c) {
    return {
        id: c.clusterId,
        title: c.title,
        emoji: c.emoji ?? "",
        description: c.description ?? "",
        careers: c.careers ?? [],
        subjects: c.subjects ?? [],
        color: c.color ?? "border-gray-400 bg-gray-50",
        minScore: c.minScore ?? 60,
    };
}
function computeCareerRecommendations(marks, clusters) {
    if (marks.length === 0 || clusters.length === 0)
        return [];
    // Build subject → average score map across all terms
    const subjectMap = {};
    for (const m of marks) {
        if (!subjectMap[m.subject])
            subjectMap[m.subject] = [];
        subjectMap[m.subject].push((m.score / m.maxScore) * 100);
    }
    const subjectAvg = {};
    for (const [subj, scores] of Object.entries(subjectMap)) {
        subjectAvg[subj] = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    }
    const results = [];
    for (const cluster of clusters) {
        // Find which of this cluster's subjects the student actually has marks for
        const matched = cluster.subjects.filter((s) => subjectAvg[s] !== undefined);
        if (matched.length === 0)
            continue;
        // Average score across matched subjects
        const clusterAvg = Math.round(matched.reduce((sum, s) => sum + subjectAvg[s], 0) / matched.length);
        if (clusterAvg < cluster.minScore)
            continue;
        // Match score: weighted by how many cluster subjects are covered + performance
        const coverage = matched.length / cluster.subjects.length;
        const matchScore = Math.round(clusterAvg * 0.7 + coverage * 100 * 0.3);
        results.push({
            cluster,
            matchScore,
            topSubjects: matched.sort((a, b) => subjectAvg[b] - subjectAvg[a]),
        });
    }
    // Sort by match score descending, return top 4
    return results.sort((a, b) => b.matchScore - a.matchScore).slice(0, 4);
}
// ─── Helpers ─────────────────────────────────────────────────────────────────
function gradeInfo(score, max) {
    const pct = (score / max) * 100;
    if (pct >= 90)
        return { label: "A+", color: "text-emerald-700 bg-emerald-100", bar: "bg-emerald-500" };
    if (pct >= 80)
        return { label: "A", color: "text-green-700 bg-green-100", bar: "bg-green-500" };
    if (pct >= 70)
        return { label: "B", color: "text-blue-700 bg-blue-100", bar: "bg-blue-500" };
    if (pct >= 60)
        return { label: "C", color: "text-yellow-700 bg-yellow-100", bar: "bg-yellow-500" };
    if (pct >= 50)
        return { label: "D", color: "text-orange-700 bg-orange-100", bar: "bg-orange-500" };
    return { label: "F", color: "text-red-700 bg-red-100", bar: "bg-red-500" };
}
function avg(marks) {
    if (!marks.length)
        return 0;
    return Math.round(marks.reduce((a, m) => a + (m.score / m.maxScore) * 100, 0) / marks.length);
}
const TERMS = ["Term 1", "Term 2", "Term 3"];
// ─── Component ────────────────────────────────────────────────────────────────
function ParentDashboard() {
    const { data: session, status } = (0, react_1.useSession)();
    const router = (0, navigation_1.useRouter)();
    const [activeSection, setActiveSection] = (0, react_2.useState)("overview");
    const [selectedChild, setSelectedChild] = (0, react_2.useState)(null);
    const [selectedTerm, setSelectedTerm] = (0, react_2.useState)("Term 1");
    const [showChildDropdown, setShowChildDropdown] = (0, react_2.useState)(false);
    // Children + their marks/discipline/fees, loaded from /api/parents/me
    const [children, setChildren] = (0, react_2.useState)([]);
    const [marksByChild, setMarksByChild] = (0, react_2.useState)({});
    const [disciplineByChild, setDisciplineByChild] = (0, react_2.useState)({});
    const [feeByChild, setFeeByChild] = (0, react_2.useState)({});
    const [careerClusters, setCareerClusters] = (0, react_2.useState)([]);
    const [dataLoading, setDataLoading] = (0, react_2.useState)(true);
    const [loadError, setLoadError] = (0, react_2.useState)(null);
    const [commentText, setCommentText] = (0, react_2.useState)("");
    const [commentState, setCommentState] = (0, react_2.useState)("idle");
    const [commentError, setCommentError] = (0, react_2.useState)("");
    const [myComments, setMyComments] = (0, react_2.useState)([]);
    (0, react_2.useEffect)(() => {
        if (status === "loading")
            return;
        if (!session) {
            router.push("/auth/signin");
            return;
        }
        if (session.user.role !== "PARENT") {
            router.push("/");
            return;
        }
    }, [session, status, router]);
    // Load the parent's previously submitted messages
    (0, react_2.useEffect)(() => {
        if (status !== "authenticated")
            return;
        fetch("/api/comments")
            .then((r) => (r.ok ? r.json() : []))
            .then((data) => setMyComments(Array.isArray(data) ? data : []))
            .catch(() => { });
    }, [status]);
    // Load the parent's children + marks/discipline/fees
    (0, react_2.useEffect)(() => {
        if (status !== "authenticated" || session?.user.role !== "PARENT")
            return;
        let cancelled = false;
        (async () => {
            setDataLoading(true);
            setLoadError(null);
            try {
                const [me, clusters] = await Promise.all([
                    fetchJson("/api/parents/me"),
                    fetchJson("/api/careers").catch(() => []),
                ]);
                if (cancelled)
                    return;
                setCareerClusters(clusters.map(normalizeCluster));
                const raw = (me?.students ?? []);
                const marksMap = {};
                const discMap = {};
                const feeMap = {};
                raw.forEach((c) => {
                    const id = String(c._id);
                    marksMap[id] = (c.marks ?? []).map(normalizeMark);
                    discMap[id] = (c.discipline ?? []).map(normalizeDiscipline);
                    feeMap[id] = normalizeFee(c.fee);
                });
                const kids = raw.map(normalizeChild);
                setChildren(kids);
                setMarksByChild(marksMap);
                setDisciplineByChild(discMap);
                setFeeByChild(feeMap);
                setSelectedChild((prev) => prev ?? kids[0] ?? null);
            }
            catch (e) {
                if (!cancelled)
                    setLoadError(e instanceof Error ? e.message : "Failed to load your children's data");
            }
            finally {
                if (!cancelled)
                    setDataLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [status, session?.user.role]);
    async function submitComment(e) {
        e.preventDefault();
        if (!commentText.trim())
            return;
        setCommentState("sending");
        setCommentError("");
        try {
            const res = await fetch("/api/comments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: commentText.trim(),
                    regarding: selectedChild ? `${selectedChild.firstName} ${selectedChild.lastName}` : undefined,
                }),
            });
            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || "Failed to send message");
            }
            const created = await res.json();
            setMyComments((prev) => [created, ...prev]);
            setCommentText("");
            setCommentState("sent");
        }
        catch (err) {
            setCommentError(err instanceof Error ? err.message : "Failed to send message");
            setCommentState("error");
        }
    }
    const childId = selectedChild?.id;
    const allMarks = childId ? (marksByChild[childId] ?? []) : [];
    const termMarks = allMarks.filter((m) => m.term === selectedTerm);
    const childAvg = avg(termMarks);
    const childGrade = gradeInfo(childAvg, 100);
    const selectedYear = termMarks[0]?.year ?? allMarks[0]?.year ?? "";
    // Career recommendations — based on all-term data
    const careerRecs = computeCareerRecommendations(allMarks, careerClusters);
    const hasEnoughData = allMarks.length >= 3;
    // Best and weakest subject this term
    const sorted = [...termMarks].sort((a, b) => (b.score / b.maxScore) - (a.score / a.maxScore));
    const best = sorted[0];
    const weakest = sorted[sorted.length - 1];
    // Discipline & financial
    const disciplineRecords = childId ? (disciplineByChild[childId] ?? []) : [];
    const merits = disciplineRecords.filter((d) => d.type === "Merit").reduce((a, d) => a + d.points, 0);
    const demerits = disciplineRecords.filter((d) => d.type === "Demerit").reduce((a, d) => a + Math.abs(d.points), 0);
    const conductScore = merits - demerits;
    const conductLabel = conductScore >= 5 ? "Excellent" : conductScore >= 0 ? "Good" : "Needs Attention";
    const conductColor = conductScore >= 5 ? "text-green-700 bg-green-100" : conductScore >= 0 ? "text-blue-700 bg-blue-100" : "text-red-700 bg-red-100";
    const feeAccount = childId ? feeByChild[childId] : undefined;
    const feeTotal = feeAccount ? feeAccount.items.reduce((a, f) => a + f.amount, 0) : 0;
    const feeBalance = feeAccount ? feeTotal - feeAccount.paid : 0;
    const feePaidPct = feeTotal > 0 ? Math.min(Math.round((feeAccount.paid / feeTotal) * 100), 100) : 0;
    const fmtMoney = (n) => `${feeAccount?.currency ?? ""} ${n.toLocaleString()}`;
    const menuItems = [
        { id: "overview", label: "Overview", icon: outline_1.ChartBarIcon },
        { id: "report", label: "Report Card", icon: outline_1.BookOpenIcon },
        { id: "discipline_financial", label: "Discipline & Financial", icon: outline_1.ShieldExclamationIcon },
        { id: "messages", label: "Messages", icon: outline_1.ChatBubbleLeftRightIcon },
        { id: "careers", label: "Career Insights", icon: outline_1.LightBulbIcon },
    ];
    if (status === "loading" || dataLoading) {
        return ((0, jsx_runtime_1.jsx)("div", { className: "min-h-screen flex items-center justify-center", children: (0, jsx_runtime_1.jsx)("div", { className: "animate-spin rounded-full h-32 w-32 border-b-2 border-rose-600" }) }));
    }
    if (loadError) {
        return ((0, jsx_runtime_1.jsx)("div", { className: "min-h-screen flex items-center justify-center p-6", children: (0, jsx_runtime_1.jsxs)("div", { className: "bg-red-50 border border-red-200 rounded-lg p-8 text-center max-w-md", children: [(0, jsx_runtime_1.jsx)(outline_1.ExclamationTriangleIcon, { className: "h-10 w-10 text-red-500 mx-auto mb-3" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm font-medium text-red-800 mb-4", children: loadError }), (0, jsx_runtime_1.jsx)("button", { onClick: () => window.location.reload(), className: "px-4 py-2 bg-rose-600 text-white text-sm rounded-lg hover:bg-rose-700 transition-colors", children: "Retry" })] }) }));
    }
    if (!selectedChild) {
        return ((0, jsx_runtime_1.jsx)("div", { className: "min-h-screen flex items-center justify-center p-6", children: (0, jsx_runtime_1.jsxs)("div", { className: "bg-white border border-gray-200 rounded-xl shadow-sm p-10 text-center max-w-md", children: [(0, jsx_runtime_1.jsx)(outline_1.UserCircleIcon, { className: "h-12 w-12 text-gray-300 mx-auto mb-4" }), (0, jsx_runtime_1.jsx)("h2", { className: "text-lg font-semibold text-gray-900 mb-2", children: "No children linked yet" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-500 mb-6", children: "Your account isn't linked to any students. Please ask your school administrator to link your child to your account." }), (0, jsx_runtime_1.jsx)("button", { onClick: () => (0, react_1.signOut)({ callbackUrl: "/" }), className: "px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors", children: "Sign Out" })] }) }));
    }
    return ((0, jsx_runtime_1.jsxs)("div", { className: "min-h-screen bg-gray-50", children: [(0, jsx_runtime_1.jsx)("style", { children: `
        @media print {
          body * { visibility: hidden !important; }
          #report-print, #report-print * { visibility: visible !important; }
          #report-print { position: absolute; left: 0; top: 0; width: 100%; padding: 16px; }
          .no-print { display: none !important; }
        }
      ` }), (0, jsx_runtime_1.jsx)("header", { className: "bg-white shadow-sm border-b", children: (0, jsx_runtime_1.jsx)("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex justify-between items-center h-16", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center", children: [(0, jsx_runtime_1.jsx)("div", { className: "h-8 w-8 rounded-lg bg-rose-600 flex items-center justify-center", children: (0, jsx_runtime_1.jsx)(outline_1.UserCircleIcon, { className: "h-5 w-5 text-white" }) }), (0, jsx_runtime_1.jsxs)("div", { className: "ml-4", children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-xl font-semibold text-gray-900", children: "Parent Portal" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-500", children: "Academic Progress Tracker" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-3", children: [(0, jsx_runtime_1.jsx)(LanguageToggle_1.default, {}), (0, jsx_runtime_1.jsx)("div", { className: "h-10 w-10 rounded-full bg-rose-600 flex items-center justify-center", children: (0, jsx_runtime_1.jsx)("span", { className: "text-white text-sm font-medium", children: session?.user?.name?.charAt(0) || "P" }) })] })] }) }) }), (0, jsx_runtime_1.jsxs)("div", { className: "flex", children: [(0, jsx_runtime_1.jsx)("div", { className: "fixed top-16 left-0 z-50 w-64 bg-rose-600 shadow-lg h-[calc(100vh-4rem)]", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex h-full flex-col", children: [(0, jsx_runtime_1.jsxs)("div", { className: "px-4 py-4 border-b border-rose-700", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs text-rose-300 mb-2", children: "Viewing child" }), (0, jsx_runtime_1.jsxs)("div", { className: "relative", children: [(0, jsx_runtime_1.jsxs)("button", { onClick: () => setShowChildDropdown(!showChildDropdown), className: "w-full flex items-center justify-between bg-rose-700 rounded-lg px-3 py-2 text-white hover:bg-rose-800 transition-colors", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center", children: [(0, jsx_runtime_1.jsx)("div", { className: "h-7 w-7 rounded-full bg-white flex items-center justify-center mr-2", children: (0, jsx_runtime_1.jsx)("span", { className: "text-xs font-bold text-rose-600", children: selectedChild.firstName.charAt(0) }) }), (0, jsx_runtime_1.jsxs)("div", { className: "text-left", children: [(0, jsx_runtime_1.jsxs)("p", { className: "text-sm font-semibold", children: [selectedChild.firstName, " ", selectedChild.lastName] }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-rose-300", children: selectedChild.class })] })] }), (0, jsx_runtime_1.jsx)(outline_1.ChevronDownIcon, { className: `h-4 w-4 transition-transform ${showChildDropdown ? "rotate-180" : ""}` })] }), showChildDropdown && ((0, jsx_runtime_1.jsx)("div", { className: "absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg z-10 overflow-hidden", children: children.map((child) => ((0, jsx_runtime_1.jsxs)("button", { onClick: () => { setSelectedChild(child); setShowChildDropdown(false); setSelectedTerm("Term 1"); }, className: `w-full flex items-center px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${selectedChild.id === child.id ? "bg-rose-50" : ""}`, children: [(0, jsx_runtime_1.jsx)("div", { className: "h-7 w-7 rounded-full bg-rose-100 flex items-center justify-center mr-2", children: (0, jsx_runtime_1.jsx)("span", { className: "text-xs font-bold text-rose-600", children: child.firstName.charAt(0) }) }), (0, jsx_runtime_1.jsxs)("div", { className: "text-left", children: [(0, jsx_runtime_1.jsxs)("p", { className: "text-sm font-medium text-gray-900", children: [child.firstName, " ", child.lastName] }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-gray-500", children: child.class })] })] }, child.id))) }))] })] }), (0, jsx_runtime_1.jsx)("nav", { className: "flex-1 px-4 py-4 space-y-2", children: menuItems.map((item) => {
                                        const Icon = item.icon;
                                        return ((0, jsx_runtime_1.jsxs)("button", { onClick: () => setActiveSection(item.id), className: `group flex w-full items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeSection === item.id
                                                ? "bg-white text-rose-600"
                                                : "text-white hover:bg-rose-700"}`, children: [(0, jsx_runtime_1.jsx)(Icon, { className: "mr-3 h-5 w-5" }), item.label] }, item.id));
                                    }) }), (0, jsx_runtime_1.jsx)("div", { className: "p-4 border-t border-rose-700", children: (0, jsx_runtime_1.jsxs)("button", { onClick: () => (0, react_1.signOut)({ callbackUrl: "/" }), className: "flex w-full items-center px-3 py-2 text-sm font-medium text-white rounded-lg hover:bg-red-500 transition-colors", children: [(0, jsx_runtime_1.jsx)(outline_1.ArrowRightOnRectangleIcon, { className: "mr-3 h-5 w-5" }), "Sign Out"] }) })] }) }), (0, jsx_runtime_1.jsx)("div", { className: "pl-64 flex-1", children: (0, jsx_runtime_1.jsxs)("main", { className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between mb-6", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("h3", { className: "text-2xl font-bold text-gray-900", children: [activeSection === "overview" && "Overview", activeSection === "report" && "Report Card", activeSection === "discipline_financial" && "Discipline & Financial", activeSection === "messages" && "Messages to School", activeSection === "careers" && "Career Insights"] }), (0, jsx_runtime_1.jsxs)("p", { className: "text-sm text-gray-500 mt-0.5", children: [selectedChild.firstName, " ", selectedChild.lastName, " \u00B7 ", selectedChild.class] })] }), (0, jsx_runtime_1.jsx)("div", { className: "flex items-center space-x-2", children: TERMS.map((t) => ((0, jsx_runtime_1.jsx)("button", { onClick: () => setSelectedTerm(t), className: `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedTerm === t
                                                    ? "bg-rose-600 text-white"
                                                    : "bg-white text-gray-700 shadow-sm hover:bg-gray-50"}`, children: t }, t))) })] }), activeSection === "overview" && ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6", children: [(0, jsx_runtime_1.jsx)("div", { className: "bg-white rounded-lg shadow p-6", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center", children: [(0, jsx_runtime_1.jsx)(outline_1.ChartBarIcon, { className: "h-8 w-8 text-rose-600" }), (0, jsx_runtime_1.jsxs)("div", { className: "ml-4", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-medium text-gray-600", children: "Average Score" }), (0, jsx_runtime_1.jsx)("p", { className: "text-2xl font-semibold text-gray-900", children: termMarks.length ? `${childAvg}%` : "—" })] })] }) }), (0, jsx_runtime_1.jsx)("div", { className: "bg-white rounded-lg shadow p-6", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center", children: [(0, jsx_runtime_1.jsx)(outline_1.CheckBadgeIcon, { className: "h-8 w-8 text-indigo-600" }), (0, jsx_runtime_1.jsxs)("div", { className: "ml-4", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-medium text-gray-600", children: "Overall Grade" }), (0, jsx_runtime_1.jsx)("p", { className: "text-2xl font-semibold text-gray-900", children: termMarks.length ? childGrade.label : "—" })] })] }) }), (0, jsx_runtime_1.jsx)("div", { className: "bg-white rounded-lg shadow p-6", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center", children: [(0, jsx_runtime_1.jsx)(outline_1.TrophyIcon, { className: "h-8 w-8 text-yellow-500" }), (0, jsx_runtime_1.jsxs)("div", { className: "ml-4", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-medium text-gray-600", children: "Best Subject" }), (0, jsx_runtime_1.jsx)("p", { className: "text-lg font-semibold text-gray-900 truncate", children: best?.subject ?? "—" })] })] }) }), (0, jsx_runtime_1.jsx)("div", { className: "bg-white rounded-lg shadow p-6", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center", children: [(0, jsx_runtime_1.jsx)(outline_1.ClockIcon, { className: "h-8 w-8 text-orange-500" }), (0, jsx_runtime_1.jsxs)("div", { className: "ml-4", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-medium text-gray-600", children: "Needs Attention" }), (0, jsx_runtime_1.jsx)("p", { className: "text-lg font-semibold text-gray-900 truncate", children: weakest?.subject ?? "—" })] })] }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-white rounded-lg shadow p-6", children: [(0, jsx_runtime_1.jsxs)("h4", { className: "text-lg font-medium text-gray-900 mb-6", children: [selectedTerm, " \u2014 Subject Scores"] }), termMarks.length === 0 ? ((0, jsx_runtime_1.jsxs)("p", { className: "text-sm text-gray-400 text-center py-8", children: ["No marks available for ", selectedTerm, "."] })) : ((0, jsx_runtime_1.jsx)("div", { className: "space-y-4", children: termMarks.map((m, i) => {
                                                        const pct = Math.round((m.score / m.maxScore) * 100);
                                                        const g = gradeInfo(m.score, m.maxScore);
                                                        return ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between mb-1", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-sm font-medium text-gray-700", children: m.subject }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-2", children: [(0, jsx_runtime_1.jsxs)("span", { className: "text-sm text-gray-600", children: [m.score, "/", m.maxScore] }), (0, jsx_runtime_1.jsx)("span", { className: `text-xs font-semibold px-2 py-0.5 rounded-full ${g.color}`, children: g.label })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "w-full bg-gray-100 rounded-full h-2.5", children: (0, jsx_runtime_1.jsx)("div", { className: `h-2.5 rounded-full transition-all ${g.bar}`, style: { width: `${pct}%` } }) })] }, i));
                                                    }) }))] })] })), activeSection === "report" && ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsx)("div", { className: "no-print flex justify-end", children: (0, jsx_runtime_1.jsxs)("button", { onClick: () => window.print(), className: "inline-flex items-center px-4 py-2 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 transition-colors shadow-sm", children: [(0, jsx_runtime_1.jsx)(outline_1.PrinterIcon, { className: "h-5 w-5 mr-2" }), "Print / Download PDF"] }) }), (0, jsx_runtime_1.jsxs)("div", { id: "report-print", className: "space-y-6", children: [(0, jsx_runtime_1.jsx)("div", { className: "bg-white rounded-xl shadow p-6 border-t-4 border-rose-600", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-start justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-4", children: [(0, jsx_runtime_1.jsx)("div", { className: "h-16 w-16 rounded-full bg-rose-100 flex items-center justify-center", children: (0, jsx_runtime_1.jsx)("span", { className: "text-2xl font-bold text-rose-600", children: selectedChild.firstName.charAt(0) }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("h4", { className: "text-xl font-bold text-gray-900", children: [selectedChild.firstName, " ", selectedChild.lastName] }), (0, jsx_runtime_1.jsxs)("p", { className: "text-sm text-gray-500", children: [selectedChild.class, " \u00B7 ", selectedTerm, selectedYear ? ` · ${selectedYear}` : ""] })] })] }), termMarks.length > 0 && ((0, jsx_runtime_1.jsxs)("div", { className: "text-right", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-500", children: "Overall Average" }), (0, jsx_runtime_1.jsxs)("p", { className: "text-3xl font-bold text-gray-900", children: [childAvg, "%"] }), (0, jsx_runtime_1.jsxs)("span", { className: `inline-block text-sm font-bold px-3 py-1 rounded-full mt-1 ${childGrade.color}`, children: ["Grade ", childGrade.label] })] }))] }) }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden", children: [(0, jsx_runtime_1.jsx)("div", { className: "px-6 py-4 bg-gray-50 border-b border-gray-200", children: (0, jsx_runtime_1.jsxs)("p", { className: "text-sm font-semibold text-gray-700", children: ["Subject Results \u2014 ", selectedTerm] }) }), termMarks.length === 0 ? ((0, jsx_runtime_1.jsxs)("div", { className: "text-center py-16", children: [(0, jsx_runtime_1.jsx)(outline_1.AcademicCapIcon, { className: "h-12 w-12 text-gray-300 mx-auto mb-3" }), (0, jsx_runtime_1.jsxs)("p", { className: "text-gray-500", children: ["No marks recorded for ", selectedTerm, " yet."] }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-400 mt-1", children: "Check back after your child's teacher uploads results." })] })) : ((0, jsx_runtime_1.jsxs)("table", { className: "min-w-full", children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { className: "border-b border-gray-200 bg-gray-50", children: [(0, jsx_runtime_1.jsx)("th", { className: "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider", children: "Subject" }), (0, jsx_runtime_1.jsx)("th", { className: "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider", children: "Code" }), (0, jsx_runtime_1.jsxs)("th", { className: "px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider", children: ["Test", (0, jsx_runtime_1.jsxs)("span", { className: "block font-normal normal-case text-gray-400", children: ["/", TEST_MAX] })] }), (0, jsx_runtime_1.jsxs)("th", { className: "px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider", children: ["Exam", (0, jsx_runtime_1.jsxs)("span", { className: "block font-normal normal-case text-gray-400", children: ["/", EXAM_MAX] })] }), (0, jsx_runtime_1.jsxs)("th", { className: "px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider", children: ["Total", (0, jsx_runtime_1.jsx)("span", { className: "block font-normal normal-case text-gray-400", children: "/100" })] }), (0, jsx_runtime_1.jsx)("th", { className: "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider", children: "%" }), (0, jsx_runtime_1.jsx)("th", { className: "px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider", children: "Grade" }), (0, jsx_runtime_1.jsx)("th", { className: "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider", children: "Teacher" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { className: "divide-y divide-gray-100", children: termMarks.map((m, i) => {
                                                                        const pct = Math.round((m.score / m.maxScore) * 100);
                                                                        const g = gradeInfo(m.score, m.maxScore);
                                                                        return ((0, jsx_runtime_1.jsxs)("tr", { className: "hover:bg-gray-50 transition-colors", children: [(0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4 text-sm font-medium text-gray-900", children: m.subject }), (0, jsx_runtime_1.jsx)("td", { className: "px-4 py-4", children: (0, jsx_runtime_1.jsx)("span", { className: "text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded", children: m.subjectCode }) }), (0, jsx_runtime_1.jsx)("td", { className: "px-4 py-4 text-sm text-center text-gray-700", children: m.test }), (0, jsx_runtime_1.jsx)("td", { className: "px-4 py-4 text-sm text-center text-gray-700", children: m.exam }), (0, jsx_runtime_1.jsx)("td", { className: "px-4 py-4 text-sm text-center font-semibold text-gray-900", children: m.score }), (0, jsx_runtime_1.jsx)("td", { className: "px-4 py-4", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-2", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-20 bg-gray-100 rounded-full h-2", children: (0, jsx_runtime_1.jsx)("div", { className: `h-2 rounded-full ${g.bar}`, style: { width: `${pct}%` } }) }), (0, jsx_runtime_1.jsxs)("span", { className: "text-sm text-gray-700", children: [pct, "%"] })] }) }), (0, jsx_runtime_1.jsx)("td", { className: "px-4 py-4", children: (0, jsx_runtime_1.jsx)("span", { className: `text-xs font-semibold px-2.5 py-1 rounded-full ${g.color}`, children: g.label }) }), (0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4 text-sm text-gray-500", children: m.teacher })] }, i));
                                                                    }) }), (0, jsx_runtime_1.jsx)("tfoot", { children: (0, jsx_runtime_1.jsxs)("tr", { className: "bg-gray-50 border-t-2 border-gray-200", children: [(0, jsx_runtime_1.jsx)("td", { colSpan: 4, className: "px-6 py-3 text-sm font-semibold text-gray-700", children: "Overall Average" }), (0, jsx_runtime_1.jsx)("td", { className: "px-4 py-3 text-sm text-center font-bold text-gray-900", children: childAvg }), (0, jsx_runtime_1.jsxs)("td", { className: "px-4 py-3 text-sm font-bold text-gray-900", children: [childAvg, "%"] }), (0, jsx_runtime_1.jsx)("td", { className: "px-4 py-3", children: (0, jsx_runtime_1.jsx)("span", { className: `text-xs font-bold px-2.5 py-1 rounded-full ${childGrade.color}`, children: childGrade.label }) }), (0, jsx_runtime_1.jsx)("td", {})] }) })] }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 p-6", children: [(0, jsx_runtime_1.jsx)("h4", { className: "text-sm font-semibold text-gray-700 mb-4", children: "Discipline & Conduct" }), (0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-3 gap-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "text-center rounded-lg bg-green-50 border border-green-100 p-4", children: [(0, jsx_runtime_1.jsxs)("p", { className: "text-2xl font-bold text-green-700", children: ["+", merits] }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-green-800 mt-1", children: "Merit points" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "text-center rounded-lg bg-red-50 border border-red-100 p-4", children: [(0, jsx_runtime_1.jsxs)("p", { className: "text-2xl font-bold text-red-700", children: ["-", demerits] }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-red-800 mt-1", children: "Demerit points" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "text-center rounded-lg bg-gray-50 border border-gray-100 p-4", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-2xl font-bold text-gray-900", children: conductScore }), (0, jsx_runtime_1.jsx)("span", { className: `inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-1 ${conductColor}`, children: conductLabel })] })] })] }), termMarks.length > 0 && ((0, jsx_runtime_1.jsx)("div", { className: `rounded-lg p-4 border ${childAvg >= 70 ? "bg-green-50 border-green-200" : childAvg >= 50 ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200"}`, children: (0, jsx_runtime_1.jsx)("p", { className: `text-sm font-medium ${childAvg >= 70 ? "text-green-800" : childAvg >= 50 ? "text-yellow-800" : "text-red-800"}`, children: childAvg >= 80
                                                            ? `Excellent performance! ${selectedChild.firstName} is doing very well this term.`
                                                            : childAvg >= 70
                                                                ? `Good performance. ${selectedChild.firstName} is on track — keep it up.`
                                                                : childAvg >= 50
                                                                    ? `Average performance. ${selectedChild.firstName} may need extra support in some subjects.`
                                                                    : `${selectedChild.firstName} is struggling this term. Consider reaching out to the class teacher.` }) }))] })] })), activeSection === "discipline_financial" && ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [(0, jsx_runtime_1.jsx)("div", { className: "bg-white rounded-lg shadow p-6", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center", children: [(0, jsx_runtime_1.jsx)(outline_1.CheckCircleIcon, { className: "h-8 w-8 text-green-600" }), (0, jsx_runtime_1.jsxs)("div", { className: "ml-4", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-medium text-gray-600", children: "Merit Points" }), (0, jsx_runtime_1.jsxs)("p", { className: "text-2xl font-semibold text-gray-900", children: ["+", merits] })] })] }) }), (0, jsx_runtime_1.jsx)("div", { className: "bg-white rounded-lg shadow p-6", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center", children: [(0, jsx_runtime_1.jsx)(outline_1.ExclamationTriangleIcon, { className: "h-8 w-8 text-red-500" }), (0, jsx_runtime_1.jsxs)("div", { className: "ml-4", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-medium text-gray-600", children: "Demerit Points" }), (0, jsx_runtime_1.jsxs)("p", { className: "text-2xl font-semibold text-gray-900", children: ["-", demerits] })] })] }) }), (0, jsx_runtime_1.jsx)("div", { className: "bg-white rounded-lg shadow p-6", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center", children: [(0, jsx_runtime_1.jsx)(outline_1.ShieldExclamationIcon, { className: "h-8 w-8 text-rose-600" }), (0, jsx_runtime_1.jsxs)("div", { className: "ml-4", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-medium text-gray-600", children: "Conduct" }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-2", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-2xl font-semibold text-gray-900", children: conductScore }), (0, jsx_runtime_1.jsx)("span", { className: `text-xs font-semibold px-2 py-0.5 rounded-full ${conductColor}`, children: conductLabel })] })] })] }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden", children: [(0, jsx_runtime_1.jsx)("div", { className: "px-6 py-4 bg-gray-50 border-b border-gray-200", children: (0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold text-gray-700", children: "Disciplinary Record" }) }), disciplineRecords.length === 0 ? ((0, jsx_runtime_1.jsxs)("div", { className: "text-center py-12", children: [(0, jsx_runtime_1.jsx)(outline_1.ShieldExclamationIcon, { className: "h-12 w-12 text-gray-300 mx-auto mb-3" }), (0, jsx_runtime_1.jsxs)("p", { className: "text-gray-500", children: ["No disciplinary records for ", selectedChild.firstName, "."] })] })) : ((0, jsx_runtime_1.jsxs)("table", { className: "min-w-full", children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { className: "border-b border-gray-200 bg-gray-50", children: [(0, jsx_runtime_1.jsx)("th", { className: "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider", children: "Date" }), (0, jsx_runtime_1.jsx)("th", { className: "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider", children: "Marks Taken" }), (0, jsx_runtime_1.jsx)("th", { className: "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider", children: "Disciplinary Marks" }), (0, jsx_runtime_1.jsx)("th", { className: "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider", children: "Action Taken" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { className: "divide-y divide-gray-100", children: disciplineRecords.map((d, i) => ((0, jsx_runtime_1.jsxs)("tr", { className: "hover:bg-gray-50 transition-colors", children: [(0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4 text-sm text-gray-700 whitespace-nowrap", children: d.date }), (0, jsx_runtime_1.jsx)("td", { className: `px-6 py-4 text-sm font-semibold ${d.points >= 0 ? "text-green-700" : "text-red-700"}`, children: d.points > 0 ? `+${d.points}` : d.points }), (0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4 text-sm font-medium text-gray-900", children: d.category }), (0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4 text-sm text-gray-500", children: d.actionTaken || "—" })] }, i))) })] }))] }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden", children: [(0, jsx_runtime_1.jsxs)("div", { className: "px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold text-gray-700", children: "School Fees Structure" }), (0, jsx_runtime_1.jsx)(outline_1.BanknotesIcon, { className: "h-5 w-5 text-gray-400" })] }), !feeAccount ? ((0, jsx_runtime_1.jsxs)("div", { className: "text-center py-12", children: [(0, jsx_runtime_1.jsx)(outline_1.BanknotesIcon, { className: "h-12 w-12 text-gray-300 mx-auto mb-3" }), (0, jsx_runtime_1.jsx)("p", { className: "text-gray-500", children: "No fee structure available." })] })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)("table", { className: "min-w-full", children: [(0, jsx_runtime_1.jsx)("thead", { children: (0, jsx_runtime_1.jsxs)("tr", { className: "border-b border-gray-200 bg-gray-50", children: [(0, jsx_runtime_1.jsx)("th", { className: "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider", children: "Term" }), (0, jsx_runtime_1.jsx)("th", { className: "px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider", children: "Estimated School Fees" }), (0, jsx_runtime_1.jsx)("th", { className: "px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider", children: "Paid Amount" }), (0, jsx_runtime_1.jsx)("th", { className: "px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider", children: "Remaining Amount" })] }) }), (0, jsx_runtime_1.jsx)("tbody", { className: "divide-y divide-gray-100", children: (() => {
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
                                                                            return ((0, jsx_runtime_1.jsxs)("tr", { className: "hover:bg-gray-50 transition-colors", children: [(0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4 text-sm font-medium text-gray-900", children: term.replace("Term", "Trimester") }), (0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4 text-sm text-right text-gray-700", children: fmtMoney(estimated) }), (0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4 text-sm text-right text-green-700 font-medium", children: fmtMoney(paidForTerm) }), (0, jsx_runtime_1.jsx)("td", { className: "px-6 py-4 text-sm text-right text-red-700 font-semibold", children: fmtMoney(remaining) })] }, term));
                                                                        });
                                                                    })() }), (0, jsx_runtime_1.jsx)("tfoot", { children: (0, jsx_runtime_1.jsxs)("tr", { className: "bg-gray-50 border-t-2 border-gray-200", children: [(0, jsx_runtime_1.jsx)("td", { className: "px-6 py-3 text-sm font-semibold text-gray-700", children: "Total Account" }), (0, jsx_runtime_1.jsx)("td", { className: "px-6 py-3 text-sm text-right font-bold text-gray-900", children: fmtMoney(feeTotal) }), (0, jsx_runtime_1.jsx)("td", { className: "px-6 py-3 text-sm text-right font-bold text-green-700", children: fmtMoney(feeAccount.paid) }), (0, jsx_runtime_1.jsx)("td", { className: "px-6 py-3 text-sm text-right font-bold text-red-700", children: fmtMoney(feeBalance) })] }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "px-6 py-5 border-t border-gray-200", children: [(0, jsx_runtime_1.jsx)("div", { className: "w-full bg-gray-100 rounded-full h-3", children: (0, jsx_runtime_1.jsx)("div", { className: `h-3 rounded-full ${feeBalance <= 0 ? "bg-green-500" : "bg-rose-500"}`, style: { width: `${feePaidPct}%` } }) }), (0, jsx_runtime_1.jsxs)("p", { className: "text-xs text-gray-400 mt-2", children: ["Overall balance is ", fmtMoney(feeBalance), ". Due by ", feeAccount.dueDate || "the end of term", "."] })] })] }))] })] })), activeSection === "messages" && ((0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 p-6", children: [(0, jsx_runtime_1.jsx)("h4", { className: "text-base font-semibold text-gray-900 mb-1", children: "Send a message to the school" }), (0, jsx_runtime_1.jsxs)("p", { className: "text-sm text-gray-500 mb-4", children: ["Share feedback, raise a concern, or ask a question regarding ", selectedChild.firstName, " ", selectedChild.lastName, "."] }), (0, jsx_runtime_1.jsxs)("form", { onSubmit: submitComment, children: [(0, jsx_runtime_1.jsx)("textarea", { value: commentText, onChange: (e) => { setCommentText(e.target.value); if (commentState !== "idle")
                                                                setCommentState("idle"); }, rows: 4, placeholder: "Write your message\u2026", className: "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500" }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-3 flex items-center justify-between", children: [(0, jsx_runtime_1.jsxs)("div", { className: "text-sm", children: [commentState === "sent" && (0, jsx_runtime_1.jsx)("span", { className: "text-green-600", children: "Message sent to the school \u2713" }), commentState === "error" && (0, jsx_runtime_1.jsx)("span", { className: "text-red-600", children: commentError })] }), (0, jsx_runtime_1.jsxs)("button", { type: "submit", disabled: commentState === "sending" || !commentText.trim(), className: "inline-flex items-center px-4 py-2 bg-rose-600 text-white text-sm font-medium rounded-lg hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed", children: [(0, jsx_runtime_1.jsx)(outline_1.PaperAirplaneIcon, { className: "h-4 w-4 mr-2" }), commentState === "sending" ? "Sending…" : "Send Message"] })] })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden", children: [(0, jsx_runtime_1.jsx)("div", { className: "px-6 py-4 bg-gray-50 border-b border-gray-200", children: (0, jsx_runtime_1.jsx)("p", { className: "text-sm font-semibold text-gray-700", children: "Your previous messages" }) }), myComments.length === 0 ? ((0, jsx_runtime_1.jsxs)("div", { className: "text-center py-12", children: [(0, jsx_runtime_1.jsx)(outline_1.ChatBubbleLeftRightIcon, { className: "h-12 w-12 text-gray-300 mx-auto mb-3" }), (0, jsx_runtime_1.jsx)("p", { className: "text-gray-500", children: "You haven't sent any messages yet." })] })) : ((0, jsx_runtime_1.jsx)("ul", { className: "divide-y divide-gray-100", children: myComments.map((c) => ((0, jsx_runtime_1.jsxs)("li", { className: "px-6 py-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-start justify-between", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-800 whitespace-pre-wrap", children: c.message }), (0, jsx_runtime_1.jsx)("span", { className: `ml-4 flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${c.status === "READ" ? "text-green-700 bg-green-100" : "text-gray-600 bg-gray-100"}`, children: c.status === "READ" ? "Read" : "Sent" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-1 flex items-center space-x-2 text-xs text-gray-400", children: [c.regarding && (0, jsx_runtime_1.jsxs)("span", { children: ["Re: ", c.regarding] }), c.regarding && (0, jsx_runtime_1.jsx)("span", { children: "\u00B7" }), (0, jsx_runtime_1.jsx)("span", { children: new Date(c.createdAt).toLocaleString() })] })] }, c._id))) }))] })] })), activeSection === "careers" && ((0, jsx_runtime_1.jsx)("div", { className: "space-y-6", children: !hasEnoughData ? ((0, jsx_runtime_1.jsxs)("div", { className: "bg-white rounded-xl shadow p-12 text-center", children: [(0, jsx_runtime_1.jsx)(outline_1.LightBulbIcon, { className: "h-14 w-14 text-gray-300 mx-auto mb-4" }), (0, jsx_runtime_1.jsx)("h4", { className: "text-lg font-semibold text-gray-700 mb-2", children: "Not enough data yet" }), (0, jsx_runtime_1.jsxs)("p", { className: "text-sm text-gray-500 max-w-md mx-auto", children: ["Career insights will appear once ", selectedChild.firstName, " has marks recorded across multiple subjects. Check back after the teacher uploads results."] })] })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("div", { className: "bg-gradient-to-r from-rose-600 to-rose-500 rounded-xl p-6 text-white", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-start space-x-4", children: [(0, jsx_runtime_1.jsx)(outline_1.LightBulbIcon, { className: "h-10 w-10 flex-shrink-0 opacity-90" }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("h4", { className: "text-lg font-bold mb-1", children: ["Career Insights for ", selectedChild.firstName] }), (0, jsx_runtime_1.jsxs)("p", { className: "text-rose-100 text-sm leading-relaxed", children: ["Based on ", selectedChild.firstName, "'s academic performance across all subjects and terms, here are career paths worth exploring together. These are suggestions to spark conversation \u2014 not a prescription."] })] })] }) }), (0, jsx_runtime_1.jsxs)("div", { className: "bg-white rounded-lg shadow p-6", children: [(0, jsx_runtime_1.jsx)("h4", { className: "text-base font-semibold text-gray-900 mb-4", children: "Subject Strengths (All Terms)" }), (0, jsx_runtime_1.jsx)("div", { className: "space-y-3", children: [...new Set(allMarks.map((m) => m.subject))]
                                                            .map((subj) => {
                                                            const subjectMarks = allMarks.filter((m) => m.subject === subj);
                                                            return { subj, a: avg(subjectMarks) };
                                                        })
                                                            .sort((x, y) => y.a - x.a)
                                                            .map(({ subj, a }) => {
                                                            const g = gradeInfo(a, 100);
                                                            return ((0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between mb-1", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-sm font-medium text-gray-700", children: subj }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-2", children: [(0, jsx_runtime_1.jsxs)("span", { className: "text-sm text-gray-600", children: [a, "%"] }), (0, jsx_runtime_1.jsx)("span", { className: `text-xs font-semibold px-2 py-0.5 rounded-full ${g.color}`, children: g.label })] })] }), (0, jsx_runtime_1.jsx)("div", { className: "w-full bg-gray-100 rounded-full h-2", children: (0, jsx_runtime_1.jsx)("div", { className: `h-2 rounded-full ${g.bar}`, style: { width: `${a}%` } }) })] }, subj));
                                                        }) })] }), careerRecs.length === 0 ? ((0, jsx_runtime_1.jsx)("div", { className: "bg-white rounded-xl shadow p-8 text-center", children: (0, jsx_runtime_1.jsxs)("p", { className: "text-gray-500 text-sm", children: ["No strong career matches found yet. Encourage ", selectedChild.firstName, " to keep improving across subjects."] }) })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)("h4", { className: "text-base font-semibold text-gray-700", children: "Recommended Career Paths" }), (0, jsx_runtime_1.jsx)("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: careerRecs.map((rec, i) => ((0, jsx_runtime_1.jsxs)("div", { className: `bg-white rounded-xl shadow border-l-4 p-6 ${rec.cluster.color}`, children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-start justify-between mb-3", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-3", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-3xl", children: rec.cluster.emoji }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { className: "flex items-center space-x-2", children: i === 0 && ((0, jsx_runtime_1.jsxs)("span", { className: "inline-flex items-center text-xs font-semibold text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full", children: [(0, jsx_runtime_1.jsx)(outline_1.StarIcon, { className: "h-3 w-3 mr-1" }), " Top Match"] })) }), (0, jsx_runtime_1.jsx)("h5", { className: "text-base font-bold text-gray-900 mt-0.5", children: rec.cluster.title })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "text-right flex-shrink-0", children: [(0, jsx_runtime_1.jsxs)("p", { className: "text-2xl font-bold text-gray-900", children: [rec.matchScore, "%"] }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-gray-500", children: "match" })] })] }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-600 mb-4", children: rec.cluster.description }), (0, jsx_runtime_1.jsxs)("div", { className: "mb-4", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2", children: "Driven by" }), (0, jsx_runtime_1.jsx)("div", { className: "flex flex-wrap gap-1.5", children: rec.topSubjects.map((s) => ((0, jsx_runtime_1.jsx)("span", { className: "text-xs bg-white border border-gray-200 text-gray-700 px-2 py-0.5 rounded-full shadow-sm", children: s }, s))) })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("p", { className: "text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2", children: "Possible careers" }), (0, jsx_runtime_1.jsx)("div", { className: "flex flex-wrap gap-1.5", children: rec.cluster.careers.map((c) => ((0, jsx_runtime_1.jsx)("span", { className: "text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full", children: c }, c))) })] })] }, rec.cluster.id))) }), (0, jsx_runtime_1.jsx)("div", { className: "bg-amber-50 border border-amber-200 rounded-xl p-5", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-start space-x-3", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-2xl", children: "\uD83D\uDCAC" }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h5", { className: "text-sm font-semibold text-amber-900 mb-1", children: "Conversation starter" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-amber-800 leading-relaxed", children: careerRecs[0] && ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [selectedChild.firstName, " is showing real strength in", " ", (0, jsx_runtime_1.jsx)("span", { className: "font-semibold", children: careerRecs[0].topSubjects.slice(0, 2).join(" and ") }), ". That's a great foundation for a career in", " ", (0, jsx_runtime_1.jsx)("span", { className: "font-semibold", children: careerRecs[0].cluster.title }), ". Ask ", selectedChild.firstName, ": ", (0, jsx_runtime_1.jsxs)("em", { children: ["\u201CWhat do you find most interesting about ", careerRecs[0].topSubjects[0], "? Could you see yourself doing that every day?\u201D"] })] })) })] })] }) }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-gray-400 text-center", children: "Career suggestions are based on academic performance patterns and are meant to guide conversation, not limit choices. Every child's path is unique." })] }))] })) }))] }) })] })] }));
}
//# sourceMappingURL=page.js.map