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
const Teacher_1 = __importDefault(require("@/models/Teacher"));
const Class_1 = __importDefault(require("@/models/Class"));
const api_helpers_1 = require("@/lib/api-helpers");
const password_1 = require("@/lib/password");
const types_1 = require("@/types");
async function GET() {
    const { error, session } = await (0, api_helpers_1.requireRole)(types_1.UserRole.SCHOOL_ADMIN, types_1.UserRole.SUPER_ADMIN);
    if (error)
        return error;
    await (0, mongoose_1.connectDB)();
    const filter = session.user.schoolId ? { schoolId: session.user.schoolId } : {};
    const teachers = await Teacher_1.default.find(filter).populate("userId", "name email createdAt").lean();
    // Attach classes for each teacher
    const withClasses = await Promise.all(teachers.map(async (t) => {
        const classes = await Class_1.default.find({ teacherId: t._id }).select("name grade").lean();
        return { ...t, classes };
    }));
    return (0, api_helpers_1.ok)(withClasses);
}
async function POST(req) {
    const { error, session } = await (0, api_helpers_1.requireRole)(types_1.UserRole.SCHOOL_ADMIN);
    if (error)
        return error;
    await (0, mongoose_1.connectDB)();
    const { name, email, password } = await req.json();
    if (!name || !email || !password)
        return (0, api_helpers_1.err)("name, email and password are required");
    const schoolId = session.user.schoolId;
    if (!schoolId)
        return (0, api_helpers_1.err)("No school associated with this admin", 400);
    const existing = await User_1.default.findOne({ email: email.toLowerCase() });
    if (existing)
        return (0, api_helpers_1.err)("A user with this email already exists");
    const hashed = await (0, password_1.hashPassword)(password);
    const user = await User_1.default.create({ name, email, password: hashed, role: "TEACHER" });
    const teacher = await Teacher_1.default.create({ userId: user._id, schoolId });
    return (0, api_helpers_1.ok)({ ...teacher.toObject(), user: { _id: user._id, name: user.name, email: user.email } }, 201);
}
//# sourceMappingURL=route.js.map