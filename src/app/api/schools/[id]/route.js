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
const School_1 = __importDefault(require("@/models/School"));
const api_helpers_1 = require("@/lib/api-helpers");
const types_1 = require("@/types");
async function GET(_, { params }) {
    const { error } = await (0, api_helpers_1.requireRole)(types_1.UserRole.SUPER_ADMIN, types_1.UserRole.SCHOOL_ADMIN);
    if (error)
        return error;
    await (0, mongoose_1.connectDB)();
    const { id } = await params;
    const school = await School_1.default.findById(id).lean();
    if (!school)
        return (0, api_helpers_1.err)("School not found", 404);
    return (0, api_helpers_1.ok)(school);
}
async function PATCH(req, { params }) {
    const { error } = await (0, api_helpers_1.requireRole)(types_1.UserRole.SUPER_ADMIN);
    if (error)
        return error;
    await (0, mongoose_1.connectDB)();
    const { id } = await params;
    const body = await req.json();
    const school = await School_1.default.findByIdAndUpdate(id, body, { new: true }).lean();
    if (!school)
        return (0, api_helpers_1.err)("School not found", 404);
    return (0, api_helpers_1.ok)(school);
}
async function DELETE(_, { params }) {
    const { error } = await (0, api_helpers_1.requireRole)(types_1.UserRole.SUPER_ADMIN);
    if (error)
        return error;
    await (0, mongoose_1.connectDB)();
    const { id } = await params;
    await School_1.default.findByIdAndDelete(id);
    return (0, api_helpers_1.ok)({ message: "School deleted" });
}
//# sourceMappingURL=route.js.map