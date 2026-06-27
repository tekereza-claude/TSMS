"use client";
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = LanguageToggle;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const outline_1 = require("@heroicons/react/24/outline");
const LanguageContext_1 = require("@/lib/i18n/LanguageContext");
const translations_1 = require("@/lib/i18n/translations");
const locales = ["en", "sw", "rw"];
function LanguageToggle() {
    const { locale, setLocale } = (0, LanguageContext_1.useLanguage)();
    const [open, setOpen] = (0, react_1.useState)(false);
    const ref = (0, react_1.useRef)(null);
    // Close on outside click
    (0, react_1.useEffect)(() => {
        function handle(e) {
            if (ref.current && !ref.current.contains(e.target))
                setOpen(false);
        }
        document.addEventListener("mousedown", handle);
        return () => document.removeEventListener("mousedown", handle);
    }, []);
    return ((0, jsx_runtime_1.jsxs)("div", { ref: ref, className: "relative", children: [(0, jsx_runtime_1.jsxs)("button", { onClick: () => setOpen((o) => !o), className: "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors", children: [(0, jsx_runtime_1.jsx)(outline_1.GlobeAltIcon, { className: "h-4 w-4 text-gray-500" }), translations_1.localeNames[locale], (0, jsx_runtime_1.jsx)(outline_1.ChevronDownIcon, { className: `h-3.5 w-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}` })] }), open && ((0, jsx_runtime_1.jsx)("div", { className: "absolute right-0 mt-1 w-40 rounded-lg border border-gray-200 bg-white shadow-lg z-50 overflow-hidden", children: locales.map((l) => ((0, jsx_runtime_1.jsx)("button", { onClick: () => { setLocale(l); setOpen(false); }, className: `w-full px-4 py-2.5 text-left text-sm transition-colors ${locale === l
                        ? "bg-blue-50 text-blue-600 font-medium"
                        : "text-gray-700 hover:bg-gray-50"}`, children: translations_1.localeNames[l] }, l))) }))] }));
}
//# sourceMappingURL=LanguageToggle.js.map