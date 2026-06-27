"use client";
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SignIn;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_2 = require("next-auth/react");
const navigation_1 = require("next/navigation");
const link_1 = __importDefault(require("next/link"));
const LanguageContext_1 = require("@/lib/i18n/LanguageContext");
const LanguageToggle_1 = __importDefault(require("@/components/LanguageToggle"));
function SignIn() {
    const { t } = (0, LanguageContext_1.useLanguage)();
    const [email, setEmail] = (0, react_1.useState)("");
    const [password, setPassword] = (0, react_1.useState)("");
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)("");
    const router = (0, navigation_1.useRouter)();
    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        try {
            const result = await (0, react_2.signIn)("credentials", {
                email,
                password,
                redirect: false,
            });
            if (result?.error) {
                setError(t.invalidCredentials);
            }
            else {
                const session = await (0, react_2.getSession)();
                if (session?.user?.role) {
                    // Redirect based on role
                    switch (session.user.role) {
                        case "SUPER_ADMIN":
                            router.push("/super-admin");
                            break;
                        case "SCHOOL_ADMIN":
                            router.push("/school-admin");
                            break;
                        case "TEACHER":
                            router.push("/teacher");
                            break;
                        case "PARENT":
                            router.push("/parent");
                            break;
                        default:
                            router.push("/");
                    }
                }
            }
        }
        catch (error) {
            setError(t.signInError);
        }
        finally {
            setIsLoading(false);
        }
    };
    return ((0, jsx_runtime_1.jsx)("div", { className: "min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8", children: (0, jsx_runtime_1.jsxs)("div", { className: "max-w-md w-full space-y-8", children: [(0, jsx_runtime_1.jsx)("div", { className: "flex justify-end", children: (0, jsx_runtime_1.jsx)(LanguageToggle_1.default, {}) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("div", { className: "mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100", children: (0, jsx_runtime_1.jsx)("div", { className: "h-8 w-8 rounded bg-blue-600" }) }), (0, jsx_runtime_1.jsx)("h2", { className: "mt-6 text-center text-3xl font-extrabold text-gray-900", children: t.signInTitle }), (0, jsx_runtime_1.jsx)("p", { className: "mt-2 text-center text-sm text-gray-600", children: t.signInSubtitle })] }), (0, jsx_runtime_1.jsxs)("form", { className: "mt-8 space-y-6", onSubmit: handleSubmit, children: [error && ((0, jsx_runtime_1.jsx)("div", { className: "rounded-md bg-red-50 p-4", children: (0, jsx_runtime_1.jsx)("div", { className: "text-sm text-red-800", children: error }) })), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-md shadow-sm -space-y-px", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "email", className: "sr-only", children: "Email address" }), (0, jsx_runtime_1.jsx)("input", { id: "email", name: "email", type: "email", autoComplete: "email", required: true, className: "appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm", placeholder: t.emailPlaceholder, value: email, onChange: (e) => setEmail(e.target.value) })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "password", className: "sr-only", children: "Password" }), (0, jsx_runtime_1.jsx)("input", { id: "password", name: "password", type: "password", autoComplete: "current-password", required: true, className: "appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm", placeholder: t.passwordPlaceholder, value: password, onChange: (e) => setPassword(e.target.value) })] })] }), (0, jsx_runtime_1.jsx)("div", { children: (0, jsx_runtime_1.jsx)("button", { type: "submit", disabled: isLoading, className: "group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50", children: isLoading ? t.signingIn : t.signIn }) }), (0, jsx_runtime_1.jsx)("div", { className: "text-sm", children: (0, jsx_runtime_1.jsx)(link_1.default, { href: "/", className: "font-medium text-blue-600 hover:text-blue-500", children: t.backToHome }) })] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-6 border-t border-gray-200 pt-6", children: [(0, jsx_runtime_1.jsxs)("p", { className: "text-xs text-gray-500 text-center", children: [t.demoAccounts, " (run ", (0, jsx_runtime_1.jsx)("code", { className: "bg-gray-100 px-1 rounded", children: "npm run db:seed" }), " first):"] }), (0, jsx_runtime_1.jsxs)("div", { className: "mt-2 space-y-1 text-xs text-gray-600", children: [(0, jsx_runtime_1.jsx)("p", { children: "Super Admin: superadmin@tsms.dev / superadmin123" }), (0, jsx_runtime_1.jsx)("p", { children: "School Admin: alice@greenfield.edu / schooladmin123" }), (0, jsx_runtime_1.jsx)("p", { children: "Teacher: bob@greenfield.edu / teacher123" }), (0, jsx_runtime_1.jsx)("p", { children: "Parent: eve@parent.dev / parent123" })] })] })] }) }));
}
//# sourceMappingURL=page.js.map