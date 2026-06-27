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
const DisciplineRecord_1 = __importDefault(require("@/models/DisciplineRecord"));
const Teacher_1 = __importDefault(require("@/models/Teacher"));
const Student_1 = __importDefault(require("@/models/Student"));
const Parent_1 = __importDefault(require("@/models/Parent"));
// GET /api/discipline?studentId=...
//  - PARENT       → records for their own child (studentId required)
//  - TEACHER/ADMIN → records across their school (optionally filtered by studentId)
//  - SUPER_ADMIN  → any
async function GET(req) {
    const { error, session } = await (0, api_helpers_1.requireRole)(types_1.UserRole.TEACHER, types_1.UserRole.SCHOOL_ADMIN, types_1.UserRole.PARENT, types_1.UserRole.SUPER_ADMIN);
    if (error)
        return error;
    await (0, mongoose_1.connectDB)();
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const filter = {};
    if (session.user.role === types_1.UserRole.PARENT) {
        if (!studentId)
            return (0, api_helpers_1.err)("studentId is required for parent queries", 400);
        const parent = await Parent_1.default.findOne({ userId: session.user.id }).lean();
        if (!parent || !parent.studentIds.map(String).includes(studentId)) {
            return (0, api_helpers_1.err)("Forbidden", 403);
        }
        filter.studentId = studentId;
    }
    else if (session.user.role === types_1.UserRole.TEACHER ||
        session.user.role === types_1.UserRole.SCHOOL_ADMIN) {
        if (!session.user.schoolId)
            return (0, api_helpers_1.err)("No school associated with this account", 400);
        filter.schoolId = session.user.schoolId;
        if (studentId)
            filter.studentId = studentId;
    }
    else if (studentId) {
        filter.studentId = studentId;
    }
    const records = await DisciplineRecord_1.default.find(filter)
        .populate("studentId", "firstName lastName")
        .populate({ path: "teacherId", populate: { path: "userId", select: "name" } })
        .sort({ date: -1 })
        .lean();
    return (0, api_helpers_1.ok)(records);
}
// POST /api/discipline — a teacher records a merit/demerit for a student
async function POST(req) {
    const { error, session } = await (0, api_helpers_1.requireRole)(types_1.UserRole.TEACHER);
    if (error)
        return error;
    await (0, mongoose_1.connectDB)();
    const { studentId, type, category, points, note, date, actionTaken } = (await req.json());
    if (!studentId)
        return (0, api_helpers_1.err)("studentId is required");
    if (type !== "Merit" && type !== "Demerit")
        return (0, api_helpers_1.err)("type must be 'Merit' or 'Demerit'");
    if (!category || !category.trim())
        return (0, api_helpers_1.err)("category is required");
    if (typeof points !== "number" || isNaN(points) || points <= 0) {
        return (0, api_helpers_1.err)("points must be a positive number");
    }
    const teacher = await Teacher_1.default.findOne({ userId: session.user.id }).lean();
    if (!teacher)
        return (0, api_helpers_1.err)("Teacher record not found", 404);
    const student = await Student_1.default.findOne({ _id: studentId, schoolId: teacher.schoolId }).select("_id").lean();
    if (!student)
        return (0, api_helpers_1.err)("Student not found in this school", 404);
    // Store points signed by type so the sum reflects net conduct.
    const signedPoints = type === "Merit" ? Math.abs(points) : -Math.abs(points);
    const record = await DisciplineRecord_1.default.create({
        studentId,
        schoolId: teacher.schoolId,
        teacherId: teacher._id,
        type,
        category: category.trim(),
        points: signedPoints,
        note: note?.trim() || undefined,
        actionTaken: actionTaken?.trim() || undefined,
        date: date ? new Date(date) : undefined,
    });
    return (0, api_helpers_1.ok)(await DisciplineRecord_1.default.findById(record._id)
        .populate("studentId", "firstName lastName")
        .populate({ path: "teacherId", populate: { path: "userId", select: "name" } })
        .lean(), 201);
}
//# sourceMappingURL=route.js.map