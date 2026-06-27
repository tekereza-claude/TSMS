"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const server_1 = require("next/server");
const mongoose_1 = require("@/lib/mongoose");
const Class_1 = __importDefault(require("@/models/Class"));
const Student_1 = __importDefault(require("@/models/Student"));
const Teacher_1 = __importDefault(require("@/models/Teacher"));
const api_helpers_1 = require("@/lib/api-helpers");
const types_1 = require("@/types");
async function GET() {
    const { error, session } = await (0, api_helpers_1.requireRole)(types_1.UserRole.SCHOOL_ADMIN, types_1.UserRole.TEACHER, types_1.UserRole.SUPER_ADMIN);
    if (error)
        return error;
    await (0, mongoose_1.connectDB)();
    const filter = session.user.schoolId ? { schoolId: session.user.schoolId } : {};
    // A teacher only sees the classes assigned to them.
    if (session.user.role === types_1.UserRole.TEACHER) {
        const teacher = await Teacher_1.default.findOne({ userId: session.user.id }).select("_id").lean();
        filter.teacherId = teacher?._id ?? null;
    }
    const classes = await Class_1.default.find(filter)
        .populate("teacherId", "userId")
        .sort({ grade: 1, name: 1 }).lean();
    const withCounts = await Promise.all(classes.map(async (c) => {
        const count = await Student_1.default.countDocuments({ classId: c._id });
        return { ...c, studentCount: count };
    }));
    return (0, api_helpers_1.ok)(withCounts);
}
async function POST(req) {
    const { error, session } = await (0, api_helpers_1.requireRole)(types_1.UserRole.SCHOOL_ADMIN);
    if (error)
        return error;
    await (0, mongoose_1.connectDB)();
    const { name, grade, teacherId } = await req.json();
    if (!name || !grade)
        return (0, api_helpers_1.err)("name and grade are required");
    const schoolId = session.user.schoolId;
    if (!schoolId)
        return (0, api_helpers_1.err)("No school associated with this admin", 400);
    const cls = await Class_1.default.create({ name, grade, schoolId, teacherId: teacherId || undefined });
    return (0, api_helpers_1.ok)(cls, 201);
}
//# sourceMappingURL=route.js.map