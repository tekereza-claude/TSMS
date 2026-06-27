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
const Payment_1 = __importDefault(require("@/models/Payment"));
const School_1 = __importDefault(require("@/models/School"));
// GET /api/payments?schoolId=... — super admin lists recorded payments
async function GET(req) {
    const { error } = await (0, api_helpers_1.requireRole)(types_1.UserRole.SUPER_ADMIN);
    if (error)
        return error;
    await (0, mongoose_1.connectDB)();
    const { searchParams } = new URL(req.url);
    const schoolId = searchParams.get("schoolId");
    const filter = {};
    if (schoolId)
        filter.schoolId = schoolId;
    const payments = await Payment_1.default.find(filter)
        .populate("schoolId", "name email")
        .sort({ date: -1 })
        .lean();
    return (0, api_helpers_1.ok)(payments);
}
// POST /api/payments — super admin records a payment received from a school
async function POST(req) {
    const { error, session } = await (0, api_helpers_1.requireRole)(types_1.UserRole.SUPER_ADMIN);
    if (error)
        return error;
    await (0, mongoose_1.connectDB)();
    const { schoolId, amount, currency, date, method, note } = (await req.json());
    if (!schoolId)
        return (0, api_helpers_1.err)("schoolId is required");
    if (typeof amount !== "number" || isNaN(amount) || amount <= 0) {
        return (0, api_helpers_1.err)("amount must be a positive number");
    }
    const school = await School_1.default.findById(schoolId).select("_id").lean();
    if (!school)
        return (0, api_helpers_1.err)("School not found", 404);
    const payment = await Payment_1.default.create({
        schoolId,
        amount,
        currency: currency?.trim() || "USD",
        date: date ? new Date(date) : undefined,
        method: method?.trim() || undefined,
        note: note?.trim() || undefined,
        recordedBy: session.user.id,
    });
    return (0, api_helpers_1.ok)(await Payment_1.default.findById(payment._id).populate("schoolId", "name email").lean(), 201);
}
//# sourceMappingURL=route.js.map