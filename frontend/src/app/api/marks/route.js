"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const server_1 = require("next/server");
const mongoose_1 = require("@/lib/mongoose");
const Mark_1 = __importStar(require("@/models/Mark"));
const Teacher_1 = __importDefault(require("@/models/Teacher"));
const Student_1 = __importDefault(require("@/models/Student"));
const Subject_1 = __importDefault(require("@/models/Subject"));
const Parent_1 = __importDefault(require("@/models/Parent"));
const api_helpers_1 = require("@/lib/api-helpers");
const types_1 = require("@/types");
async function GET(req) {
    const { error, session } = await (0, api_helpers_1.requireRole)(types_1.UserRole.TEACHER, types_1.UserRole.SCHOOL_ADMIN, types_1.UserRole.PARENT, types_1.UserRole.SUPER_ADMIN);
    if (error)
        return error;
    await (0, mongoose_1.connectDB)();
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const term = searchParams.get("term");
    const year = searchParams.get("year");
    // Parents can only query their own children
    if (session.user.role === types_1.UserRole.PARENT) {
        if (!studentId)
            return (0, api_helpers_1.err)("studentId is required for parent queries", 400);
        const parent = await Parent_1.default.findOne({ userId: session.user.id }).lean();
        if (!parent || !parent.studentIds.map(String).includes(studentId)) {
            return (0, api_helpers_1.err)("Forbidden", 403);
        }
    }
    const filter = {};
    if (studentId)
        filter.studentId = studentId;
    if (term)
        filter.term = term;
    if (year)
        filter.year = year;
    const marks = await Mark_1.default.find(filter)
        .populate("studentId", "firstName lastName")
        .populate("subjectId", "name code")
        .populate({ path: "teacherId", populate: { path: "userId", select: "name" } })
        .sort({ year: -1, term: 1 }).lean();
    return (0, api_helpers_1.ok)(marks);
}
async function POST(req) {
    const { error, session } = await (0, api_helpers_1.requireRole)(types_1.UserRole.TEACHER);
    if (error)
        return error;
    await (0, mongoose_1.connectDB)();
    const { records } = await req.json();
    if (!Array.isArray(records) || records.length === 0) {
        return (0, api_helpers_1.err)("records array is required and must not be empty");
    }
    // Validate test/exam components are within their 0–50 bounds
    const outOfRange = records.filter((r) => typeof r.test !== "number" || r.test < 0 || r.test > Mark_1.TEST_MAX ||
        typeof r.exam !== "number" || r.exam < 0 || r.exam > Mark_1.EXAM_MAX);
    if (outOfRange.length > 0) {
        return (0, api_helpers_1.err)(`${outOfRange.length} record(s) have a test or exam mark outside the 0–${Mark_1.TEST_MAX}/0–${Mark_1.EXAM_MAX} range`, 422);
    }
    const teacher = await Teacher_1.default.findOne({ userId: session.user.id }).lean();
    if (!teacher)
        return (0, api_helpers_1.err)("Teacher record not found", 404);
    // Validate all IDs belong to teacher's school
    const studentIds = [...new Set(records.map((r) => r.studentId))];
    const subjectIds = [...new Set(records.map((r) => r.subjectId))];
    const [students, subjects] = await Promise.all([
        Student_1.default.find({ _id: { $in: studentIds }, schoolId: teacher.schoolId }).select("_id").lean(),
        Subject_1.default.find({ _id: { $in: subjectIds }, schoolId: teacher.schoolId }).select("_id").lean(),
    ]);
    const validStudentIds = new Set(students.map((s) => s._id.toString()));
    const validSubjectIds = new Set(subjects.map((s) => s._id.toString()));
    const invalid = records.filter((r) => !validStudentIds.has(r.studentId) || !validSubjectIds.has(r.subjectId));
    if (invalid.length > 0) {
        return (0, api_helpers_1.err)(`${invalid.length} record(s) reference students or subjects not in this school`, 422);
    }
    // Bulk upsert using updateOne with upsert:true. score = test + exam (out of 100).
    const ops = records.map((r) => ({
        updateOne: {
            filter: { studentId: r.studentId, subjectId: r.subjectId, term: r.term, year: r.year },
            update: { $set: { test: r.test, exam: r.exam, score: r.test + r.exam, maxScore: Mark_1.TEST_MAX + Mark_1.EXAM_MAX, teacherId: teacher._id } },
            upsert: true,
        },
    }));
    const result = await Mark_1.default.bulkWrite(ops);
    return (0, api_helpers_1.ok)({ saved: result.upsertedCount + result.modifiedCount }, 201);
}
//# sourceMappingURL=route.js.map