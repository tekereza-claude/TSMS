"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PATCH = PATCH;
exports.DELETE = DELETE;
const server_1 = require("next/server");
const mongoose_1 = require("@/lib/mongoose");
const Subject_1 = __importDefault(require("@/models/Subject"));
const api_helpers_1 = require("@/lib/api-helpers");
const types_1 = require("@/types");
async function PATCH(req, { params }) {
    const { error } = await (0, api_helpers_1.requireRole)(types_1.UserRole.SCHOOL_ADMIN);
    if (error)
        return error;
    await (0, mongoose_1.connectDB)();
    const { id } = await params;
    const { name, code, teacherId } = await req.json();
    const subject = await Subject_1.default.findByIdAndUpdate(id, { name, code, teacherId: teacherId || null }, { new: true }).lean();
    if (!subject)
        return (0, api_helpers_1.err)("Subject not found", 404);
    return (0, api_helpers_1.ok)(subject);
}
async function DELETE(_, { params }) {
    const { error } = await (0, api_helpers_1.requireRole)(types_1.UserRole.SCHOOL_ADMIN);
    if (error)
        return error;
    await (0, mongoose_1.connectDB)();
    const { id } = await params;
    await Subject_1.default.findByIdAndDelete(id);
    return (0, api_helpers_1.ok)({ message: "Subject deleted" });
}
//# sourceMappingURL=route.js.map