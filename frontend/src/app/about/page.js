"use client";
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = About;
const jsx_runtime_1 = require("react/jsx-runtime");
const link_1 = __importDefault(require("next/link"));
const react_1 = require("react");
const outline_1 = require("@heroicons/react/24/outline");
function About() {
    const [isLoaded, setIsLoaded] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        setIsLoaded(true);
    }, []);
    const team = [
        {
            name: "Sarah Johnson",
            role: "CEO & Founder",
            description: "Visionary leader with 15+ years in education technology",
            image: "/team/sarah.jpg"
        },
        {
            name: "Michael Chen",
            role: "CTO",
            description: "Tech expert specializing in scalable education platforms",
            image: "/team/michael.jpg"
        },
        {
            name: "Emily Rodriguez",
            role: "Head of Product",
            description: "User experience advocate and education specialist",
            image: "/team/emily.jpg"
        },
        {
            name: "David Kim",
            role: "Head of Operations",
            description: "Ensuring smooth operations for all partner schools",
            image: "/team/david.jpg"
        }
    ];
    const values = [
        {
            icon: outline_1.ShieldCheckIcon,
            title: "Security First",
            description: "Bank-level encryption and data protection for all users"
        },
        {
            icon: outline_1.UserGroupIcon,
            title: "User-Centric",
            description: "Designed with input from educators, parents, and students"
        },
        {
            icon: outline_1.ChartBarIcon,
            title: "Data-Driven",
            description: "Analytics and insights to improve educational outcomes"
        },
        {
            icon: outline_1.SparklesIcon,
            title: "Innovation",
            description: "Cutting-edge technology meeting traditional education"
        }
    ];
    return ((0, jsx_runtime_1.jsx)("div", { className: "min-h-screen bg-white", children: (0, jsx_runtime_1.jsxs)("div", { className: "relative z-10", children: [(0, jsx_runtime_1.jsx)("nav", { className: "border-b border-gray-200 bg-white", children: (0, jsx_runtime_1.jsx)("div", { className: "max-w-7xl mx-auto px-6 lg:px-8", children: (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between h-16", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-3", children: [(0, jsx_runtime_1.jsx)("div", { className: "h-10 w-10 rounded-lg bg-blue-600 flex items-center justify-center", children: (0, jsx_runtime_1.jsx)(outline_1.SparklesIcon, { className: "h-6 w-6 text-white" }) }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-xl font-bold text-gray-900", children: "TSMS" }), (0, jsx_runtime_1.jsx)("p", { className: "text-xs text-gray-500", children: "Teleparenting School Management" })] })] }), (0, jsx_runtime_1.jsxs)("div", { className: "hidden md:flex items-center space-x-4", children: [(0, jsx_runtime_1.jsx)(link_1.default, { href: "/", className: "text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium", children: "Home" }), (0, jsx_runtime_1.jsx)(link_1.default, { href: "/about", className: "text-blue-600 text-sm font-medium", children: "About Us" }), (0, jsx_runtime_1.jsx)(link_1.default, { href: "/contact", className: "text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium", children: "Contact Us" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "flex items-center space-x-4", children: [(0, jsx_runtime_1.jsx)(link_1.default, { href: "/auth/signin", className: "text-gray-600 hover:text-blue-600 transition-colors text-sm font-medium", children: "Sign In" }), (0, jsx_runtime_1.jsxs)(link_1.default, { href: "/auth/signin", className: "group relative inline-flex items-center justify-center rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700", children: ["Get Started", (0, jsx_runtime_1.jsx)(outline_1.ArrowRightIcon, { className: "ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" })] })] })] }) }) }), (0, jsx_runtime_1.jsx)("section", { className: "relative overflow-hidden", children: (0, jsx_runtime_1.jsx)("div", { className: "max-w-7xl mx-auto px-6 lg:px-8 py-24 lg:py-32", children: (0, jsx_runtime_1.jsxs)("div", { className: "text-center", children: [(0, jsx_runtime_1.jsxs)("h1", { className: `text-5xl lg:text-7xl font-bold text-gray-900 transition-all duration-1000 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`, children: ["About", (0, jsx_runtime_1.jsx)("span", { className: "block text-blue-600", children: "TSMS Platform" })] }), (0, jsx_runtime_1.jsx)("p", { className: `mx-auto mt-6 max-w-3xl text-lg lg:text-xl text-gray-600 transition-all duration-1000 delay-200 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`, children: "We're on a mission to transform education through technology, connecting schools, teachers, and parents in ways that were never before possible." })] }) }) }), (0, jsx_runtime_1.jsx)("section", { className: "relative py-24 bg-gray-50", children: (0, jsx_runtime_1.jsx)("div", { className: "max-w-7xl mx-auto px-6 lg:px-8", children: (0, jsx_runtime_1.jsxs)("div", { className: "grid gap-16 lg:grid-cols-2", children: [(0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsxs)("h2", { className: "text-4xl lg:text-5xl font-bold text-gray-900 mb-8", children: ["Our", (0, jsx_runtime_1.jsx)("span", { className: "block text-blue-600", children: "Mission" })] }), (0, jsx_runtime_1.jsx)("p", { className: "text-lg text-gray-600 mb-8 leading-relaxed", children: "TSMS exists to revolutionize how schools operate and how parents engage with their children's education. We believe that transparency, real-time communication, and data-driven insights are the keys to improving educational outcomes for every student." }), (0, jsx_runtime_1.jsx)("p", { className: "text-lg text-gray-600 leading-relaxed", children: "By providing a unified platform that serves all stakeholders - from administrators to parents - we're creating an ecosystem where every student can thrive with the support they need." })] }), (0, jsx_runtime_1.jsx)("div", { className: "relative", children: (0, jsx_runtime_1.jsxs)("div", { className: "relative border border-gray-200 bg-white rounded-2xl p-8 shadow-sm", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-2xl font-bold text-gray-900 mb-6", children: "Our Impact" }), (0, jsx_runtime_1.jsxs)("div", { className: "space-y-6", children: [(0, jsx_runtime_1.jsxs)("div", { className: "text-center", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-4xl font-bold text-blue-600", children: "500+" }), (0, jsx_runtime_1.jsx)("p", { className: "text-gray-600", children: "Schools Partnered" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "text-center", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-4xl font-bold text-blue-600", children: "50,000+" }), (0, jsx_runtime_1.jsx)("p", { className: "text-gray-600", children: "Students Supported" })] }), (0, jsx_runtime_1.jsxs)("div", { className: "text-center", children: [(0, jsx_runtime_1.jsx)("p", { className: "text-4xl font-bold text-blue-600", children: "98%" }), (0, jsx_runtime_1.jsx)("p", { className: "text-gray-600", children: "Parent Satisfaction" })] })] })] }) })] }) }) }), (0, jsx_runtime_1.jsx)("section", { className: "relative py-24", children: (0, jsx_runtime_1.jsxs)("div", { className: "max-w-7xl mx-auto px-6 lg:px-8", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-center mb-16", children: (0, jsx_runtime_1.jsxs)("h2", { className: "text-4xl lg:text-5xl font-bold text-gray-900", children: ["Our", (0, jsx_runtime_1.jsx)("span", { className: "block text-blue-600", children: "Core Values" })] }) }), (0, jsx_runtime_1.jsx)("div", { className: "grid gap-8 md:grid-cols-2 lg:grid-cols-4", children: values.map((value, index) => {
                                    const Icon = value.icon;
                                    return ((0, jsx_runtime_1.jsx)("div", { className: `group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-8 transition-all duration-700 hover:shadow-lg hover:border-blue-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`, style: { transitionDelay: `${400 + index * 100}ms` }, children: (0, jsx_runtime_1.jsxs)("div", { className: "relative p-8 text-center", children: [(0, jsx_runtime_1.jsx)("div", { className: "inline-flex h-16 w-16 items-center justify-center rounded-xl bg-blue-600 mb-6", children: (0, jsx_runtime_1.jsx)(Icon, { className: "h-8 w-8 text-white" }) }), (0, jsx_runtime_1.jsx)("h3", { className: "text-xl font-bold text-gray-900 mb-4", children: value.title }), (0, jsx_runtime_1.jsx)("p", { className: "text-gray-600 leading-relaxed", children: value.description })] }) }, index));
                                }) })] }) }), (0, jsx_runtime_1.jsx)("section", { className: "relative py-24 bg-gray-50", children: (0, jsx_runtime_1.jsxs)("div", { className: "max-w-7xl mx-auto px-6 lg:px-8", children: [(0, jsx_runtime_1.jsx)("div", { className: "text-center mb-16", children: (0, jsx_runtime_1.jsxs)("h2", { className: "text-4xl lg:text-5xl font-bold text-gray-900", children: ["Meet Our", (0, jsx_runtime_1.jsx)("span", { className: "block text-blue-600", children: "Leadership Team" })] }) }), (0, jsx_runtime_1.jsx)("div", { className: "grid gap-8 md:grid-cols-2 lg:grid-cols-4", children: team.map((member, index) => ((0, jsx_runtime_1.jsx)("div", { className: `group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-8 transition-all duration-700 hover:shadow-lg hover:border-blue-300 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`, style: { transitionDelay: `${600 + index * 150}ms` }, children: (0, jsx_runtime_1.jsxs)("div", { className: "relative p-8 text-center", children: [(0, jsx_runtime_1.jsx)("div", { className: "mx-auto h-24 w-24 rounded-full bg-blue-600 mb-6 flex items-center justify-center", children: (0, jsx_runtime_1.jsx)(outline_1.UserGroupIcon, { className: "h-12 w-12 text-white" }) }), (0, jsx_runtime_1.jsx)("h3", { className: "text-xl font-bold text-gray-900 mb-2", children: member.name }), (0, jsx_runtime_1.jsx)("p", { className: "text-blue-600 font-medium mb-4", children: member.role }), (0, jsx_runtime_1.jsx)("p", { className: "text-gray-600 text-sm", children: member.description })] }) }, index))) })] }) }), (0, jsx_runtime_1.jsx)("section", { className: "relative py-24", children: (0, jsx_runtime_1.jsx)("div", { className: "max-w-4xl mx-auto px-6 lg:px-8 text-center", children: (0, jsx_runtime_1.jsx)("div", { className: "relative overflow-hidden rounded-2xl bg-blue-600 p-12 lg:p-16", children: (0, jsx_runtime_1.jsxs)("div", { className: "relative", children: [(0, jsx_runtime_1.jsxs)("h2", { className: "text-4xl lg:text-5xl font-bold text-white mb-6", children: ["Ready to Join Our", (0, jsx_runtime_1.jsx)("span", { className: "block", children: "Mission?" })] }), (0, jsx_runtime_1.jsx)("p", { className: "text-xl text-blue-100 mb-8 max-w-2xl mx-auto", children: "Partner with us to transform education management in your institution." }), (0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col sm:flex-row gap-4 justify-center", children: [(0, jsx_runtime_1.jsx)(link_1.default, { href: "/contact", className: "inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 text-lg font-semibold text-blue-600 transition-all hover:bg-gray-100", children: "Contact Us" }), (0, jsx_runtime_1.jsx)(link_1.default, { href: "/auth/signin", className: "inline-flex items-center justify-center rounded-lg border border-white/30 bg-white/10 px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-white/20", children: "Start Free Trial" })] })] }) }) }) }), (0, jsx_runtime_1.jsx)("footer", { className: "border-t border-gray-200 bg-white", children: (0, jsx_runtime_1.jsx)("div", { className: "max-w-7xl mx-auto px-6 lg:px-8 py-12", children: (0, jsx_runtime_1.jsxs)("div", { className: "text-center", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-center space-x-3 mb-6", children: [(0, jsx_runtime_1.jsx)("div", { className: "h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center", children: (0, jsx_runtime_1.jsx)(outline_1.SparklesIcon, { className: "h-5 w-5 text-white" }) }), (0, jsx_runtime_1.jsx)("span", { className: "text-xl font-bold text-gray-900", children: "TSMS" })] }), (0, jsx_runtime_1.jsx)("p", { className: "text-gray-600 mb-2", children: "Empowering education through technology" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-500", children: "\u00A9 2024 Teleparenting School Management System" })] }) }) })] }) }));
}
//# sourceMappingURL=page.js.map