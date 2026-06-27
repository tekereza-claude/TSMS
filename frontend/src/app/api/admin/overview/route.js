"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const mongoose_1 = require("@/lib/mongoose");
const api_helpers_1 = require("@/lib/api-helpers");
const types_1 = require("@/types");
const School_1 = __importDefault(require("@/models/School"));
const Student_1 = __importDefault(require("@/models/Student"));
const Subscription_1 = __importDefault(require("@/models/Subscription"));
const Payment_1 = __importDefault(require("@/models/Payment"));
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY_MS = 24 * 60 * 60 * 1000;
// GET /api/admin/overview — aggregated platform dashboard data for the super admin.
async function GET() {
    const { error } = await (0, api_helpers_1.requireRole)(types_1.UserRole.SUPER_ADMIN);
    if (error)
        return error;
    await (0, mongoose_1.connectDB)();
    const [schools, subs, payments, studentCounts] = await Promise.all([
        School_1.default.find().sort({ createdAt: -1 }).lean(),
        Subscription_1.default.find().lean(),
        Payment_1.default.find().sort({ date: -1 }).lean(),
        Student_1.default.aggregate([
            { $group: { _id: "$schoolId", count: { $sum: 1 } } },
        ]),
    ]);
    const planBySchool = new Map(subs.map((s) => [s.schoolId.toString(), s.plan]));
    const studentsBySchool = new Map(studentCounts.map((s) => [String(s._id), s.count]));
    // ── School table rows ──
    const schoolRows = schools.map((s) => ({
        _id: String(s._id),
        name: s.name,
        email: s.email,
        status: s.status,
        createdAt: s.createdAt,
        plan: planBySchool.get(s._id.toString()) ?? "FREE",
        students: studentsBySchool.get(s._id.toString()) ?? 0,
    }));
    // ── Status breakdown + counts ──
    const statusBreakdown = { APPROVED: 0, PENDING: 0, SUSPENDED: 0, REJECTED: 0 };
    for (const s of schools) {
        if (s.status in statusBreakdown)
            statusBreakdown[s.status]++;
    }
    const totalStudents = studentCounts.reduce((a, s) => a + s.count, 0);
    const activeSubscriptions = subs.filter((s) => s.status === "ACTIVE").length;
    // ── Revenue series (computed from real payments) ──
    const now = new Date();
    const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const sumBetween = (start, end) => payments
        .filter((p) => {
        const t = new Date(p.date).getTime();
        return t >= start && t < end;
    })
        .reduce((a, p) => a + p.amount, 0);
    // Last 7 days (daily)
    const last7 = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const start = startOfDay(d);
        last7.push({ label: WEEKDAYS[d.getDay()], revenue: sumBetween(start, start + DAY_MS) });
    }
    // Last 4 weeks (weekly)
    const last30 = [];
    for (let w = 3; w >= 0; w--) {
        const endRef = new Date(now);
        endRef.setDate(now.getDate() - w * 7);
        const end = startOfDay(endRef) + DAY_MS;
        last30.push({ label: `Week ${4 - w}`, revenue: sumBetween(end - 7 * DAY_MS, end) });
    }
    // This year (monthly)
    const year = now.getFullYear();
    const yearly = MONTHS.map((label, m) => ({
        label,
        revenue: payments
            .filter((p) => {
            const dt = new Date(p.date);
            return dt.getFullYear() === year && dt.getMonth() === m;
        })
            .reduce((a, p) => a + p.amount, 0),
    }));
    // New school registrations per month (this year)
    const growth = MONTHS.map((label, m) => ({
        label,
        registering: schools.filter((s) => {
            const dt = new Date(s.createdAt);
            return dt.getFullYear() === year && dt.getMonth() === m;
        }).length,
    }));
    const monthlyRevenue = payments
        .filter((p) => {
        const dt = new Date(p.date);
        return dt.getFullYear() === now.getFullYear() && dt.getMonth() === now.getMonth();
    })
        .reduce((a, p) => a + p.amount, 0);
    const currency = payments[0]?.currency ?? "USD";
    return (0, api_helpers_1.ok)({
        stats: {
            totalSchools: schools.length,
            approvedSchools: statusBreakdown.APPROVED,
            pendingSchools: statusBreakdown.PENDING,
            suspendedSchools: statusBreakdown.SUSPENDED,
            totalStudents,
            activeSubscriptions,
            monthlyRevenue,
            currency,
        },
        statusBreakdown,
        schools: schoolRows,
        revenue: { "7days": last7, "30days": last30, year: yearly },
        growth,
    });
}
//# sourceMappingURL=route.js.map