"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.metadata = void 0;
exports.default = RootLayout;
const jsx_runtime_1 = require("react/jsx-runtime");
const google_1 = require("next/font/google");
require("./globals.css");
const session_provider_1 = require("@/components/providers/session-provider");
const ChatWidget_1 = __importDefault(require("@/components/chatbot/ChatWidget"));
const LanguageContext_1 = require("@/lib/i18n/LanguageContext");
const manrope = (0, google_1.Manrope)({
    variable: "--font-manrope",
    subsets: ["latin"],
});
const fraunces = (0, google_1.Fraunces)({
    variable: "--font-fraunces",
    subsets: ["latin"],
});
exports.metadata = {
    title: "TSMS | Teleparenting School Management System",
    description: "Multi-tenant school management platform connecting schools, teachers, and parents in real time.",
};
function RootLayout({ children, }) {
    return ((0, jsx_runtime_1.jsx)("html", { lang: "en", children: (0, jsx_runtime_1.jsx)("body", { className: `${manrope.variable} ${fraunces.variable} antialiased`, children: (0, jsx_runtime_1.jsx)(session_provider_1.SessionWrapper, { children: (0, jsx_runtime_1.jsxs)(LanguageContext_1.LanguageProvider, { children: [children, (0, jsx_runtime_1.jsx)(ChatWidget_1.default, {})] }) }) }) }));
}
//# sourceMappingURL=layout.js.map