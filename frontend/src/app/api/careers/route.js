"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GET = GET;
const mongoose_1 = require("@/lib/mongoose");
const api_helpers_1 = require("@/lib/api-helpers");
const types_1 = require("@/types");
const CareerCluster_1 = __importDefault(require("@/models/CareerCluster"));
// GET /api/careers — career clusters that drive parent career insights.
// Reference data, readable by any authenticated user.
async function GET() {
    const { error } = await (0, api_helpers_1.requireRole)(types_1.UserRole.PARENT, types_1.UserRole.TEACHER, types_1.UserRole.SCHOOL_ADMIN, types_1.UserRole.SUPER_ADMIN);
    if (error)
        return error;
    await (0, mongoose_1.connectDB)();
    const clusters = await CareerCluster_1.default.find().sort({ order: 1, title: 1 }).lean();
    return (0, api_helpers_1.ok)(clusters);
}
//# sourceMappingURL=route.js.map