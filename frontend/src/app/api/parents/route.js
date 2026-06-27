"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const server_1 = require("next/server");
const mongoose_1 = require("@/lib/mongoose");
const User_1 = __importDefault(require("@/models/User"));
const Parent_1 = __importDefault(require("@/models/Parent"));
const Student_1 = __importDefault(require("@/models/Student"));
const api_helpers_1 = require("@/lib/api-helpers");
const password_1 = require("@/lib/password");
const types_1 = require("@/types");
async function GET() {
    const { error, session } = await (0, api_helpers_1.requireRole)(types_1.UserRole.SCHOOL_ADMIN);
    if (error)
        return error;
    await (0, mongoose_1.connectDB)();
    const schoolStudents = await Student_1.default.find({ schoolId: session.user.schoolId }).select("_id").lean();
    const studentIds = schoolStudents.map((s) => s._id);
    const parents = await Parent_1.default.find({ studentIds: { $in: studentIds } })
        .populate("userId", "name email createdAt")
        .populate("studentIds", "firstName lastName")
        .lean();
    return (0, api_helpers_1.ok)(parents);
}
async function POST(req) {
    const { error, session } = await (0, api_helpers_1.requireRole)(types_1.UserRole.SCHOOL_ADMIN);
    if (error)
        return error;
    await (0, mongoose_1.connectDB)();
    const { name, email, password, studentId } = await req.json();
    if (!name || !email || !password)
        return (0, api_helpers_1.err)("name, email and password are required");
    const schoolId = session.user.schoolId;
    if (!schoolId)
        return (0, api_helpers_1.err)("No school associated with this admin", 400);
    if (studentId) {
        const student = await Student_1.default.findOne({ _id: studentId, schoolId }).lean();
        if (!student)
            return (0, api_helpers_1.err)("Student not found in this school", 404);
    }
    const existing = await User_1.default.findOne({ email: email.toLowerCase() });
    if (existing)
        return (0, api_helpers_1.err)("A user with this email already exists");
    const hashed = await (0, password_1.hashPassword)(password);
    const user = await User_1.default.create({ name, email, password: hashed, role: "PARENT" });
    const parent = await Parent_1.default.create({
        userId: user._id,
        studentIds: studentId ? [studentId] : [],
    });
    return (0, api_helpers_1.ok)(await Parent_1.default.findById(parent._id)
        .populate("userId", "name email")
        .populate("studentIds", "firstName lastName")
        .lean(), 201);
}
//# sourceMappingURL=route.js.map