"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const server_1 = require("next/server");
const mongoose_1 = require("@/lib/mongoose");
const api_helpers_1 = require("@/lib/api-helpers");
const types_1 = require("@/types");
const Fee_1 = __importDefault(require("@/models/Fee"));
const Student_1 = __importDefault(require("@/models/Student"));
const Parent_1 = __importDefault(require("@/models/Parent"));
// GET /api/fees?studentId=...
//  - PARENT       → the fee account for their own child (studentId required)
//  - SCHOOL_ADMIN → fee accounts across their school (optionally one student)
//  - SUPER_ADMIN  → any
async function GET(req) {
    const { error, session } = await (0, api_helpers_1.requireRole)(types_1.UserRole.SCHOOL_ADMIN, types_1.UserRole.PARENT, types_1.UserRole.SUPER_ADMIN);
    if (error)
        return error;
    await (0, mongoose_1.connectDB)();
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    if (session.user.role === types_1.UserRole.PARENT) {
        if (!studentId)
            return (0, api_helpers_1.err)("studentId is required for parent queries", 400);
        const parent = await Parent_1.default.findOne({ userId: session.user.id }).lean();
        if (!parent || !parent.studentIds.map(String).includes(studentId)) {
            return (0, api_helpers_1.err)("Forbidden", 403);
        }
        const fee = await Fee_1.default.findOne({ studentId }).lean();
        return (0, api_helpers_1.ok)(fee);
    }
    // SCHOOL_ADMIN / SUPER_ADMIN
    const filter = {};
    if (session.user.role === types_1.UserRole.SCHOOL_ADMIN) {
        if (!session.user.schoolId)
            return (0, api_helpers_1.err)("No school associated with this account", 400);
        filter.schoolId = session.user.schoolId;
    }
    if (studentId) {
        filter.studentId = studentId;
        const fee = await Fee_1.default.findOne(filter).lean();
        return (0, api_helpers_1.ok)(fee);
    }
    const fees = await Fee_1.default.find(filter).populate("studentId", "firstName lastName").lean();
    return (0, api_helpers_1.ok)(fees);
}
// POST /api/fees — school admin creates/updates a student's fee account (upsert)
async function POST(req) {
    const { error, session } = await (0, api_helpers_1.requireRole)(types_1.UserRole.SCHOOL_ADMIN);
    if (error)
        return error;
    await (0, mongoose_1.connectDB)();
    const { studentId, currency, dueDate, items, paid } = (await req.json());
    if (!studentId)
        return (0, api_helpers_1.err)("studentId is required");
    const schoolId = session.user.schoolId;
    if (!schoolId)
        return (0, api_helpers_1.err)("No school associated with this admin", 400);
    const student = await Student_1.default.findOne({ _id: studentId, schoolId }).select("_id").lean();
    if (!student)
        return (0, api_helpers_1.err)("Student not found in this school", 404);
    if (items && !Array.isArray(items))
        return (0, api_helpers_1.err)("items must be an array");
    const cleanItems = (items ?? [])
        .filter((it) => it && it.item && typeof it.amount === "number")
        .map((it) => ({ item: String(it.item).trim(), amount: Math.max(0, it.amount), term: String(it.term ?? "").trim() }));
    const fee = await Fee_1.default.findOneAndUpdate({ studentId }, {
        $set: {
            schoolId,
            currency: currency?.trim() || "RWF",
            dueDate: dueDate || undefined,
            items: cleanItems,
            paid: typeof paid === "number" && paid >= 0 ? paid : 0,
        },
    }, { new: true, upsert: true, setDefaultsOnInsert: true }).lean();
    return (0, api_helpers_1.ok)(fee, 201);
}
//# sourceMappingURL=route.js.map