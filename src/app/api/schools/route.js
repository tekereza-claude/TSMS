"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const server_1 = require("next/server");
const mongoose_1 = require("@/lib/mongoose");
const School_1 = __importDefault(require("@/models/School"));
const SchoolAdmin_1 = __importDefault(require("@/models/SchoolAdmin"));
const Subscription_1 = __importDefault(require("@/models/Subscription"));
const api_helpers_1 = require("@/lib/api-helpers");
const types_1 = require("@/types");
async function GET() {
    const { error, session } = await (0, api_helpers_1.requireRole)(types_1.UserRole.SUPER_ADMIN, types_1.UserRole.SCHOOL_ADMIN);
    if (error)
        return error;
    await (0, mongoose_1.connectDB)();
    if (session.user.role === types_1.UserRole.SCHOOL_ADMIN) {
        const sa = await SchoolAdmin_1.default.findOne({ userId: session.user.id }).lean();
        if (!sa)
            return (0, api_helpers_1.err)("School admin record not found", 404);
        const school = await School_1.default.findById(sa.schoolId).lean();
        const sub = await Subscription_1.default.findOne({ schoolId: sa.schoolId }).lean();
        return (0, api_helpers_1.ok)({ ...school, subscription: sub });
    }
    const schools = await School_1.default.find().sort({ createdAt: -1 }).lean();
    const subs = await Subscription_1.default.find().lean();
    const subMap = Object.fromEntries(subs.map((s) => [s.schoolId.toString(), s]));
    return (0, api_helpers_1.ok)(schools.map((s) => ({ ...s, subscription: subMap[s._id.toString()] ?? null })));
}
async function POST(req) {
    const { error } = await (0, api_helpers_1.requireRole)(types_1.UserRole.SUPER_ADMIN);
    if (error)
        return error;
    await (0, mongoose_1.connectDB)();
    const { name, email, address, phone } = await req.json();
    if (!name || !email)
        return (0, api_helpers_1.err)("name and email are required");
    const existing = await School_1.default.findOne({ email: email.toLowerCase() });
    if (existing)
        return (0, api_helpers_1.err)("A school with this email already exists");
    const school = await School_1.default.create({ name, email, address, phone });
    return (0, api_helpers_1.ok)(school, 201);
}
//# sourceMappingURL=route.js.map