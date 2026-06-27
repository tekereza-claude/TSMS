"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.PATCH = PATCH;
exports.DELETE = DELETE;
const server_1 = require("next/server");
const mongoose_1 = require("@/lib/mongoose");
const Student_1 = __importDefault(require("@/models/Student"));
const Mark_1 = __importDefault(require("@/models/Mark"));
const api_helpers_1 = require("@/lib/api-helpers");
const types_1 = require("@/types");
async function GET(_, { params }) {
    const { error } = await (0, api_helpers_1.requireRole)(types_1.UserRole.SCHOOL_ADMIN, types_1.UserRole.TEACHER, types_1.UserRole.PARENT);
    if (error)
        return error;
    await (0, mongoose_1.connectDB)();
    const { id } = await params;
    const student = await Student_1.default.findById(id).populate("classId", "name grade").lean();
    if (!student)
        return (0, api_helpers_1.err)("Student not found", 404);
    const marks = await Mark_1.default.find({ studentId: id })
        .populate("subjectId", "name code")
        .populate({ path: "teacherId", populate: { path: "userId", select: "name" } })
        .sort({ year: -1, term: 1 }).lean();
    return (0, api_helpers_1.ok)({ ...student, marks });
}
async function PATCH(req, { params }) {
    const { error } = await (0, api_helpers_1.requireRole)(types_1.UserRole.SCHOOL_ADMIN);
    if (error)
        return error;
    await (0, mongoose_1.connectDB)();
    const { id } = await params;
    const { firstName, lastName, email, classId, profilePicture } = await req.json();
    const student = await Student_1.default.findByIdAndUpdate(id, {
        firstName,
        lastName,
        email: email || undefined, // unique+sparse: omit rather than store null
        classId: classId || null,
        profilePicture: profilePicture || null,
    }, { new: true }).lean();
    if (!student)
        return (0, api_helpers_1.err)("Student not found", 404);
    return (0, api_helpers_1.ok)(student);
}
async function DELETE(_, { params }) {
    const { error } = await (0, api_helpers_1.requireRole)(types_1.UserRole.SCHOOL_ADMIN);
    if (error)
        return error;
    await (0, mongoose_1.connectDB)();
    const { id } = await params;
    await Student_1.default.findByIdAndDelete(id);
    return (0, api_helpers_1.ok)({ message: "Student removed" });
}
//# sourceMappingURL=route.js.map