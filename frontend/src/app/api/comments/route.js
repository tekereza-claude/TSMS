"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
exports.POST = POST;
const server_1 = require("next/server");
const mongoose_1 = require("@/lib/mongoose");
const api_helpers_1 = require("@/lib/api-helpers");
const types_1 = require("@/types");
const Comment_1 = __importDefault(require("@/models/Comment"));
const Parent_1 = __importDefault(require("@/models/Parent"));
const Student_1 = __importDefault(require("@/models/Student"));
// GET /api/comments
//  - PARENT       → their own submitted comments
//  - SCHOOL_ADMIN → all comments addressed to their school (with parent name)
async function GET() {
    const { error, session } = await (0, api_helpers_1.requireRole)(types_1.UserRole.PARENT, types_1.UserRole.SCHOOL_ADMIN);
    if (error)
        return error;
    await (0, mongoose_1.connectDB)();
    if (session.user.role === types_1.UserRole.PARENT) {
        const parent = await Parent_1.default.findOne({ userId: session.user.id }).select("_id").lean();
        if (!parent)
            return (0, api_helpers_1.err)("Parent record not found", 404);
        const comments = await Comment_1.default.find({ parentId: parent._id }).sort({ createdAt: -1 }).lean();
        return (0, api_helpers_1.ok)(comments);
    }
    // SCHOOL_ADMIN
    const schoolId = session.user.schoolId;
    if (!schoolId)
        return (0, api_helpers_1.err)("No school associated with this account", 400);
    const comments = await Comment_1.default.find({ schoolId })
        .populate({ path: "parentId", populate: { path: "userId", select: "name email" } })
        .sort({ createdAt: -1 })
        .lean();
    return (0, api_helpers_1.ok)(comments);
}
// POST /api/comments — a parent leaves a message for their child's school
async function POST(req) {
    const { error, session } = await (0, api_helpers_1.requireRole)(types_1.UserRole.PARENT);
    if (error)
        return error;
    await (0, mongoose_1.connectDB)();
    const { message, regarding } = (await req.json());
    if (!message || !message.trim())
        return (0, api_helpers_1.err)("Message is required");
    const parent = await Parent_1.default.findOne({ userId: session.user.id }).lean();
    if (!parent)
        return (0, api_helpers_1.err)("Parent record not found", 404);
    // Derive the school from the parent's first child.
    const child = parent.studentIds?.length
        ? await Student_1.default.findById(parent.studentIds[0]).select("schoolId").lean()
        : null;
    if (!child?.schoolId)
        return (0, api_helpers_1.err)("No school could be determined for your account", 400);
    const comment = await Comment_1.default.create({
        parentId: parent._id,
        schoolId: child.schoolId,
        regarding: regarding?.trim() || undefined,
        message: message.trim(),
    });
    return (0, api_helpers_1.ok)(comment, 201);
}
//# sourceMappingURL=route.js.map