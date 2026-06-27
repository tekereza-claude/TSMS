"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = requireRole;
exports.ok = ok;
exports.err = err;
const next_auth_1 = require("next-auth");
const auth_1 = require("@/lib/auth");
const server_1 = require("next/server");
const types_1 = require("@/types");
async function requireRole(...roles) {
    const session = await (0, next_auth_1.getServerSession)(auth_1.authOptions);
    if (!session) {
        return { error: server_1.NextResponse.json({ error: "Unauthorized" }, { status: 401 }), session: null };
    }
    if (!roles.includes(session.user.role)) {
        return { error: server_1.NextResponse.json({ error: "Forbidden" }, { status: 403 }), session: null };
    }
    return { error: null, session };
}
function ok(data, status = 200) {
    return server_1.NextResponse.json(data, { status });
}
function err(message, status = 400) {
    return server_1.NextResponse.json({ error: message }, { status });
}
//# sourceMappingURL=api-helpers.js.map