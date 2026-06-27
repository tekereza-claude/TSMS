"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionWrapper = SessionWrapper;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("next-auth/react");
const react_2 = require("react");
function SessionWrapper({ children }) {
    return (0, jsx_runtime_1.jsx)(react_1.SessionProvider, { children: children });
}
//# sourceMappingURL=session-provider.js.map