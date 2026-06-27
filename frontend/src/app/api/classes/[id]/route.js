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
const Class_1 = __importDefault(require("@/models/Class"));
const Student_1 = __importDefault(require("@/models/Student"));
const api_helpers_1 = require("@/lib/api-helpers");
const types_1 = require("@/types");
async function GET(_, { params }) {
    const { error } = await (0, api_helpers_1.requireRole)(types_1.UserRole.SCHOOL_ADMIN, types_1.UserRole.TEACHER);
    if (error)
        return error;
    await (0, mongoose_1.connectDB)();
    const { id } = await params;
    const cls = await Class_1.default.findById(id).populate("teacherId").lean();
    if (!cls)
        return (0, api_helpers_1.err)("Class not found", 404);
    const students = await Student_1.default.find({ classId: id }).lean();
    return (0, api_helpers_1.ok)({ ...cls, students });
}
async function PATCH(req, { params }) {
    const { error } = await (0, api_helpers_1.requireRole)(types_1.UserRole.SCHOOL_ADMIN);
    if (error)
        return error;
    await (0, mongoose_1.connectDB)();
    const { id } = await params;
    const { name, grade, teacherId } = await req.json();
    const cls = await Class_1.default.findByIdAndUpdate(id, { name, grade, teacherId }, { new: true }).lean();
    if (!cls)
        return (0, api_helpers_1.err)("Class not found", 404);
    return (0, api_helpers_1.ok)(cls);
}
async function DELETE(_, { params }) {
    const { error } = await (0, api_helpers_1.requireRole)(types_1.UserRole.SCHOOL_ADMIN);
    if (error)
        return error;
    await (0, mongoose_1.connectDB)();
    const { id } = await params;
    await Class_1.default.findByIdAndDelete(id);
    return (0, api_helpers_1.ok)({ message: "Class deleted" });
}
//# sourceMappingURL=route.js.map