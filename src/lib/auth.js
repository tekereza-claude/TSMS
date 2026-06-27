"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authOptions = void 0;
const next_auth_1 = require("next-auth");
const credentials_1 = __importDefault(require("next-auth/providers/credentials"));
const argon2 = __importStar(require("argon2"));
const mongoose_1 = require("@/lib/mongoose");
const User_1 = __importDefault(require("@/models/User"));
const SchoolAdmin_1 = __importDefault(require("@/models/SchoolAdmin"));
const Teacher_1 = __importDefault(require("@/models/Teacher"));
const types_1 = require("@/types");
exports.authOptions = {
    providers: [
        (0, credentials_1.default)({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password)
                    return null;
                await (0, mongoose_1.connectDB)();
                const user = await User_1.default.findOne({ email: credentials.email.toLowerCase() }).lean();
                if (!user)
                    return null;
                const valid = await argon2.verify(user.password, credentials.password);
                if (!valid)
                    return null;
                // Resolve schoolId from whichever relation exists
                let schoolId;
                if (user.role === "SCHOOL_ADMIN") {
                    const sa = await SchoolAdmin_1.default.findOne({ userId: user._id }).lean();
                    schoolId = sa?.schoolId?.toString();
                }
                else if (user.role === "TEACHER") {
                    const t = await Teacher_1.default.findOne({ userId: user._id }).lean();
                    schoolId = t?.schoolId?.toString();
                }
                return {
                    id: user._id.toString(),
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    schoolId,
                };
            },
        }),
    ],
    session: { strategy: "jwt" },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
                token.schoolId = user.schoolId;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.sub;
                session.user.role = token.role;
                session.user.schoolId = token.schoolId;
            }
            return session;
        },
    },
    pages: { signIn: "/auth/signin" },
};
//# sourceMappingURL=auth.js.map