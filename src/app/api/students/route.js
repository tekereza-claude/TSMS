"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const server_1 = require("next/server");
const mongoose_1 = require("@/lib/mongoose");
const Student_1 = __importDefault(require("@/models/Student"));
const Class_1 = __importDefault(require("@/models/Class"));
const Teacher_1 = __importDefault(require("@/models/Teacher"));
const api_helpers_1 = require("@/lib/api-helpers");
const types_1 = require("@/types");
async function GET() {
    const { error, session } = await (0, api_helpers_1.requireRole)(types_1.UserRole.SCHOOL_ADMIN, types_1.UserRole.TEACHER, types_1.UserRole.SUPER_ADMIN);
    if (error)
        return error;
    await (0, mongoose_1.connectDB)();
    const filter = session.user.schoolId ? { schoolId: session.user.schoolId } : {};
    // A teacher only sees students in the classes assigned to them.
    if (session.user.role === types_1.UserRole.TEACHER) {
        const teacher = await Teacher_1.default.findOne({ userId: session.user.id }).select("_id").lean();
        const classes = await Class_1.default.find({ teacherId: teacher?._id }).select("_id").lean();
        filter.classId = { $in: classes.map((c) => c._id) };
    }
    const students = await Student_1.default.find(filter).populate("classId", "name grade").sort({ firstName: 1 }).lean();
    return (0, api_helpers_1.ok)(students);
}
async function POST(req) {
    const { error, session } = await (0, api_helpers_1.requireRole)(types_1.UserRole.SCHOOL_ADMIN);
    if (error)
        return error;
    await (0, mongoose_1.connectDB)();
    const { firstName, lastName, email, classId, profilePicture } = await req.json();
    if (!firstName || !lastName)
        return (0, api_helpers_1.err)("firstName and lastName are required");
    const schoolId = session.user.schoolId;
    if (!schoolId)
        return (0, api_helpers_1.err)("No school associated with this admin", 400);
    const student = await Student_1.default.create({
        firstName,
        lastName,
        email: email || undefined,
        schoolId,
        classId: classId || undefined,
        profilePicture: profilePicture || undefined,
    });
    return (0, api_helpers_1.ok)(student, 201);
}
//# sourceMappingURL=route.js.map