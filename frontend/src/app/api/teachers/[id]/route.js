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
const User_1 = __importDefault(require("@/models/User"));
const Teacher_1 = __importDefault(require("@/models/Teacher"));
const api_helpers_1 = require("@/lib/api-helpers");
const types_1 = require("@/types");
async function GET(_, { params }) {
    const { error } = await (0, api_helpers_1.requireRole)(types_1.UserRole.SCHOOL_ADMIN, types_1.UserRole.SUPER_ADMIN);
    if (error)
        return error;
    await (0, mongoose_1.connectDB)();
    const { id } = await params;
    const teacher = await Teacher_1.default.findById(id).populate("userId", "name email createdAt").lean();
    if (!teacher)
        return (0, api_helpers_1.err)("Teacher not found", 404);
    return (0, api_helpers_1.ok)(teacher);
}
async function PATCH(req, { params }) {
    const { error } = await (0, api_helpers_1.requireRole)(types_1.UserRole.SCHOOL_ADMIN);
    if (error)
        return error;
    await (0, mongoose_1.connectDB)();
    const { id } = await params;
    const { name, email } = await req.json();
    const teacher = await Teacher_1.default.findById(id).lean();
    if (!teacher)
        return (0, api_helpers_1.err)("Teacher not found", 404);
    const user = await User_1.default.findByIdAndUpdate(teacher.userId, { name, email }, { new: true })
        .select("name email").lean();
    return (0, api_helpers_1.ok)(user);
}
async function DELETE(_, { params }) {
    const { error } = await (0, api_helpers_1.requireRole)(types_1.UserRole.SCHOOL_ADMIN);
    if (error)
        return error;
    await (0, mongoose_1.connectDB)();
    const { id } = await params;
    const teacher = await Teacher_1.default.findById(id);
    if (!teacher)
        return (0, api_helpers_1.err)("Teacher not found", 404);
    await User_1.default.findByIdAndDelete(teacher.userId);
    await teacher.deleteOne();
    return (0, api_helpers_1.ok)({ message: "Teacher removed" });
}
//# sourceMappingURL=route.js.map